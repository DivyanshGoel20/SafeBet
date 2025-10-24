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

// Contract addresses (to be updated with deployed addresses)
export const CONTRACT_ADDRESSES = {
  MARKET_FACTORY: '', // Will be provided by user
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
  AAVE_POOL: '', // Aave Pool address on Base
  PYTH: '' // Pyth contract address on Base
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
