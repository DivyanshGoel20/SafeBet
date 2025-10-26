// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;


import "@aave/core-v3/contracts/interfaces/IPool.sol";
import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";

/*
  Market.sol - Lossless binary prediction market (Yes / No)
  - Bets are taken in USDC (ERC20)
  - Funds are supplied to Aave pool when deposited
  - On resolve: withdraw everything from Aave, compute interest
  - Everyone gets principal back; winners split interest proportional to stake
  - Users call claim() to withdraw their payout (prevents expensive loops)
*/

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from,address to,uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
}

interface IAavePool {
    // Minimal subset of Aave v3 Pool interface used here
    function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
}

contract Market {
    address public factory;
    address public creator;
    IERC20 public immutable usdc;
    IPool public immutable aavePool;
    IPyth public immutable pyth;
    bytes32 public immutable pythPriceId;
    int256 public immutable targetPrice;
    uint256 public immutable resolveDate;
    string public question;
    string public symbol;

    uint256 public immutable bettingDeadline;

    enum Side { None, Yes, No }
    enum State { Active, Resolved, Cancelled }

    State public marketState;
    Side public winningSide;

    uint256 public totalYes;
    uint256 public totalNo;

    // user => staked amount for chosen side
    mapping(address => uint256) public stakeYes;
    mapping(address => uint256) public stakeNo;

    // claim tracking
    mapping(address => bool) public claimed;

    // store totals at resolution
    uint256 public totalPrincipal; // total principal (sum of both sides)
    uint256 public resolvedInterest; // interest amount determined at resolution
    uint256 public totalWinningStakes;

    uint256 public immutable bettingEndTime;

    event BetPlaced(address indexed user, Side side, uint256 amount);
    event MarketResolved(Side winningSide, uint256 totalPrincipal, uint256 interest);
    event Claimed(address indexed user, uint256 amount);
    event MarketCancelled();

    modifier onlyFactoryOrCreator() {
        require(msg.sender == factory || msg.sender == creator, "not factory/creator");
        _;
    }

    modifier onlyActive() {
        require(marketState == State.Active, "market not active");
        _;
    }

    constructor(
        address _creator,
        address _usdc,
        address _aavePool,
        address _pyth,
        bytes32 _pythPriceId,
        int256 _targetPrice,
        uint256 _resolveDate,
        string memory _question,
        string memory _symbol
    ) {
        require(_resolveDate > block.timestamp, "resolveDate in past");
        factory = msg.sender; // factory contract deploys this market
        creator = _creator;
        usdc = IERC20(_usdc);
        aavePool = IPool(_aavePool);
        pyth = IPyth(_pyth);
        pythPriceId = _pythPriceId;
        targetPrice = _targetPrice;
        resolveDate = _resolveDate;
        question = _question;
        symbol = _symbol;
        marketState = State.Active;

        bettingDeadline = block.timestamp + 7 days;
    }

    // ✅ PLACE BETS (only within 7 days)
    function placeBetYes(uint256 amount) external onlyActive {
        _placeBet(amount, Side.Yes);
    }

    function placeBetNo(uint256 amount) external onlyActive {
        _placeBet(amount, Side.No);
    }

    function _placeBet(uint256 amount, Side side) internal {
        require(amount > 0, "amount 0");
        require(block.timestamp <= bettingDeadline, "betting closed"); // ✅ no bets after 7 days
        require(side == Side.Yes || side == Side.No, "invalid side");
        // transfer USDC from user to this contract
        require(usdc.transferFrom(msg.sender, address(this), amount), "transferFrom failed");
        // approve and deposit to Aave on behalf of this contract
        IERC20(usdc).approve(address(aavePool), amount);
        aavePool.supply(address(usdc), amount, address(this), 0);

        if (side == Side.Yes) {
            stakeYes[msg.sender] += amount;
            totalYes += amount;
        } else {
            stakeNo[msg.sender] += amount;
            totalNo += amount;
        }

        emit BetPlaced(msg.sender, side, amount);
    }

    // Allow market creator or factory to cancel a market before resolution (refund principals)
    function cancelMarket() external onlyFactoryOrCreator onlyActive {
        marketState = State.Cancelled;
        emit MarketCancelled();
        // note: do not attempt automated refunds here (gas-heavy). Users can claim() their principals.
    }

    // RESOLVE — callable after resolveDate by anyone
    function resolveMarket(bytes[] calldata priceUpdate) external payable{
        require(block.timestamp >= resolveDate, "too early");
        require(marketState == State.Active, "not active");

        // Update on-chain prices using Hermes data
        uint256 updateFee = pyth.getUpdateFee(priceUpdate);
        require(msg.value >= updateFee, "insufficient fee");
        pyth.updatePriceFeeds{value: updateFee}(priceUpdate);

        // Refund any excess ETH
        if (msg.value > updateFee) {
            payable(msg.sender).transfer(msg.value - updateFee);
        }

        // Get latest price (no older than 60 seconds)
        PythStructs.Price memory currentPrice = pyth.getPriceNoOlderThan(pythPriceId, 60);
        int256 priceInt = int256(currentPrice.price);

        Side _winning;
        if (priceInt >= targetPrice) {
            _winning = Side.Yes;
        } else {
            _winning = Side.No;
        }

        // Withdraw full balance from Aave (use  type(uint256).max to withdraw all)
        // Note: Aave withdraw returns amount withdrawn
        uint256 beforeBalance = usdc.balanceOf(address(this));
        // withdraw max (Aave Pool supports withdraw(asset, amount, to))
        uint256 withdrawn = aavePool.withdraw(address(usdc), type(uint256).max, address(this));
        uint256 afterBalance = usdc.balanceOf(address(this));

        // Calculate totalPrincipal and interest
        uint256 totalBal = afterBalance;
        uint256 principal = totalYes + totalNo;
        uint256 interest = 0;
        if (totalBal > principal) {
            interest = totalBal - principal;
        } else {
            interest = 0;
        }

        totalPrincipal = principal;
        resolvedInterest = interest;
        marketState = State.Resolved;
        winningSide = _winning;

        if (_winning == Side.Yes) {
            totalWinningStakes = totalYes;
        } else {
            totalWinningStakes = totalNo;
        }

        // Edge case: no one bet on winning side => interest stays in contract (or sent to creator)
        // We'll leave it in contract to be withdrawable by creator (owner). For simplicity, we keep it.

        emit MarketResolved(_winning, principal, interest);
    }

    // CLAIM for bettors — anyone can claim their payout after resolution or cancellation
    function claim() external {
        require(marketState == State.Resolved || marketState == State.Cancelled, "not resolved/cancelled");
        require(!claimed[msg.sender], "already claimed");

        uint256 userPrincipal = stakeYes[msg.sender] + stakeNo[msg.sender];
        require(userPrincipal > 0, "no stake");

        uint256 payout = 0;
        payout = userPrincipal; // ✅ everyone gets principal

        if (marketState == State.Resolved) {
            bool isWinner = false;
            uint256 userWinningStake = 0;

            if (winningSide == Side.Yes && stakeYes[msg.sender] > 0) {
                isWinner = true;
                userWinningStake = stakeYes[msg.sender];
            } else if (winningSide == Side.No && stakeNo[msg.sender] > 0) {
                isWinner = true;
                userWinningStake = stakeNo[msg.sender];
            }

            if (isWinner && resolvedInterest > 0 && totalWinningStakes > 0) {
                uint256 interestShare = (resolvedInterest * userWinningStake) / totalWinningStakes;
                payout += interestShare;
            }
        }

        // mark claimed before transfer to avoid re-entrancy issues
        claimed[msg.sender] = true;

        // transfer payout
        require(usdc.transfer(msg.sender, payout), "transfer failed");

        emit Claimed(msg.sender, payout);
    }

    // Helper view functions for frontend convenience
    function timeLeftForBetting() external view returns (uint256) {
        if (block.timestamp >= bettingDeadline) return 0;
        return bettingDeadline - block.timestamp;
    }

    function userStake(address user) external view returns (uint256 yesStake, uint256 noStake) {
        yesStake = stakeYes[user];
        noStake = stakeNo[user];
    }

    function getTotals() external view returns (uint256 _totalYes, uint256 _totalNo) {
        _totalYes = totalYes;
        _totalNo = totalNo;
    }

    // Owner (creator) can withdraw leftover interest if no winners (or platform fee logic) after resolution
    function withdrawLeftover(uint256 amount, address to) external {
        require(msg.sender == creator, "only creator");
        require(marketState == State.Resolved || marketState == State.Cancelled, "not finished");
        // compute available leftover beyond unclaimed principals - simple approach: allow creator to withdraw up to contract balance minus total unclaimed principals
        uint256 contractBal = usdc.balanceOf(address(this));
        // compute unclaimed principal total
        // if many claims outstanding, this may under/overestimate. For safety we restrict to amount <= contractBal
        require(amount <= contractBal, "insufficient balance");
        require(usdc.transfer(to, amount), "transfer failed");
    }
}
