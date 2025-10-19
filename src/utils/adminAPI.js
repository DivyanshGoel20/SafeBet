// Admin API utilities for server-side verification
import { ethers } from 'ethers';

const ADMIN_ADDRESSES = [
  '0xFF65DC5C653c2A6C7C11986b06E5f45D5Ba88076', // Your admin address
];

// Simulate server-side admin verification
export const verifyAdminWithServer = async (walletAddress) => {
  try {
    // In production, this would be a real API call to your backend
    // For now, we'll simulate it with a delay to mimic network request
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
    
    const isAdmin = ADMIN_ADDRESSES.some(adminAddr => 
      adminAddr.toLowerCase() === walletAddress.toLowerCase()
    );
    
    console.log('Server verification:', { walletAddress, isAdmin });
    
    return {
      isAdmin,
      address: walletAddress,
      timestamp: Date.now(),
      serverVerified: true
    };
  } catch (error) {
    console.error('Server verification error:', error);
    return {
      isAdmin: false,
      address: walletAddress,
      error: error.message,
      serverVerified: false
    };
  }
};

// Additional security measures
export const validateAdminRequest = (walletAddress, signature) => {
  // In production, you would:
  // 1. Verify the signature matches the wallet address
  // 2. Check rate limiting
  // 3. Validate IP whitelist
  // 4. Check database for admin status
  // 5. Log all admin actions
  
  if (!walletAddress) {
    throw new Error('Wallet address is required');
  }
  
  if (!ethers.isAddress(walletAddress)) {
    throw new Error('Invalid wallet address format');
  }
  
  return true;
};

// Rate limiting (client-side simulation)
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 5;

export const checkRateLimit = (walletAddress) => {
  const now = Date.now();
  const key = walletAddress.toLowerCase();
  
  if (!requestCounts.has(key)) {
    requestCounts.set(key, []);
  }
  
  const requests = requestCounts.get(key);
  
  // Remove old requests outside the window
  const validRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW);
  requestCounts.set(key, validRequests);
  
  if (validRequests.length >= MAX_REQUESTS) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }
  
  // Add current request
  validRequests.push(now);
  requestCounts.set(key, validRequests);
  
  return true;
};
