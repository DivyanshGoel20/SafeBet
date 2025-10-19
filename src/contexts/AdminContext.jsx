import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { verifyAdminWithServer, validateAdminRequest, checkRateLimit } from '../utils/adminAPI';

const AdminContext = createContext();

// Your admin wallet address - CHANGE THIS TO YOUR ACTUAL ADDRESS
const ADMIN_WALLET_ADDRESS = '0xFF65DC5C653c2A6C7C11986b06E5f45D5Ba88076'; // Replace with your address

// Optional: Smart contract for additional verification
const ADMIN_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000'; // Optional
const ADMIN_CONTRACT_ABI = [
  'function isAdmin(address account) view returns (bool)'
];

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminAddress, setAdminAddress] = useState(null);
  const [verificationError, setVerificationError] = useState(null);

  // Listen for wallet changes
  useEffect(() => {
    const handleWalletChange = () => {
      // Reset admin status when wallet changes
      setIsAdmin(false);
      setAdminAddress(null);
      setVerificationError(null);
    };

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleWalletChange);
      return () => {
        window.ethereum.removeListener('accountsChanged', handleWalletChange);
      };
    }
  }, []);

  // Expose a function to trigger admin verification
  const checkAdminStatus = async (walletAddress, provider) => {
    await verifyAdminStatus(walletAddress, provider);
  };

  // Verify admin status when wallet connects
  const verifyAdminStatus = async (walletAddress, provider) => {
    if (!walletAddress || !provider) {
      setIsAdmin(false);
      setAdminAddress(null);
      return;
    }

    setVerificationError(null);

    try {
      // Method 1: Simple address comparison (client-side)
      const isAddressMatch = walletAddress.toLowerCase() === ADMIN_WALLET_ADDRESS.toLowerCase();
      
      if (!isAddressMatch) {
        setIsAdmin(false);
        setAdminAddress(null);
        setIsVerifying(false);
        return;
      }

      // Method 2: Optional smart contract verification (more secure)
      let isContractAdmin = true; // Default to true if no contract
      
      if (ADMIN_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000') {
        try {
          const contract = new ethers.Contract(ADMIN_CONTRACT_ADDRESS, ADMIN_CONTRACT_ABI, provider);
          isContractAdmin = await contract.isAdmin(walletAddress);
        } catch (error) {
          console.warn('Contract verification failed, using address verification only:', error);
          // Continue with address verification if contract fails
        }
      }

      // Method 3: Server-side verification (most secure)
      // This would call your backend API to verify admin status
      const serverVerification = await verifyAdminWithServerAPI(walletAddress);

      // All three methods must pass
      console.log('Verification results:', {
        isAddressMatch,
        isContractAdmin,
        serverVerification,
        walletAddress,
        adminAddress: ADMIN_WALLET_ADDRESS
      });
      
      if (isAddressMatch && isContractAdmin && serverVerification) {
        setIsAdmin(true);
        setAdminAddress(walletAddress);
        console.log('✅ Admin verification successful');
      } else {
        setIsAdmin(false);
        setAdminAddress(null);
        console.log('❌ Admin verification failed');
      }

    } catch (error) {
      console.error('Admin verification error:', error);
      setVerificationError(error.message);
      setIsAdmin(false);
      setAdminAddress(null);
    }
  };

  // Server-side verification function
  const verifyAdminWithServerAPI = async (walletAddress) => {
    try {
      // Validate the request first
      validateAdminRequest(walletAddress);
      
      // Check rate limiting
      checkRateLimit(walletAddress);
      
      // Call the server verification
      const result = await verifyAdminWithServer(walletAddress);
      
      console.log('Server verification result:', result);
      return result.isAdmin;
    } catch (error) {
      console.warn('Server verification failed:', error);
      // Fallback to client-side verification
      return walletAddress.toLowerCase() === ADMIN_WALLET_ADDRESS.toLowerCase();
    }
  };

  // Admin-only functions
  const createMarket = async (marketData) => {
    if (!isAdmin) {
      throw new Error('Only admin can create markets');
    }
    
    // This would call your smart contract or backend API
    console.log('Creating market:', marketData);
    
    // Simulate market creation
    return {
      success: true,
      marketId: Date.now().toString(),
      transactionHash: '0x' + Math.random().toString(16).substr(2, 64)
    };
  };


  const value = {
    isAdmin,
    adminAddress,
    verificationError,
    verifyAdminStatus,
    checkAdminStatus,
    createMarket
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};
