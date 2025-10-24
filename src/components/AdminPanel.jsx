import React, { useState, useEffect } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import { useWallet } from '../contexts/WalletContext';
import { useMarket } from '../contexts/MarketContext';
import { ethers } from 'ethers';

const AdminPanel = () => {
  const { isAdmin, adminAddress, checkAdminStatus } = useAdmin();
  const { account, provider } = useWallet();
  const { markets, loading, createMarket, loadMarkets, initializeMarketContext } = useMarket();
  
  const [showCreateMarket, setShowCreateMarket] = useState(false);
  const [marketData, setMarketData] = useState({
    usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Default USDC on Base
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
  const [showMarkets, setShowMarkets] = useState(false);
  const [factoryAddress, setFactoryAddress] = useState('');

  // Verify admin status when wallet connects
  useEffect(() => {
    if (account && provider) {
      console.log('Verifying admin status for:', account);
      checkAdminStatus(account, provider);
    }
  }, [account, provider, checkAdminStatus]);

  // Initialize market context when provider and factory address are available
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
      // Convert target price to proper format (multiply by 1e8 for Pyth price format)
      const targetPriceFormatted = ethers.parseUnits(marketData.targetPrice, 8);
      
      // Convert resolve date to timestamp
      const resolveTimestamp = Math.floor(new Date(marketData.resolveDate).getTime() / 1000);
      
      // Convert pyth price ID to bytes32
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


  // Debug information
  console.log('AdminPanel render:', { isAdmin, adminAddress, account });

  if (!isAdmin) {
    return null; // Don't render anything for non-admins
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h3>🔐 Admin Panel</h3>
        <div className="admin-status">
          <span className="admin-badge">ADMIN</span>
          <span className="admin-address">{adminAddress?.slice(0, 6)}...{adminAddress?.slice(-4)}</span>
        </div>
      </div>

      <div className="admin-actions">
        <button 
          className="admin-button primary"
          onClick={() => setShowCreateMarket(!showCreateMarket)}
        >
          {showCreateMarket ? '❌ Cancel' : '➕ Create New Market'}
        </button>
        
        <button 
          className="admin-button secondary"
          onClick={() => setShowMarkets(!showMarkets)}
        >
          📊 {showMarkets ? 'Hide Markets' : 'View All Markets'} ({markets.length})
        </button>
      </div>

      {showCreateMarket && (
        <div className="create-market-form">
          <h4>Create New Prediction Market</h4>
          
          <form onSubmit={handleCreateMarket}>
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

            <div className="form-group">
              <label>Target Price *</label>
              <input
                type="number"
                step="0.01"
                value={marketData.targetPrice}
                onChange={(e) => setMarketData(prev => ({ ...prev, targetPrice: e.target.value }))}
                placeholder="3500.00"
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

            <div className="form-info">
              <p><strong>Note:</strong> This will create a lossless prediction market using Aave for yield generation. All parameters must be valid contract addresses on Base network.</p>
            </div>

            {createError && (
              <div className="error-message">
                {createError}
              </div>
            )}

            {createSuccess && (
              <div className="success-message">
                {createSuccess}
              </div>
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

      {showMarkets && (
        <div className="markets-section">
          <h4>All Markets ({markets.length})</h4>
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
                <div key={market.address} className="market-card">
                  <div className="market-header">
                    <h5>{market.question}</h5>
                    <span className={`market-status ${market.marketState === 0 ? 'active' : market.marketState === 1 ? 'resolved' : 'cancelled'}`}>
                      {market.marketState === 0 ? 'Active' : market.marketState === 1 ? 'Resolved' : 'Cancelled'}
                    </span>
                  </div>
                  <div className="market-details">
                    <div className="market-detail">
                      <span className="detail-label">Address:</span>
                      <span className="detail-value">{market.address.slice(0, 6)}...{market.address.slice(-4)}</span>
                    </div>
                    <div className="market-detail">
                      <span className="detail-label">Target Price:</span>
                      <span className="detail-value">${(Number(market.targetPrice) / 1e8).toFixed(2)}</span>
                    </div>
                    <div className="market-detail">
                      <span className="detail-label">Resolve Date:</span>
                      <span className="detail-value">
                        {new Date(Number(market.resolveDate) * 1000).toLocaleString()}
                      </span>
                    </div>
                    <div className="market-detail">
                      <span className="detail-label">Total Yes:</span>
                      <span className="detail-value">{ethers.formatUnits(market.totalYes, 6)} USDC</span>
                    </div>
                    <div className="market-detail">
                      <span className="detail-label">Total No:</span>
                      <span className="detail-value">{ethers.formatUnits(market.totalNo, 6)} USDC</span>
                    </div>
                    {market.marketState === 1 && (
                      <div className="market-detail">
                        <span className="detail-label">Winning Side:</span>
                        <span className="detail-value">{market.winningSide === 1 ? 'Yes' : 'No'}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .admin-panel {
          margin-top: 20px;
          padding: 20px;
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          border-radius: 12px;
          border: 2px solid #f59e0b;
          box-shadow: 0 8px 25px rgba(245, 158, 11, 0.2);
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #475569;
        }

        .admin-header h3 {
          margin: 0;
          color: #f59e0b;
          font-size: 18px;
          font-weight: 700;
        }

        .admin-status {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .admin-badge {
          background: #f59e0b;
          color: #1e293b;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .admin-address {
          color: #94a3b8;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 12px;
        }

        .admin-actions {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .admin-button {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .admin-button.primary {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
        }

        .admin-button.primary:hover {
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
          transform: translateY(-1px);
        }

        .admin-button.secondary {
          background: #475569;
          color: #e2e8f0;
          border: 1px solid #64748b;
        }

        .admin-button.secondary:hover {
          background: #64748b;
          transform: translateY(-1px);
        }

        .create-market-form {
          background: #1e293b;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #475569;
        }

        .create-market-form h4 {
          margin: 0 0 16px 0;
          color: #f59e0b;
          font-size: 16px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          color: #e2e8f0;
          font-size: 13px;
          font-weight: 600;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #475569;
          border-radius: 6px;
          background: #334155;
          color: #e2e8f0;
          font-size: 14px;
        }

        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
          outline: none;
          border-color: #f59e0b;
          box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2);
        }

        .form-help {
          display: block;
          color: #94a3b8;
          font-size: 12px;
          margin-top: 4px;
          font-style: italic;
        }

        .option-input {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
          align-items: center;
        }

        .option-input input {
          flex: 1;
        }

        .remove-option {
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 4px 8px;
          cursor: pointer;
          font-size: 12px;
        }

        .add-option {
          background: #059669;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 6px 12px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
        }

        .error-message {
          background: #dc2626;
          color: white;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          margin-bottom: 12px;
        }

        .success-message {
          background: #059669;
          color: white;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          margin-bottom: 12px;
        }

        .form-info {
          background: #1e40af;
          color: #dbeafe;
          padding: 12px;
          border-radius: 6px;
          font-size: 12px;
          margin-bottom: 16px;
          border-left: 3px solid #3b82f6;
        }

        .form-info p {
          margin: 0;
          line-height: 1.4;
        }

        .markets-section {
          background: #1e293b;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #475569;
          margin-top: 16px;
        }

        .markets-section h4 {
          margin: 0 0 16px 0;
          color: #f59e0b;
          font-size: 16px;
        }

        .no-markets, .loading-markets {
          text-align: center;
          padding: 20px;
          color: #94a3b8;
          font-style: italic;
        }

        .markets-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .market-card {
          background: #334155;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #475569;
        }

        .market-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .market-header h5 {
          margin: 0;
          color: #f1f5f9;
          font-size: 14px;
          font-weight: 600;
          flex: 1;
          margin-right: 12px;
        }

        .market-status {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .market-status.active {
          background: #059669;
          color: white;
        }

        .market-details {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .market-detail {
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

        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .cancel-button {
          background: #64748b;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
        }

        .submit-button {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        }

        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 480px) {
          .admin-actions {
            flex-direction: column;
          }

          .form-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminPanel;
