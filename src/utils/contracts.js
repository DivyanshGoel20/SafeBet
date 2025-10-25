import { ethers } from 'ethers';

// MarketFactory Contract ABI
export const MARKET_FACTORY_ABI = [
  'function createMarket(address usdcAddress, address aavePool, address pythContract, bytes32 pythPriceId, int256 targetPrice, uint256 resolveDate, string memory question) external returns (address)',
  'function getAllMarkets() external view returns (address[])',
  'function numberOfMarkets() external view returns (uint256)',
  'function owner() external view returns (address)',
  'event MarketCreated(address indexed marketAddress, address indexed creator, string question, uint256 resolveDate)'
];

// Market Contract ABI
export const MARKET_ABI = [
  'function factory() external view returns (address)',
  'function creator() external view returns (address)',
  'function usdc() external view returns (address)',
  'function aavePool() external view returns (address)',
  'function pyth() external view returns (address)',
  'function pythPriceId() external view returns (bytes32)',
  'function targetPrice() external view returns (int256)',
  'function resolveDate() external view returns (uint256)',
  'function question() external view returns (string)',
  'function bettingDeadline() external view returns (uint256)',
  'function marketState() external view returns (uint8)',
  'function winningSide() external view returns (uint8)',
  'function totalYes() external view returns (uint256)',
  'function totalNo() external view returns (uint256)',
  'function totalPrincipal() external view returns (uint256)',
  'function resolvedInterest() external view returns (uint256)',
  'function totalWinningStakes() external view returns (uint256)',
  'function placeBetYes(uint256 amount) external',
  'function placeBetNo(uint256 amount) external',
  'function resolveMarket(bytes[] calldata priceUpdate) external payable',
  'function claim() external',
  'function cancelMarket() external',
  'function timeLeftForBetting() external view returns (uint256)',
  'function userStake(address user) external view returns (uint256 yesStake, uint256 noStake)',
  'function getTotals() external view returns (uint256 _totalYes, uint256 _totalNo)',
  'function claimed(address user) external view returns (bool)',
  'function withdrawLeftover(uint256 amount, address to) external',
  'event BetPlaced(address indexed user, uint8 side, uint256 amount)',
  'event MarketResolved(uint8 winningSide, uint256 totalPrincipal, uint256 interest)',
  'event Claimed(address indexed user, uint256 amount)',
  'event MarketCancelled()'
];

// USDC Contract ABI
export const USDC_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)'
];

// Contract addresses for Arbitrum Sepolia Testnet
export const CONTRACT_ADDRESSES = {
  MARKET_FACTORY: '0xDd844365a2D55982B9f1B03d78Fb317EdAf87200', // MarketFactory on Arbitrum Sepolia
  USDC: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d', // USDC on Arbitrum Sepolia
  AAVE_POOL: '', // Aave Pool address on Arbitrum Sepolia
  PYTH: '' // Pyth contract address on Arbitrum Sepolia
};

// Market States
export const MARKET_STATES = {
  ACTIVE: 0,
  RESOLVED: 1,
  CANCELLED: 2
};

// Market Sides
export const MARKET_SIDES = {
  NONE: 0,
  YES: 1,
  NO: 2
};

// Helper function to create MarketFactory contract instance
export const getMarketFactoryContract = (provider, factoryAddress) => {
  return new ethers.Contract(factoryAddress, MARKET_FACTORY_ABI, provider);
};

// Helper function to create Market contract instance
export const getMarketContract = (provider, marketAddress) => {
  return new ethers.Contract(marketAddress, MARKET_ABI, provider);
};

// Helper function to get all markets from factory
export const getAllMarkets = async (provider, factoryAddress) => {
  const factory = getMarketFactoryContract(provider, factoryAddress);
  return await factory.getAllMarkets();
};

// Helper function to get market details
export const getMarketDetails = async (provider, marketAddress) => {
  const market = getMarketContract(provider, marketAddress);
  
  const [
    factory,
    creator,
    usdc,
    aavePool,
    pyth,
    pythPriceId,
    targetPrice,
    resolveDate,
    question,
    bettingDeadline,
    marketState,
    winningSide,
    totalYes,
    totalNo,
    totalPrincipal,
    resolvedInterest,
    totalWinningStakes
  ] = await Promise.all([
    market.factory(),
    market.creator(),
    market.usdc(),
    market.aavePool(),
    market.pyth(),
    market.pythPriceId(),
    market.targetPrice(),
    market.resolveDate(),
    market.question(),
    market.bettingDeadline(),
    market.marketState(),
    market.winningSide(),
    market.totalYes(),
    market.totalNo(),
    market.totalPrincipal(),
    market.resolvedInterest(),
    market.totalWinningStakes()
  ]);

  return {
    address: marketAddress,
    factory,
    creator,
    usdc,
    aavePool,
    pyth,
    pythPriceId,
    targetPrice: targetPrice.toString(),
    resolveDate: resolveDate.toString(),
    question,
    bettingDeadline: bettingDeadline.toString(),
    marketState: Number(marketState),
    winningSide: Number(winningSide),
    totalYes: totalYes.toString(),
    totalNo: totalNo.toString(),
    totalPrincipal: totalPrincipal.toString(),
    resolvedInterest: resolvedInterest.toString(),
    totalWinningStakes: totalWinningStakes.toString()
  };
};

// Helper function to get user stake in a market
export const getUserStake = async (provider, marketAddress, userAddress) => {
  const market = getMarketContract(provider, marketAddress);
  const [yesStake, noStake] = await market.userStake(userAddress);
  return {
    yesStake: yesStake.toString(),
    noStake: noStake.toString()
  };
};

// Helper function to check if user has claimed
export const hasUserClaimed = async (provider, marketAddress, userAddress) => {
  const market = getMarketContract(provider, marketAddress);
  return await market.claimed(userAddress);
};

// Helper function to get time left for betting
export const getTimeLeftForBetting = async (provider, marketAddress) => {
  const market = getMarketContract(provider, marketAddress);
  return await market.timeLeftForBetting();
};

// Helper function to create USDC contract instance
export const getUSDCContract = (provider, usdcAddress) => {
  return new ethers.Contract(usdcAddress, USDC_ABI, provider);
};

// Helper function to check USDC allowance
export const getUSDCAllowance = async (provider, usdcAddress, owner, spender) => {
  const usdc = getUSDCContract(provider, usdcAddress);
  return await usdc.allowance(owner, spender);
};

// Helper function to approve USDC spending
export const approveUSDC = async (provider, usdcAddress, spender, amount) => {
  const usdc = getUSDCContract(provider, usdcAddress);
  const signer = await provider.getSigner();
  const tx = await usdc.connect(signer).approve(spender, amount);
  return tx;
};
