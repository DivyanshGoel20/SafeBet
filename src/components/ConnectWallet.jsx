import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useWallet } from '../contexts/WalletContext';

const ConnectWallet = () => {
  const {
    account,
    usdcBalance,
    isConnected,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet
  } = useWallet();

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
        </div>
      )}

      <style jsx>{`
        .connect-wallet-container {
          max-width: 400px;
          margin: 0 auto;
          padding: 20px;
        }

        .connect-section {
          text-align: center;
        }

        .connect-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
          min-width: 160px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .connect-button:hover:not(:disabled) {
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
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
