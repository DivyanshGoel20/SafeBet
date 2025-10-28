import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { 
  getAllMarkets, 
  getMarketDetails, 
  getUserStake, 
  hasUserClaimed,
  getTimeLeftForBetting,
  getUSDCAllowance,
  approveUSDC,
  fetchHermesPriceUpdate,
  MARKET_STATES,
  MARKET_SIDES,
  getMarketFactoryContract,
  getMarketContract,
  CONTRACT_ADDRESSES
} from '../utils/contracts';
import { useNotification } from '@blockscout/app-sdk';

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
  const [factoryAddress, setFactoryAddress] = useState('0x707d5C8871F5cA6fa985fB8b3Be9dff8c09C9ed1');
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);
  const { openTxToast } = useNotification();
  const readProviderRef = useRef(null);

  // Stable read-only provider on Arbitrum Sepolia to avoid wallet rate limits
  useEffect(() => {
    if (!readProviderRef.current) {
      try {
        readProviderRef.current = new ethers.JsonRpcProvider('https://sepolia-rollup.arbitrum.io/rpc');
      } catch (err) {
        console.error('Failed to create read provider:', err);
      }
    }
  }, []);

  const initializeMarketContext = (providerInstance, accountAddress, factoryAddr) => {
    console.log('Initializing MarketContext:', { providerInstance: !!providerInstance, accountAddress, factoryAddr });
    setProvider(providerInstance);
    setAccount(accountAddress);
    if (factoryAddr) {
      setFactoryAddress(factoryAddr);
    }
  };

  // Load all markets from factory
  const isLoadingRef = useRef(false);
  const loadMarkets = async () => {
    if (!provider || !factoryAddress) {
      console.warn('Provider or factory address not set', { provider: !!provider, factoryAddress });
      return;
    }

    if (isLoadingRef.current) {
      // Prevent overlapping loads which can cause MetaMask rate limiting
      return;
    }

    isLoadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const readProvider = readProviderRef.current || provider;
      const marketAddresses = await getAllMarkets(readProvider, factoryAddress);

      // Concurrency limiter: process details in small chunks to avoid RPC rate limits
      const chunkSize = 3; // safe parallelism
      const details = [];

      const retryGetDetails = async (address, attempts = 2) => {
        for (let i = 0; i <= attempts; i++) {
          try {
            return await getMarketDetails(provider, address);
          } catch (err) {
            if (i === attempts) throw err;
            // small backoff before retry
            await new Promise(r => setTimeout(r, 300 * (i + 1)));
          }
        }
      };

      for (let i = 0; i < marketAddresses.length; i += chunkSize) {
        const slice = marketAddresses.slice(i, i + chunkSize);
        const sliceResults = await Promise.all(
          slice.map(async (address) => {
            try {
              // Skip addresses without code (EOA or wrong network)
              const code = await (readProvider.getCode ? readProvider.getCode(address) : '0x1');
              if (!code || code === '0x') {
                console.warn('Skipping non-contract address from factory:', address);
                return null;
              }
              return await retryGetDetails(address);
            } catch (err) {
              console.error(`Error loading market ${address}:`, err);
              return null;
            }
          })
        );
        details.push(...sliceResults);
      }

      const validMarkets = details.filter(Boolean);
      setMarkets(validMarkets);
    } catch (err) {
      console.error('Error loading markets:', err);
      setError(err.message || 'Failed to load markets');
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
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
      question,
      symbol
    } = marketData;

    try {
      const tx = await factory.connect(signer).createMarket(
        usdcAddress,
        aavePool,
        pythContract,
        pythPriceId,
        targetPrice,
        resolveDate,
        question,
        symbol
      );

      await tx.wait();
      
      // Get the market address from the transaction receipt
      const receipt = await tx.wait();
      const marketCreatedEvent = receipt.logs.find(log => {
        try {
          const decoded = factory.interface.parseLog(log);
          return decoded.name === 'MarketCreated';
        } catch (e) {
          return false;
        }
      });
      
      const marketAddress = marketCreatedEvent ? marketCreatedEvent.address : null;
      
      // Show BlockScout transaction toast
      await openTxToast("1500", tx.hash); // Arbitrum Sepolia chain ID
      
      // Reload markets after creation
      await loadMarkets();
      
      return tx;
    } catch (err) {
      console.error('Error creating market:', err);
      
      // Handle user rejection gracefully
      if (err.code === 'ACTION_REJECTED' || err.message?.includes('user rejected')) {
        throw new Error('Transaction was cancelled by user');
      }
      
      // Handle insufficient balance errors
      if (err.reason?.includes('transfer amount exceeds balance') || 
          err.message?.includes('transfer amount exceeds balance')) {
        throw new Error('Insufficient USDC balance. Please check your wallet balance.');
      }
      
      // Handle other common revert errors
      if (err.code === 'CALL_EXCEPTION' && err.reason) {
        throw new Error(`Transaction failed: ${err.reason}`);
      }
      
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
      
      // Show BlockScout transaction toast
      await openTxToast("1500", tx.hash); // Arbitrum Sepolia chain ID
      
      // Reload markets to update totals
      await loadMarkets();
      
      return tx;
    } catch (err) {
      console.error('Error placing bet:', err);
      
      // Handle user rejection gracefully
      if (err.code === 'ACTION_REJECTED' || err.message?.includes('user rejected')) {
        throw new Error('Transaction was cancelled by user');
      }
      
      // Handle insufficient balance errors
      if (err.reason?.includes('transfer amount exceeds balance') || 
          err.message?.includes('transfer amount exceeds balance')) {
        throw new Error('Insufficient USDC balance. Please check your wallet balance.');
      }
      
      // Handle other common revert errors
      if (err.code === 'CALL_EXCEPTION' && err.reason) {
        throw new Error(`Transaction failed: ${err.reason}`);
      }
      
      throw err;
    }
  };

  // Resolve a market
  const resolveMarket = async (marketAddress) => {
    if (!provider || !account) {
      throw new Error('Provider or account not set');
    }

    const market = getMarketContract(provider, marketAddress);
    const signer = await provider.getSigner();

    try {
      console.log('Starting market resolution for:', marketAddress);
      
      // Get market details to fetch pythPriceId
      const marketDetails = await getMarketDetails(provider, marketAddress);
      console.log('Market details:', marketDetails);
      
      if (!marketDetails.pythPriceId) {
        throw new Error('No Pyth price ID found for this market');
      }
      
      // Fetch price update from Hermes API
      console.log('Fetching price update from Hermes API...');
      const priceUpdate = await fetchHermesPriceUpdate(marketDetails.pythPriceId);
      console.log('Price update data received:', priceUpdate);
      
      // Send ETH value (0.00001 ETH = 10000000000000 wei)
      const ethValue = ethers.parseEther("0.00001");
      console.log('Sending ETH value:', ethValue.toString());
      
      const tx = await market.connect(signer).resolveMarket(priceUpdate, {
        value: ethValue
      });

      console.log('Transaction sent:', tx.hash);
      await tx.wait();
      
      // Show BlockScout transaction toast
      await openTxToast("1500", tx.hash); // Arbitrum Sepolia chain ID
      
      // Reload markets to update state
      await loadMarkets();
      
      return tx;
    } catch (err) {
      console.error('Error resolving market:', err);
      
      // Handle user rejection gracefully
      if (err.code === 'ACTION_REJECTED' || err.message?.includes('user rejected')) {
        throw new Error('Transaction was cancelled by user');
      }
      
      // Handle insufficient balance errors
      if (err.reason?.includes('transfer amount exceeds balance') || 
          err.message?.includes('transfer amount exceeds balance')) {
        throw new Error('Insufficient USDC balance. Please check your wallet balance.');
      }
      
      // Handle other common revert errors
      if (err.code === 'CALL_EXCEPTION' && err.reason) {
        throw new Error(`Transaction failed: ${err.reason}`);
      }
      
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
      
      // Show BlockScout transaction toast
      await openTxToast("1500", tx.hash); // Arbitrum Sepolia chain ID
      
      // Reload markets to update state
      await loadMarkets();
      
      return tx;
    } catch (err) {
      console.error('Error claiming winnings:', err);
      
      // Handle user rejection gracefully
      if (err.code === 'ACTION_REJECTED' || err.message?.includes('user rejected')) {
        throw new Error('Transaction was cancelled by user');
      }
      
      // Handle insufficient balance errors
      if (err.reason?.includes('transfer amount exceeds balance') || 
          err.message?.includes('transfer amount exceeds balance')) {
        throw new Error('Insufficient USDC balance. Please check your wallet balance.');
      }
      
      // Handle other common revert errors
      if (err.code === 'CALL_EXCEPTION' && err.reason) {
        throw new Error(`Transaction failed: ${err.reason}`);
      }
      
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
      
      // Handle user rejection gracefully
      if (err.code === 'ACTION_REJECTED' || err.message?.includes('user rejected')) {
        throw new Error('USDC approval was cancelled by user');
      }
      
      // Handle insufficient balance errors
      if (err.reason?.includes('transfer amount exceeds balance') || 
          err.message?.includes('transfer amount exceeds balance')) {
        throw new Error('Insufficient USDC balance. Please check your wallet balance.');
      }
      
      // Handle other common revert errors
      if (err.code === 'CALL_EXCEPTION' && err.reason) {
        throw new Error(`USDC approval failed: ${err.reason}`);
      }
      
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

  // Listen to on-chain BetPlaced events to show Blockscout toasts even when
  // transactions are initiated by external widgets (e.g., Nexus Bridge+Execute)
  useEffect(() => {
    if (!provider || markets.length === 0 || !account) {
      return;
    }

    // Listen via raw log filters for robustness (works regardless of Contract instance)
    const listeners = [];
    const topic0 = ethers.id('BetPlaced(address,uint8,uint256)');
    const accountTopic = '0x' + '0'.repeat(24 * 2) + account.slice(2).toLowerCase();

    markets.forEach((m) => {
      try {
        const filter = {
          address: m.address,
          topics: [topic0, accountTopic], // only events from connected wallet
        };
        const listener = (log) => {
          try {
            const txHash = log?.transactionHash || log?.hash;
            // Deduplicate and avoid replay when reconnecting listeners
            if (txHash && !seenTxsRef.current.has(txHash)) {
              seenTxsRef.current.add(txHash);
              openTxToast('1500', txHash);
            }
          } catch (e) {
            console.error('Error showing Blockscout toast for BetPlaced:', e);
          }
        };
        provider.on(filter, listener);
        listeners.push({ filter, listener });
      } catch (err) {
        console.error('Failed to attach raw BetPlaced listener for market', m.address, err);
      }
    });

    return () => {
      listeners.forEach(({ filter, listener }) => {
        try {
          provider.off(filter, listener);
        } catch (err) {
          // ignore
        }
      });
    };
  }, [provider, markets, account]);

  // Fallback: poll logs to ensure toasts even if provider.on does not fire (e.g., some EIP-1193 providers)
  const lastCheckedBlockRef = useRef(0);
  const seenTxsRef = useRef(new Set());
  const latestConfirmedBlockRef = useRef(0);

  useEffect(() => {
    if (!provider || markets.length === 0 || !account) {
      return;
    }

    let intervalId;
    const topic0 = ethers.id('BetPlaced(address,uint8,uint256)');
    const accountTopic = '0x' + '0'.repeat(24 * 2) + account.slice(2).toLowerCase();

    const poll = async () => {
      try {
        const currentBlock = await provider.getBlockNumber();
        // Only consider logs from the latest finalized range to avoid replaying old logs
        const finalityLag = 6; // skip the most recent N blocks to avoid re-orgs and duplicates
        const safeToBlock = Math.max(0, currentBlock - finalityLag);
        let fromBlock = lastCheckedBlockRef.current || safeToBlock;
        fromBlock = Math.min(fromBlock, safeToBlock);
        if (fromBlock < 0) fromBlock = 0;

        // On first run, skip historical logs entirely
        if (lastCheckedBlockRef.current === 0) {
          lastCheckedBlockRef.current = safeToBlock + 1;
          latestConfirmedBlockRef.current = safeToBlock;
          return;
        }

        for (const m of markets) {
          try {
            const logs = await provider.getLogs({
              address: m.address,
              topics: [topic0, accountTopic],
              fromBlock,
              toBlock: safeToBlock,
            });

            logs.forEach((log) => {
              const txHash = log.transactionHash;
              if (txHash && !seenTxsRef.current.has(txHash)) {
                seenTxsRef.current.add(txHash);
                openTxToast('1500', txHash);
              }
            });
          } catch (err) {
            // ignore per-market errors to keep polling
          }
        }

        lastCheckedBlockRef.current = safeToBlock + 1;
        latestConfirmedBlockRef.current = safeToBlock;
      } catch (err) {
        // keep polling even if a cycle fails
      }
    };

    // kick off immediately then poll
    poll();
    intervalId = setInterval(poll, 6000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [provider, markets, account]);

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
