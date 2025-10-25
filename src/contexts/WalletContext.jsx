import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

const WalletContext = createContext();

// USDC contract address on Base network
const USDC_CONTRACT_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const USDC_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)'
];

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [usdcBalance, setUsdcBalance] = useState('0');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Check if wallet is already connected on component mount
  useEffect(() => {
    checkWalletConnection();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  // Fetch USDC balance when account changes
  useEffect(() => {
    if (account && provider) {
      fetchUSDCBalance();
    }
  }, [account, provider]);


  const checkWalletConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          await connectWallet();
        }
      } catch (err) {
        console.error('Error checking wallet connection:', err);
      }
    }
  };

  const connectWallet = async (walletType = 'metamask') => {
    // Check for different wallet providers
    let provider = null;
    
    if (walletType === 'metamask' && window.ethereum) {
      provider = window.ethereum;
    } else if (walletType === 'rabby' && window.rabby) {
      provider = window.rabby;
    } else if (walletType === 'coinbase' && window.coinbaseWalletExtension) {
      provider = window.coinbaseWalletExtension;
    } else if (walletType === 'walletconnect') {
      // For WalletConnect, we'd need to implement the WalletConnect provider
      setError('WalletConnect integration coming soon!');
      return;
    } else {
      setError(`${walletType.charAt(0).toUpperCase() + walletType.slice(1)} is not installed. Please install the wallet to continue.`);
      return;
    }

    if (!provider) {
      setError('No wallet provider found. Please install a supported wallet.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Request account access
      const accounts = await provider.request({
        method: 'eth_requestAccounts'
      });

      // Check if we're on Base Sepolia Testnet
      const chainId = await provider.request({ method: 'eth_chainId' });
      const baseSepoliaChainId = '0x14a34'; // Base Sepolia Testnet

      if (chainId !== baseSepoliaChainId) {
        try {
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: baseSepoliaChainId }],
          });
        } catch (switchError) {
          // If the network doesn't exist, add it
          if (switchError.code === 4902) {
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: baseSepoliaChainId,
                  chainName: 'Base Sepolia',
                  nativeCurrency: {
                    name: 'Ethereum',
                    symbol: 'ETH',
                    decimals: 18,
                  },
                  rpcUrls: ['https://sepolia.base.org'],
                  blockExplorerUrls: ['https://sepolia.basescan.org'],
                },
              ],
            });
          } else {
            throw switchError;
          }
        }
      }

      // Create provider and signer
      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();
      const address = await signer.getAddress();

      setAccount(address);
      setProvider(ethersProvider);
      setSigner(signer);
      setIsConnected(true);
      setIsConnecting(false);
      
      console.log(`Connected to ${walletType} on Base Sepolia Testnet`);

    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError(err.message || 'Failed to connect wallet');
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setUsdcBalance('0');
    setIsConnected(false);
    setError(null);
  };

  const fetchUSDCBalance = async () => {
    if (!account || !provider) return;

    try {
      const contract = new ethers.Contract(USDC_CONTRACT_ADDRESS, USDC_ABI, provider);
      const balance = await contract.balanceOf(account);
      const decimals = await contract.decimals();
      const formattedBalance = ethers.formatUnits(balance, decimals);
      setUsdcBalance(formattedBalance);
    } catch (err) {
      console.error('Error fetching USDC balance:', err);
      setUsdcBalance('0');
    }
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      connectWallet();
    }
  };

  const handleChainChanged = (chainId) => {
    // Reload the page when chain changes
    window.location.reload();
  };

  const value = {
    account,
    provider,
    signer,
    usdcBalance,
    isConnected,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    fetchUSDCBalance
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
