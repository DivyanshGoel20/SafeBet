import React, { useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useNexus } from '@avail-project/nexus-widgets';

const WalletBridge = () => {
  const { account, provider, isConnected } = useWallet();
  const { setProvider } = useNexus();

  useEffect(() => {
    if (isConnected && provider) {
      console.log('Setting Nexus provider:', provider);
      setProvider(provider);
    }
  }, [isConnected, provider, setProvider]);

  // This component doesn't render anything, it just bridges the wallet to Nexus
  return null;
};

export default WalletBridge;
