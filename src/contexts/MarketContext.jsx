import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { 
  getAllMarkets, 
  getMarketDetails, 
  getUserStake, 
  hasUserClaimed,
  getTimeLeftForBetting,
  getUSDCAllowance,
  approveUSDC,
  MARKET_STATES,
  MARKET_SIDES,
  getMarketFactoryContract,
  getMarketContract,
  CONTRACT_ADDRESSES
} from '../utils/contracts';

const MarketContext = createContext();

export const useMarket = () => {
  const context = useContext(MarketContext);
  if (!context) {
    throw new Error('useMarket must be used within a MarketProvider');
  }
  return context;
};

export const MarketProvider = ({ children }) => {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [factoryAddress, setFactoryAddress] = useState('0xDd844365a2D55982B9f1B03d78Fb317EdAf87200');
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);

  // Initialize market context with provider and account
  const initializeMarketContext = (providerInstance, accountAddress, factoryAddr) => {
    console.log('Initializing MarketContext:', { providerInstance: !!providerInstance, accountAddress, factoryAddr });
    setProvider(providerInstance);
    setAccount(accountAddress);
    if (factoryAddr) {
      setFactoryAddress(factoryAddr);
    }
  };

  // Load all markets from factory
  const loadMarkets = async () => {
    if (!provider || !factoryAddress) {
      console.warn('Provider or factory address not set', { provider: !!provider, factoryAddress });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const marketAddresses = await getAllMarkets(provider, factoryAddress);
      
      // Get details for each market
      const marketDetails = await Promise.all(
        marketAddresses.map(async (address) => {
          try {
            const details = await getMarketDetails(provider, address);
            return details;
          } catch (err) {
            console.error(`Error loading market ${address}:`, err);
            return null;
          }
        })
      );

      // Filter out null results and set markets
      const validMarkets = marketDetails.filter(market => market !== null);
      setMarkets(validMarkets);
    } catch (err) {
      console.error('Error loading markets:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get specific market by address
  const getMarket = (marketAddress) => {
    return markets.find(market => market.address.toLowerCase() === marketAddress.toLowerCase());
  };

  // Create a new market (admin only)
  const createMarket = async (marketData) => {
    if (!provider || !factoryAddress || !account) {
      throw new Error('Provider, factory address, or account not set');
    }

    const factory = getMarketFactoryContract(provider, factoryAddress);
    const signer = await provider.getSigner();

    const {
      usdcAddress,
      aavePool,
      pythContract,
      pythPriceId,
      targetPrice,
      resolveDate,
      question
    } = marketData;

    try {
      const tx = await factory.connect(signer).createMarket(
        usdcAddress,
        aavePool,
        pythContract,
        pythPriceId,
        targetPrice,
        resolveDate,
        question
      );

      await tx.wait();
      
      // Reload markets after creation
      await loadMarkets();
      
      return tx;
    } catch (err) {
      console.error('Error creating market:', err);
      throw err;
    }
  };

  // Place a bet on a market
  const placeBet = async (marketAddress, side, amount) => {
    if (!provider || !account) {
      throw new Error('Provider or account not set');
    }

    try {
      // Check and handle allowance if needed
      await checkAndHandleAllowance(marketAddress, amount);

      const market = getMarketContract(provider, marketAddress);
      const signer = await provider.getSigner();

      let tx;
      if (side === MARKET_SIDES.YES) {
        tx = await market.connect(signer).placeBetYes(amount);
      } else if (side === MARKET_SIDES.NO) {
        tx = await market.connect(signer).placeBetNo(amount);
      } else {
        throw new Error('Invalid side');
      }

      await tx.wait();
      
      // Reload markets to update totals
      await loadMarkets();
      
      return tx;
    } catch (err) {
      console.error('Error placing bet:', err);
      throw err;
    }
  };

  // Resolve a market
  const resolveMarket = async (marketAddress, priceUpdate) => {
    if (!provider || !account) {
      throw new Error('Provider or account not set');
    }

    const market = getMarketContract(provider, marketAddress);
    const signer = await provider.getSigner();

    try {
      // Get the update fee first
      const updateFee = await market.connect(signer).getUpdateFee(priceUpdate);
      
      const tx = await market.connect(signer).resolveMarket(priceUpdate, {
        value: updateFee
      });

      await tx.wait();
      
      // Reload markets to update state
      await loadMarkets();
      
      return tx;
    } catch (err) {
      console.error('Error resolving market:', err);
      throw err;
    }
  };

  // Claim winnings from a market
  const claimWinnings = async (marketAddress) => {
    if (!provider || !account) {
      throw new Error('Provider or account not set');
    }

    const market = getMarketContract(provider, marketAddress);
    const signer = await provider.getSigner();

    try {
      const tx = await market.connect(signer).claim();
      await tx.wait();
      
      // Reload markets to update state
      await loadMarkets();
      
      return tx;
    } catch (err) {
      console.error('Error claiming winnings:', err);
      throw err;
    }
  };

  // Get user's stake in a specific market
  const getUserMarketStake = async (marketAddress) => {
    if (!provider || !account) {
      return { yesStake: '0', noStake: '0' };
    }

    try {
      return await getUserStake(provider, marketAddress, account);
    } catch (err) {
      console.error('Error getting user stake:', err);
      return { yesStake: '0', noStake: '0' };
    }
  };

  // Check if user has claimed from a market
  const hasUserClaimedFromMarket = async (marketAddress) => {
    if (!provider || !account) {
      return false;
    }

    try {
      return await hasUserClaimed(provider, marketAddress, account);
    } catch (err) {
      console.error('Error checking claim status:', err);
      return false;
    }
  };

  // Get time left for betting on a market
  const getMarketTimeLeft = async (marketAddress) => {
    if (!provider) {
      return 0;
    }

    try {
      return await getTimeLeftForBetting(provider, marketAddress);
    } catch (err) {
      console.error('Error getting time left:', err);
      return 0;
    }
  };

  // Check and handle USDC allowance for a market
  const checkAndHandleAllowance = async (marketAddress, requiredAmount) => {
    if (!provider || !account) {
      throw new Error('Provider or account not set');
    }

    try {
      const marketDetails = await getMarketDetails(provider, marketAddress);
      const usdcAddress = marketDetails.usdc;
      
      const currentAllowance = await getUSDCAllowance(provider, usdcAddress, account, marketAddress);
      
      if (BigInt(currentAllowance) < BigInt(requiredAmount)) {
        console.log('Insufficient allowance, approving USDC...');
        // Approve a larger amount to avoid repeated approvals
        const approveAmount = BigInt(requiredAmount) * BigInt(10) > BigInt(1000 * 1e6) 
          ? BigInt(requiredAmount) * BigInt(10) 
          : BigInt(1000 * 1e6);
        
        const approveTx = await approveUSDC(provider, usdcAddress, marketAddress, approveAmount.toString());
        await approveTx.wait();
        console.log('USDC approved successfully for amount:', approveAmount.toString());
        return true;
      }
      
      return false; // No approval needed
    } catch (err) {
      console.error('Error handling allowance:', err);
      throw err;
    }
  };

  // Load markets when provider and factory address are available
  useEffect(() => {
    if (provider && factoryAddress) {
      console.log('Initial load: Loading markets with provider and factory address');
      loadMarkets();
    } else {
      console.log('Initial load: Skipping loadMarkets - missing provider or factory address', { provider: !!provider, factoryAddress });
    }
  }, [provider, factoryAddress]);

  const value = {
    markets,
    loading,
    error,
    factoryAddress,
    setFactoryAddress,
    initializeMarketContext,
    loadMarkets,
    getMarket,
    createMarket,
    placeBet,
    resolveMarket,
    claimWinnings,
    getUserMarketStake,
    hasUserClaimedFromMarket,
    getMarketTimeLeft,
    checkAndHandleAllowance
  };

  return (
    <MarketContext.Provider value={value}>
      {children}
    </MarketContext.Provider>
  );
};
