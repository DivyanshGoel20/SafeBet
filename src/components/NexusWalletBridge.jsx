import { useEffect, useRef } from 'react';
import { useNexus } from '@avail-project/nexus-widgets';
import { useWallet } from '../contexts/WalletContext';

export function NexusWalletBridge() {
  const { isConnected, account } = useWallet();
  const { setProvider } = useNexus();
  const providerSetRef = useRef(false);

  useEffect(() => {
    if (isConnected && account && window.ethereum && !providerSetRef.current) {
      console.log('Connecting wallet to Nexus SDK...');
      
      try {
        // Set the raw window.ethereum provider for Nexus SDK
        setProvider(window.ethereum);
        providerSetRef.current = true;
        console.log('Nexus SDK provider set successfully');
      } catch (error) {
        console.error('Error setting Nexus SDK provider:', error);
      }
    } else if (!isConnected && providerSetRef.current) {
      // Reset when wallet disconnects
      providerSetRef.current = false;
      console.log('Wallet disconnected, will reset Nexus provider on reconnect');
    }
  }, [isConnected, account, setProvider]);

  return null;
}

