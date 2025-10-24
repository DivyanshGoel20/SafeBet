import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import { useNotification, useTransactionPopup } from '@blockscout/app-sdk';
// import { BridgeButton, TransferButton } from '@avail-project/nexus-widgets';

const ConnectWallet = () => {
  const {
    account,
    usdcBalance,
    isConnected,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    signer
  } = useWallet();

  const { openTxToast } = useNotification();
  const { openPopup } = useTransactionPopup();

  const buttonRef = useRef(null);
  const walletInfoRef = useRef(null);
  const errorRef = useRef(null);

  // GSAP animations
  useEffect(() => {
    if (isConnected && walletInfoRef.current) {
      // Animate wallet info reveal
      gsap.fromTo(walletInfoRef.current, 
        { 
          opacity: 0, 
          y: 20, 
          scale: 0.95 
        },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1, 
          duration: 0.6, 
          ease: "back.out(1.7)" 
        }
      );
    }
  }, [isConnected]);

  useEffect(() => {
    if (error && errorRef.current) {
      // Animate error message
      gsap.fromTo(errorRef.current,
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.3 }
      );
    }
  }, [error]);

  const handleButtonHover = () => {
    if (buttonRef.current) {
      gsap.to(buttonRef.current, {
        scale: 1.05,
        duration: 0.2,
        ease: "power2.out"
      });
    }
  };

  const handleButtonLeave = () => {
    if (buttonRef.current) {
      gsap.to(buttonRef.current, {
        scale: 1,
        duration: 0.2,
        ease: "power2.out"
      });
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatUSDCBalance = (balance) => {
    const num = parseFloat(balance);
    if (num === 0) return '0.00';
    if (num < 0.01) return '< 0.01';
    return num.toFixed(2);
  };

  const sendTestTransaction = async () => {
    if (!signer) {
      return;
    }

    try {
      // Send a small amount of ETH to yourself (0.001 ETH)
      const tx = await signer.sendTransaction({
        to: account,
        value: ethers.parseEther('0.001'),
        gasLimit: 21000
      });

      console.log('Transaction sent:', tx.hash);
      
      // Show the transaction toast notification
      await openTxToast('8453', tx.hash); // Base chain ID is 8453
      
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };

  const showTransactionHistory = () => {
    if (!account) {
      return;
    }

    // Show transaction history for the connected wallet address
    openPopup({
      chainId: '8453', // Base chain ID
      address: account // Current wallet address
    });
  };

  const showAllTransactions = () => {
    // Show all transactions on Base network
    openPopup({
      chainId: '8453' // Base chain ID only
    });
  };

  return (
    <div className="connect-wallet-container">
      {!isConnected ? (
        <div className="connect-section">
          <button
            ref={buttonRef}
            className="connect-button"
            onClick={connectWallet}
            disabled={isConnecting}
            onMouseEnter={handleButtonHover}
            onMouseLeave={handleButtonLeave}
          >
            {isConnecting ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
                Connecting...
              </div>
            ) : (
              'Connect Wallet'
            )}
          </button>
          
          {error && (
            <div ref={errorRef} className="error-message">
              {error}
            </div>
          )}
        </div>
      ) : (
        <div ref={walletInfoRef} className="wallet-info">
          <div className="wallet-header">
            <div className="wallet-address">
              <span className="label">Wallet:</span>
              <span className="address">{formatAddress(account)}</span>
            </div>
            <button 
              className="disconnect-button"
              onClick={disconnectWallet}
              onMouseEnter={handleButtonHover}
              onMouseLeave={handleButtonLeave}
            >
              Disconnect
            </button>
          </div>
          
          <div className="usdc-balance">
            <span className="label">USDC Balance:</span>
            <span className="balance">{formatUSDCBalance(usdcBalance)} USDC</span>
          </div>
          
          <div className="test-transaction-section">
            <button 
              className="test-transaction-button"
              onClick={sendTestTransaction}
              onMouseEnter={handleButtonHover}
              onMouseLeave={handleButtonLeave}
            >
              🧪 Test Transaction (0.001 ETH)
            </button>
            <p className="test-description">
              Send a small test transaction to see toast notifications
            </p>
          </div>

          <div className="transaction-history-section">
            <div className="history-buttons">
              <button 
                className="history-button primary"
                onClick={showTransactionHistory}
                onMouseEnter={handleButtonHover}
                onMouseLeave={handleButtonLeave}
              >
                📋 My Transactions
              </button>
              <button 
                className="history-button secondary"
                onClick={showAllTransactions}
                onMouseEnter={handleButtonHover}
                onMouseLeave={handleButtonLeave}
              >
                🌐 All Base Transactions
              </button>
            </div>
            <p className="history-description">
              View transaction history and explore the Base network
            </p>
          </div>

        {/* <div className="nexus-widgets-section">
          <h4 className="nexus-title">🌉 Avail Nexus Integration</h4>
          <p className="nexus-description">
            Bridge and transfer assets across chains using Avail Nexus
          </p>
          
          <div className="nexus-buttons">
            <div className="nexus-button-group">
              <h5>Bridge Assets</h5>
              <BridgeButton
                prefill={{
                  chainId: 8453, // Base chain ID
                  token: 'USDC', // USDC token
                  amount: '10' // 10 USDC
                }}
                onSuccess={(result) => {
                  console.log('Bridge successful:', result);
                  alert('Bridge transaction successful!');
                }}
                onError={(error) => {
                  console.error('Bridge error:', error);
                  alert('Bridge failed: ' + error.message);
                }}
              />
            </div>

            <div className="nexus-button-group">
              <h5>Transfer Assets</h5>
              <TransferButton
                prefill={{
                  chainId: 8453, // Base chain ID
                  token: 'USDC', // USDC token
                  amount: '5', // 5 USDC
                  recipient: account // Your wallet address
                }}
                onSuccess={(result) => {
                  console.log('Transfer successful:', result);
                  alert('Transfer transaction successful!');
                }}
                onError={(error) => {
                  console.error('Transfer error:', error);
                  alert('Transfer failed: ' + error.message);
                }}
              />
            </div>
          </div>
        </div> */}
        </div>
      )}

      <style jsx>{`
        .connect-wallet-container {
          max-width: 400px;
          margin: 0 auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .connect-section {
          text-align: center;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .connect-button {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(5, 150, 105, 0.3);
          min-width: 160px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .connect-button:hover:not(:disabled) {
          box-shadow: 0 6px 20px rgba(5, 150, 105, 0.4);
          transform: translateY(-2px);
        }

        .connect-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .loading-spinner {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-message {
          margin-top: 12px;
          padding: 8px 12px;
          background-color: #fee2e2;
          color: #dc2626;
          border-radius: 6px;
          font-size: 14px;
          border: 1px solid #fecaca;
        }

        .wallet-info {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }

        .wallet-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .wallet-address {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .label {
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .address {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          font-family: 'Monaco', 'Menlo', monospace;
        }

        .disconnect-button {
          background: #ef4444;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .disconnect-button:hover {
          background: #dc2626;
          transform: translateY(-1px);
        }

        .usdc-balance {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: white;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .balance {
          font-size: 18px;
          font-weight: 700;
          color: #059669;
          font-family: 'Monaco', 'Menlo', monospace;
        }

        .test-transaction-section {
          margin-top: 20px;
          padding: 16px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          text-align: center;
        }

        .test-transaction-button {
          background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%);
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
          margin-bottom: 8px;
        }

        .test-transaction-button:hover {
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
          transform: translateY(-1px);
        }

        .test-description {
          font-size: 12px;
          color: #64748b;
          margin: 0;
          line-height: 1.4;
        }

        .transaction-history-section {
          margin-top: 16px;
          padding: 16px;
          background: #f1f5f9;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .history-buttons {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }

        .history-button {
          flex: 1;
          min-width: 140px;
          padding: 8px 12px;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }

        .history-button.primary {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          color: white;
          box-shadow: 0 2px 6px rgba(5, 150, 105, 0.3);
        }

        .history-button.primary:hover {
          box-shadow: 0 4px 10px rgba(5, 150, 105, 0.4);
          transform: translateY(-1px);
        }

        .history-button.secondary {
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: white;
          box-shadow: 0 2px 6px rgba(99, 102, 241, 0.3);
        }

        .history-button.secondary:hover {
          box-shadow: 0 4px 10px rgba(99, 102, 241, 0.4);
          transform: translateY(-1px);
        }

        .history-description {
          font-size: 11px;
          color: #64748b;
          margin: 0;
          line-height: 1.4;
          text-align: center;
        }

        .nexus-widgets-section {
          margin-top: 20px;
          padding: 20px;
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          border-radius: 12px;
          border: 2px solid #6366f1;
          box-shadow: 0 8px 25px rgba(99, 102, 241, 0.2);
        }

        .nexus-title {
          margin: 0 0 8px 0;
          color: #6366f1;
          font-size: 16px;
          font-weight: 700;
          text-align: center;
        }

        .nexus-description {
          margin: 0 0 16px 0;
          color: #94a3b8;
          font-size: 12px;
          text-align: center;
          line-height: 1.4;
        }

        .nexus-buttons {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .nexus-button-group {
          text-align: center;
        }

        .nexus-button-group h5 {
          margin: 0 0 8px 0;
          color: #e2e8f0;
          font-size: 13px;
          font-weight: 600;
        }

        .nexus-button-group button {
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
          min-width: 120px;
        }

        .nexus-button-group button:hover {
          box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
          transform: translateY(-2px);
        }

        @media (max-width: 480px) {
          .nexus-buttons {
            gap: 12px;
          }
        }

        @media (max-width: 480px) {
          .wallet-header {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
          }

          .usdc-balance {
            flex-direction: column;
            gap: 8px;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default ConnectWallet;
