import React, { useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useAdmin } from '../contexts/AdminContext';

const Navigation = ({ currentPage, onNavigate }) => {
  const { isConnected, account, disconnectWallet, provider } = useWallet();
  const { isAdmin, checkAdminStatus } = useAdmin();

  // Trigger admin verification when wallet connects
  useEffect(() => {
    if (isConnected && account && provider) {
      checkAdminStatus(account, provider);
    }
  }, [isConnected, account, provider, checkAdminStatus]);


  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <h1>🎯 Lossless Markets</h1>
        </div>
        
        <div className="nav-links">
          <button 
            className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => onNavigate('home')}
          >
            Home
          </button>
          <button 
            className={`nav-link ${currentPage === 'markets' ? 'active' : ''}`}
            onClick={() => onNavigate('markets')}
          >
            Markets
          </button>
          {isAdmin && (
            <button 
              className={`nav-link ${currentPage === 'admin' ? 'active' : ''}`}
              onClick={() => onNavigate('admin')}
            >
              Admin
            </button>
          )}
        </div>

        <div className="nav-wallet">
          {isConnected ? (
            <div className="wallet-info">
              <div className="wallet-address">
                {account?.slice(0, 6)}...{account?.slice(-4)}
              </div>
              {isAdmin && <div className="admin-indicator">ADMIN</div>}
              <button className="disconnect-btn" onClick={disconnectWallet}>
                Disconnect
              </button>
            </div>
          ) : (
            <div className="connect-prompt">
              Connect Wallet to Start
            </div>
          )}
        </div>
      </div>

      <style jsx="true">{`
        .navigation {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          border-bottom: 1px solid #334155;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 70px;
        }

        .nav-brand h1 {
          margin: 0;
          color: #f59e0b;
          font-size: 24px;
          font-weight: 700;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .nav-links {
          display: flex;
          gap: 8px;
        }

        .nav-link {
          padding: 12px 20px;
          border: none;
          background: transparent;
          color: #94a3b8;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s ease;
          position: relative;
        }

        .nav-link:hover {
          color: #e2e8f0;
          background: rgba(245, 158, 11, 0.1);
        }

        .nav-link.active {
          color: #f59e0b;
          background: rgba(245, 158, 11, 0.15);
          font-weight: 600;
        }

        .nav-link.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 2px;
          background: #f59e0b;
          border-radius: 1px;
        }

        .nav-wallet {
          display: flex;
          align-items: center;
        }

        .wallet-info {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(34, 197, 94, 0.1);
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid rgba(34, 197, 94, 0.2);
        }

        .wallet-address {
          color: #22c55e;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 14px;
          font-weight: 600;
        }

        .admin-indicator {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .disconnect-btn {
          background: #dc2626;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .disconnect-btn:hover {
          background: #b91c1c;
          transform: translateY(-1px);
        }

        .connect-prompt {
          color: #94a3b8;
          font-size: 14px;
          font-style: italic;
        }

        @media (max-width: 768px) {
          .nav-container {
            padding: 0 16px;
            height: 60px;
          }

          .nav-brand h1 {
            font-size: 20px;
          }

          .nav-links {
            gap: 4px;
          }

          .nav-link {
            padding: 8px 12px;
            font-size: 14px;
          }

          .wallet-info {
            flex-direction: column;
            gap: 8px;
            padding: 6px 12px;
          }

          .wallet-address {
            font-size: 12px;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navigation;
