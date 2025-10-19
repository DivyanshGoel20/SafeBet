import React, { useState, useEffect } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import { useWallet } from '../contexts/WalletContext';

const AdminPanel = () => {
  const { isAdmin, adminAddress, createMarket, checkAdminStatus } = useAdmin();
  const { account, provider } = useWallet();
  
  const [showCreateMarket, setShowCreateMarket] = useState(false);
  const [marketData, setMarketData] = useState({
    title: '',
    description: '',
    endDate: '',
    category: 'general',
    options: ['Yes', 'No']
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [createSuccess, setCreateSuccess] = useState(null);

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
        setMarketData({
          title: '',
          description: '',
          endDate: '',
          category: 'general',
          options: ['Yes', 'No']
        });
        setShowCreateMarket(false);
      }
    } catch (error) {
      setCreateError(error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const addOption = () => {
    setMarketData(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const removeOption = (index) => {
    if (marketData.options.length > 2) {
      setMarketData(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  const updateOption = (index, value) => {
    setMarketData(prev => ({
      ...prev,
      options: prev.options.map((option, i) => i === index ? value : option)
    }));
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
        
        <button className="admin-button secondary">
          📊 View All Markets
        </button>
        
        <button className="admin-button secondary">
          ⚙️ Admin Settings
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
                placeholder="e.g., Will Bitcoin reach $100k by end of 2024?"
                required
              />
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                value={marketData.description}
                onChange={(e) => setMarketData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the market in detail..."
                rows="3"
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
              <label>Category</label>
              <select
                value={marketData.category}
                onChange={(e) => setMarketData(prev => ({ ...prev, category: e.target.value }))}
              >
                <option value="general">General</option>
                <option value="crypto">Cryptocurrency</option>
                <option value="politics">Politics</option>
                <option value="sports">Sports</option>
                <option value="technology">Technology</option>
                <option value="weather">Weather</option>
              </select>
            </div>

            <div className="form-group">
              <label>Market Options *</label>
              {marketData.options.map((option, index) => (
                <div key={index} className="option-input">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    required
                  />
                  {marketData.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="remove-option"
                    >
                      ❌
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addOption}
                className="add-option"
              >
                ➕ Add Option
              </button>
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
