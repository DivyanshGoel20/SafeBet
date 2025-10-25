import React, { useState, useEffect } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import { useWallet } from '../contexts/WalletContext';
import { useMarket } from '../contexts/MarketContext';
import { ethers } from 'ethers';

const AdminPage = () => {
  const { isAdmin, adminAddress, checkAdminStatus } = useAdmin();
  const { account, provider } = useWallet();
  const { markets, loading, createMarket, loadMarkets, initializeMarketContext } = useMarket();
  
  const [showCreateMarket, setShowCreateMarket] = useState(false);
  const [marketData, setMarketData] = useState({
    usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    aavePool: '',
    pythContract: '',
    pythPriceId: '',
    targetPrice: '',
    resolveDate: '',
    question: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [createSuccess, setCreateSuccess] = useState(null);
  const [factoryAddress, setFactoryAddress] = useState('');

  useEffect(() => {
    if (account && provider) {
      checkAdminStatus(account, provider);
    }
  }, [account, provider, checkAdminStatus]);

  useEffect(() => {
    if (provider && account && factoryAddress) {
      initializeMarketContext(provider, account, factoryAddress);
    }
  }, [provider, account, factoryAddress, initializeMarketContext]);

  const handleCreateMarket = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    setIsCreating(true);
    setCreateError(null);
    setCreateSuccess(null);

    try {
      const targetPriceFormatted = ethers.parseUnits(marketData.targetPrice, 8);
      const resolveTimestamp = parseInt(marketData.resolveDate);
      const pythPriceIdBytes = ethers.zeroPadValue(marketData.pythPriceId, 32);

      const result = await createMarket({
        usdcAddress: marketData.usdcAddress,
        aavePool: marketData.aavePool,
        pythContract: marketData.pythContract,
        pythPriceId: pythPriceIdBytes,
        targetPrice: targetPriceFormatted,
        resolveDate: resolveTimestamp,
        question: marketData.question
      });
      
      setCreateSuccess(`Market created successfully! Transaction: ${result.hash}`);
      setMarketData({
        usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        aavePool: '',
        pythContract: '',
        pythPriceId: '',
        targetPrice: '',
        resolveDate: '',
        question: ''
      });
      setShowCreateMarket(false);
    } catch (error) {
      setCreateError(error.message);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="admin-page">
        <div className="access-denied">
          <div className="access-denied-content">
            <div className="access-denied-icon">🔒</div>
            <h2>Access Denied</h2>
            <p>You don't have admin privileges to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-header-content">
          <h1>Admin Dashboard</h1>
          <p>Manage prediction markets and system settings</p>
          <div className="admin-info">
            <span className="admin-badge">ADMIN</span>
            <span className="admin-address">{adminAddress?.slice(0, 6)}...{adminAddress?.slice(-4)}</span>
          </div>
        </div>
      </div>

      <div className="admin-content">
        <div className="admin-stats">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-number">{markets.length}</div>
              <div className="stat-label">Total Markets</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🟢</div>
            <div className="stat-content">
              <div className="stat-number">{markets.filter(m => m.marketState === 0).length}</div>
              <div className="stat-label">Active Markets</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-number">{markets.filter(m => m.marketState === 1).length}</div>
              <div className="stat-label">Resolved Markets</div>
            </div>
          </div>
        </div>

        <div className="admin-actions">
          <button 
            className="admin-button primary"
            onClick={() => setShowCreateMarket(!showCreateMarket)}
          >
            {showCreateMarket ? '❌ Cancel' : '➕ Create New Market'}
          </button>
        </div>

        {showCreateMarket && (
          <div className="create-market-form">
            <h3>Create New Prediction Market</h3>
            
            <form onSubmit={handleCreateMarket}>
              <div className="form-row">
                <div className="form-group">
                  <label>Factory Contract Address *</label>
                  <input
                    type="text"
                    value={factoryAddress}
                    onChange={(e) => setFactoryAddress(e.target.value)}
                    placeholder="0x..."
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Question *</label>
                  <input
                    type="text"
                    value={marketData.question}
                    onChange={(e) => setMarketData(prev => ({ ...prev, question: e.target.value }))}
                    placeholder="e.g., Will ETH be ≥ $3,500 on Oct 30?"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>USDC Contract Address *</label>
                  <input
                    type="text"
                    value={marketData.usdcAddress}
                    onChange={(e) => setMarketData(prev => ({ ...prev, usdcAddress: e.target.value }))}
                    placeholder="0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Aave Pool Address *</label>
                  <input
                    type="text"
                    value={marketData.aavePool}
                    onChange={(e) => setMarketData(prev => ({ ...prev, aavePool: e.target.value }))}
                    placeholder="0x..."
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Pyth Contract Address *</label>
                  <input
                    type="text"
                    value={marketData.pythContract}
                    onChange={(e) => setMarketData(prev => ({ ...prev, pythContract: e.target.value }))}
                    placeholder="0x..."
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Pyth Price ID *</label>
                  <input
                    type="text"
                    value={marketData.pythPriceId}
                    onChange={(e) => setMarketData(prev => ({ ...prev, pythPriceId: e.target.value }))}
                    placeholder="0x..."
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Target Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={marketData.targetPrice}
                    onChange={(e) => setMarketData(prev => ({ ...prev, targetPrice: e.target.value }))}
                    placeholder="400000000000"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Resolve Date (Unix Timestamp) *</label>
                  <input
                    type="number"
                    value={marketData.resolveDate}
                    onChange={(e) => setMarketData(prev => ({ ...prev, resolveDate: e.target.value }))}
                    placeholder="1761829200"
                    required
                  />
                  <small className="form-help">Enter Unix timestamp (e.g., 1761829200 for a specific date)</small>
                </div>
              </div>

              <div className="form-info">
                <p><strong>Note:</strong> This will create a lossless prediction market using Aave for yield generation. All parameters must be valid contract addresses on Base network.</p>
              </div>

              {createError && (
                <div className="error-message">{createError}</div>
              )}

              {createSuccess && (
                <div className="success-message">{createSuccess}</div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setShowCreateMarket(false)}
                  className="cancel-button"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="submit-button"
                >
                  {isCreating ? 'Creating...' : 'Create Market'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="markets-overview">
          <h3>All Markets ({markets.length})</h3>
          {loading ? (
            <div className="loading-markets">
              <p>Loading markets...</p>
            </div>
          ) : markets.length === 0 ? (
            <div className="no-markets">
              <p>No markets created yet. Create your first market above!</p>
            </div>
          ) : (
            <div className="markets-list">
              {markets.map((market) => (
                <div key={market.address} className="market-item">
                  <div className="market-header">
                    <h4>{market.question}</h4>
                    <span className={`market-status ${market.marketState === 0 ? 'active' : market.marketState === 1 ? 'resolved' : 'cancelled'}`}>
                      {market.marketState === 0 ? 'Active' : market.marketState === 1 ? 'Resolved' : 'Cancelled'}
                    </span>
                  </div>
                  <div className="market-details">
                    <div className="detail-item">
                      <span className="detail-label">Address:</span>
                      <span className="detail-value">{market.address.slice(0, 6)}...{market.address.slice(-4)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Target Price:</span>
                      <span className="detail-value">${(Number(market.targetPrice) / 1e8).toFixed(2)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Resolve Date:</span>
                      <span className="detail-value">
                        {new Date(Number(market.resolveDate) * 1000).toLocaleString()}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Total Staked:</span>
                      <span className="detail-value">
                        {ethers.formatUnits(
                          (BigInt(market.totalYes) + BigInt(market.totalNo)).toString(), 
                          6
                        )} USDC
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx="true">{`
        .admin-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
        }

        .access-denied {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 40px 24px;
        }

        .access-denied-content {
          text-align: center;
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          padding: 60px 40px;
          border-radius: 16px;
          border: 1px solid #dc2626;
          max-width: 500px;
        }

        .access-denied-icon {
          font-size: 64px;
          margin-bottom: 24px;
        }

        .access-denied-content h2 {
          color: #dc2626;
          margin: 0 0 12px 0;
          font-size: 28px;
        }

        .access-denied-content p {
          color: #94a3b8;
          margin: 0;
        }

        .admin-header {
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          padding: 60px 24px;
          border-bottom: 1px solid #475569;
        }

        .admin-header-content {
          max-width: 1200px;
          margin: 0 auto;
          text-align: center;
        }

        .admin-header h1 {
          font-size: 48px;
          font-weight: 800;
          color: #f1f5f9;
          margin: 0 0 16px 0;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .admin-header p {
          font-size: 20px;
          color: #94a3b8;
          margin: 0 0 24px 0;
        }

        .admin-info {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
        }

        .admin-badge {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .admin-address {
          color: #e2e8f0;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 16px;
          font-weight: 600;
        }

        .admin-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 24px;
        }

        .admin-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 24px;
          margin-bottom: 40px;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 16px;
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          padding: 24px;
          border-radius: 12px;
          border: 1px solid #475569;
        }

        .stat-icon {
          font-size: 32px;
        }

        .stat-content {
          text-align: left;
        }

        .stat-number {
          font-size: 24px;
          font-weight: 700;
          color: #f59e0b;
          margin: 0;
        }

        .stat-label {
          font-size: 14px;
          color: #e2e8f0;
          margin: 0;
        }

        .admin-actions {
          margin-bottom: 40px;
        }

        .admin-button {
          padding: 16px 32px;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .admin-button.primary {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          box-shadow: 0 8px 25px rgba(245, 158, 11, 0.3);
        }

        .admin-button.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 35px rgba(245, 158, 11, 0.4);
        }

        .create-market-form {
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          padding: 32px;
          border-radius: 16px;
          border: 1px solid #475569;
          margin-bottom: 40px;
        }

        .create-market-form h3 {
          color: #f59e0b;
          margin: 0 0 24px 0;
          font-size: 24px;
          font-weight: 600;
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          margin-bottom: 24px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          color: #e2e8f0;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .form-group input {
          padding: 12px 16px;
          border: 1px solid #475569;
          border-radius: 8px;
          background: #334155;
          color: #f1f5f9;
          font-size: 14px;
        }

        .form-group input:focus {
          outline: none;
          border-color: #f59e0b;
          box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2);
        }

        .form-help {
          color: #94a3b8;
          font-size: 12px;
          margin-top: 4px;
          font-style: italic;
        }

        .form-info {
          background: #1e40af;
          color: #dbeafe;
          padding: 16px;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 24px;
          border-left: 4px solid #3b82f6;
        }

        .error-message {
          background: #dc2626;
          color: white;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 16px;
        }

        .success-message {
          background: #059669;
          color: white;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 16px;
        }

        .form-actions {
          display: flex;
          gap: 16px;
          justify-content: flex-end;
        }

        .cancel-button {
          background: #64748b;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }

        .submit-button {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }

        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .markets-overview {
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          padding: 32px;
          border-radius: 16px;
          border: 1px solid #475569;
        }

        .markets-overview h3 {
          color: #f1f5f9;
          margin: 0 0 24px 0;
          font-size: 20px;
          font-weight: 600;
        }

        .loading-markets, .no-markets {
          text-align: center;
          padding: 40px;
          color: #94a3b8;
        }

        .markets-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .market-item {
          background: #334155;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #475569;
        }

        .market-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .market-header h4 {
          color: #f1f5f9;
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          flex: 1;
          margin-right: 16px;
        }

        .market-status {
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .market-status.active {
          background: #059669;
          color: white;
        }

        .market-status.resolved {
          background: #3b82f6;
          color: white;
        }

        .market-status.cancelled {
          background: #dc2626;
          color: white;
        }

        .market-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .detail-label {
          color: #94a3b8;
          font-size: 12px;
          font-weight: 500;
        }

        .detail-value {
          color: #e2e8f0;
          font-size: 12px;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .admin-header {
            padding: 40px 16px;
          }

          .admin-header h1 {
            font-size: 36px;
          }

          .admin-content {
            padding: 20px 16px;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .form-actions {
            flex-direction: column;
          }

          .market-details {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminPage;
