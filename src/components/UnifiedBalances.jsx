import React, { useState, useEffect, useRef } from 'react';
import { useNexus } from '@avail-project/nexus-widgets';
import { useWallet } from '../contexts/WalletContext';

const UnifiedBalances = () => {
  const { sdk, isSdkInitialized, initializeSdk } = useNexus();
  const { provider, isConnected } = useWallet();
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initializing, setInitializing] = useState(false);
  const fetchingRef = useRef(false);

  // Manual initialization handler
  const handleInitializeSDK = async () => {
    if (!isConnected || !window.ethereum) {
      setError('Please connect your wallet first');
      return;
    }

    setInitializing(true);
    setError(null);
    setLoading(false);

    try {
      console.log('Initializing Avail SDK with window.ethereum');
      await initializeSdk(window.ethereum);
      console.log('SDK initialized successfully');
    } catch (err) {
      console.error('Failed to initialize SDK:', err);
      setError('Failed to initialize Avail SDK. ' + (err.message || 'Please try again.'));
      setInitializing(false);
    }
  };

  // Fetch balances when SDK is initialized (only once per initialization)
  useEffect(() => {
    if (isSdkInitialized && sdk && !fetchingRef.current) {
      fetchingRef.current = true;
      const fetchBalances = async () => {
        setLoading(true);
        setError(null);
        try {
          console.log('Fetching unified balances...');
          const unifiedBalances = await sdk.getUnifiedBalances();
          console.log('Unified balances:', unifiedBalances);
          setBalances(unifiedBalances || []);
        } catch (err) {
          console.error('Failed to fetch balances:', err);
          setError('Failed to fetch balances');
        } finally {
          setLoading(false);
          fetchingRef.current = false;
        }
      };
      fetchBalances();
    }
    
    // Reset fetching state when SDK is not initialized
    if (!isSdkInitialized) {
      fetchingRef.current = false;
    }
  }, [isSdkInitialized]); // Only depend on isSdkInitialized

  // Don't show if wallet is not connected
  if (!isConnected) {
    return null;
  }

  // Show initialization button if SDK is not initialized
  if (!isSdkInitialized && !loading && !initializing) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h3 style={styles.title}>🌐 Unified Balances</h3>
          <p style={styles.subtitle}>View your token balances across all supported chains</p>
        </div>
        {error ? (
          <div style={styles.error}>{error}</div>
        ) : (
          <div style={styles.initSection}>
            <p style={styles.initText}>Connect to Avail Nexus to view your unified balances across multiple chains.</p>
            <button
              onClick={handleInitializeSDK}
              disabled={initializing || !window.ethereum}
              style={styles.initButton}
            >
              {initializing ? 'Initializing...' : 'Enable Unified Balances'}
            </button>
            <p style={styles.initNote}>
              Note: You'll be asked to sign a transaction to enable Nexus. This only needs to be done once.
            </p>
          </div>
        )}
      </div>
    );
  }

  if (loading || initializing) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h3 style={styles.title}>Unified Balances</h3>
        </div>
        <div style={styles.loading}>Loading balances...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h3 style={styles.title}>Unified Balances</h3>
        </div>
        <div style={styles.error}>{error}</div>
      </div>
    );
  }

  if (!balances || balances.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h3 style={styles.title}>Unified Balances</h3>
        </div>
        <div style={styles.empty}>No balances found</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>🌐 Unified Balances Across Chains</h3>
        <p style={styles.subtitle}>Your unified token balances across all supported networks</p>
      </div>
      <div style={styles.balancesGrid}>
        {balances.map((balance, index) => (
          <div key={index} style={styles.balanceCard}>
            <div style={styles.tokenInfo}>
              <div style={styles.tokenSymbol}>{balance.symbol || 'N/A'}</div>
              <div style={styles.tokenName}>{balance.name || balance.token || 'Unknown Token'}</div>
            </div>
            <div style={styles.balanceInfo}>
              <div style={styles.balanceAmount}>
                {parseFloat(balance.balance || '0').toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 4
                })}
              </div>
              {balance.chainBalances && balance.chainBalances.length > 0 && (
                <div style={styles.chainBreakdown}>
                  {balance.chainBalances.map((chainBalance, idx) => (
                    <div key={idx} style={styles.chainBalance}>
                      <span style={styles.chainName}>{chainBalance.chainId}:</span>
                      <span style={styles.chainAmount}>
                        {parseFloat(chainBalance.balance || '0').toFixed(4)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .unified-balances {
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          padding: 32px;
          border-radius: 16px;
          border: 1px solid #475569;
          margin: 24px 0;
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    padding: '32px',
    borderRadius: '16px',
    border: '1px solid #475569',
    margin: '24px 0',
    maxWidth: '1200px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  header: {
    marginBottom: '24px',
    textAlign: 'center',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#f1f5f9',
    margin: '0 0 8px 0',
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  subtitle: {
    fontSize: '14px',
    color: '#94a3b8',
    margin: '0',
  },
  loading: {
    color: '#94a3b8',
    textAlign: 'center',
    padding: '20px',
  },
  error: {
    color: '#ef4444',
    textAlign: 'center',
    padding: '20px',
    background: 'rgba(239, 68, 68, 0.1)',
    borderRadius: '8px',
  },
  empty: {
    color: '#94a3b8',
    textAlign: 'center',
    padding: '20px',
  },
  balancesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  balanceCard: {
    background: 'rgba(15, 23, 42, 0.5)',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #334155',
    transition: 'all 0.3s ease',
  },
  balanceCardHover: {
    transform: 'translateY(-4px)',
    borderColor: '#f59e0b',
  },
  tokenInfo: {
    marginBottom: '12px',
  },
  tokenSymbol: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#f59e0b',
    marginBottom: '4px',
  },
  tokenName: {
    fontSize: '14px',
    color: '#94a3b8',
  },
  balanceInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  balanceAmount: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: '8px',
  },
  chainBreakdown: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  chainBalance: {
    fontSize: '12px',
    color: '#94a3b8',
    display: 'flex',
    justifyContent: 'space-between',
  },
  chainName: {
    fontWeight: '600',
  },
  chainAmount: {
    color: '#cbd5e1',
  },
  initSection: {
    textAlign: 'center',
    padding: '20px',
  },
  initText: {
    color: '#94a3b8',
    marginBottom: '20px',
    fontSize: '16px',
  },
  initButton: {
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    color: 'white',
    border: 'none',
    padding: '14px 28px',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)',
    marginBottom: '12px',
  },
  initButtonDisabled: {
    background: '#64748b',
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
  initNote: {
    color: '#64748b',
    fontSize: '13px',
    fontStyle: 'italic',
  },
};

export default UnifiedBalances;

