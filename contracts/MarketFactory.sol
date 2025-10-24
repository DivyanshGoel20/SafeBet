// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Market.sol";

contract MarketFactory {
    address public owner;
    address[] public allMarkets;
    event MarketCreated(address indexed marketAddress, address indexed creator, string question, uint256 resolveDate);

    constructor() {
        owner = msg.sender; // The deployer becomes the admin
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    function createMarket(
        address usdcAddress,
        address aavePool,           // Aave Pool contract address
        address pythContract,       // Pyth contract address (for price reads)
        bytes32 pythPriceId,        // Pyth price id for token (e.g., ETH/USD price id)
        int256 targetPrice,         // target price in same units as Pyth price (frontend must format)
        uint256 resolveDate,        // unix timestamp when market will be resolved
        string memory question
    ) external onlyOwner() returns (address) {
        require(resolveDate > block.timestamp, "resolveDate must be in future");
        Market m = new Market(
            msg.sender,
            usdcAddress,
            aavePool,
            pythContract,
            pythPriceId,
            targetPrice,
            resolveDate,
            question
        );
        allMarkets.push(address(m));
        emit MarketCreated(address(m), msg.sender, question, resolveDate);
        return address(m);
    }

    function getAllMarkets() external view returns (address[] memory) {
        return allMarkets;
    }

    function numberOfMarkets() external view returns (uint256) {
        return allMarkets.length;
    }
}
