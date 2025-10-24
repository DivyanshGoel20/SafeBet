import React, { useState, useEffect } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import { useWallet } from '../contexts/WalletContext';

const AdminPanel = () => {
  const { isAdmin, adminAddress, createMarket, checkAdminStatus } = useAdmin();
  const { account, provider } = useWallet();
  
  const [showCreateMarket, setShowCreateMarket] = useState(false);
  const [marketData, setMarketData] = useState({
    title: '',
    endDate: '',
    tokenName: 'USDC'
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [createSuccess, setCreateSuccess] = useState(null);
  const [markets, setMarkets] = useState([]);
  const [showMarkets, setShowMarkets] = useState(false);

  // Verify admin status when wallet connects
  useEffect(() => {
    if (account && provider) {
      console.log('Verifying admin status for:', account);
      checkAdminStatus(account, provider);
    }
  }, [account, provider, checkAdminStatus]);

  const handleCreateMarket = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    setIsCreating(true);
    setCreateError(null);
    setCreateSuccess(null);

    try {
      const result = await createMarket(marketData);
      
      if (result.success) {
        setCreateSuccess(`Market created successfully! ID: ${result.marketId}`);
        // Add the new market to the list
        const newMarket = {
          id: result.marketId,
          title: marketData.title,
          endDate: marketData.endDate,
          tokenName: marketData.tokenName,
          createdAt: new Date().toISOString(),
          status: 'active'
        };
        setMarkets(prev => [newMarket, ...prev]);
        setMarketData({
          title: '',
          endDate: '',
          tokenName: 'USDC'
        });
        setShowCreateMarket(false);
      }
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
              <label>Market Title *</label>
              <input
                type="text"
                value={marketData.title}
                onChange={(e) => setMarketData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Will ETH be ≥ $3,500 on Oct 30?"
                required
              />
            </div>

            <div className="form-group">
              <label>End Date *</label>
              <input
                type="datetime-local"
                value={marketData.endDate}
                onChange={(e) => setMarketData(prev => ({ ...prev, endDate: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label>Token Name *</label>
              <input
                type="text"
                value={marketData.tokenName}
                onChange={(e) => setMarketData(prev => ({ ...prev, tokenName: e.target.value }))}
                placeholder="e.g., USDC, ETH, DAI"
                required
              />
            </div>

            <div className="form-info">
              <p><strong>Note:</strong> This will create a simple Yes/No prediction market. The smart contract will handle all other details like token address, yield generation, and market mechanics.</p>
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
          {markets.length === 0 ? (
            <div className="no-markets">
              <p>No markets created yet. Create your first market above!</p>
            </div>
          ) : (
            <div className="markets-list">
              {markets.map((market) => (
                <div key={market.id} className="market-card">
                  <div className="market-header">
                    <h5>{market.title}</h5>
                    <span className={`market-status ${market.status}`}>
                      {market.status}
                    </span>
                  </div>
                  <div className="market-details">
                    <div className="market-detail">
                      <span className="detail-label">Token:</span>
                      <span className="detail-value">{market.tokenName}</span>
                    </div>
                    <div className="market-detail">
                      <span className="detail-label">End Date:</span>
                      <span className="detail-value">
                        {new Date(market.endDate).toLocaleString()}
                      </span>
                    </div>
                    <div className="market-detail">
                      <span className="detail-label">Created:</span>
                      <span className="detail-value">
                        {new Date(market.createdAt).toLocaleDateString()}
                      </span>
                    </div>
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

        .no-markets {
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
