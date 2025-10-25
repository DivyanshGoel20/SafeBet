import React, { useState, useEffect } from 'react';
import { useMarket } from '../contexts/MarketContext';
import { useWallet } from '../contexts/WalletContext';
import MarketCard from './MarketCard';

const MarketsPage = ({ onMarketClick }) => {
  const { markets, loading, error, loadMarkets } = useMarket();
  const { isConnected } = useWallet();
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    loadMarkets();
  }, [loadMarkets]);

  const filteredMarkets = markets.filter(market => {
    switch (filter) {
      case 'active':
        return market.marketState === 0;
      case 'resolved':
        return market.marketState === 1;
      case 'cancelled':
        return market.marketState === 2;
      default:
        return true;
    }
  });

  const sortedMarkets = [...filteredMarkets].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return Number(b.resolveDate) - Number(a.resolveDate);
      case 'oldest':
        return Number(a.resolveDate) - Number(b.resolveDate);
      case 'mostStaked':
        const aTotal = Number(a.totalYes) + Number(a.totalNo);
        const bTotal = Number(b.totalYes) + Number(b.totalNo);
        return bTotal - aTotal;
      default:
        return 0;
    }
  });

  const getFilterCounts = () => {
    return {
      all: markets.length,
      active: markets.filter(m => m.marketState === 0).length,
      resolved: markets.filter(m => m.marketState === 1).length,
      cancelled: markets.filter(m => m.marketState === 2).length
    };
  };

  const counts = getFilterCounts();

  if (loading) {
    return (
      <div className="markets-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading markets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="markets-page">
        <div className="error-container">
          <h3>Error Loading Markets</h3>
          <p>{error}</p>
          <button onClick={loadMarkets} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="markets-page">
      <div className="markets-header">
        <div className="header-content">
          <h1>Prediction Markets</h1>
          <p>Bet on outcomes, earn yield, never lose your principal</p>
        </div>
      </div>

      <div className="markets-controls">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({counts.all})
          </button>
          <button
            className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active ({counts.active})
          </button>
          <button
            className={`filter-tab ${filter === 'resolved' ? 'active' : ''}`}
            onClick={() => setFilter('resolved')}
          >
            Resolved ({counts.resolved})
          </button>
          <button
            className={`filter-tab ${filter === 'cancelled' ? 'active' : ''}`}
            onClick={() => setFilter('cancelled')}
          >
            Cancelled ({counts.cancelled})
          </button>
        </div>

        <div className="sort-controls">
          <label>Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="mostStaked">Most Staked</option>
          </select>
        </div>
      </div>

      {sortedMarkets.length === 0 ? (
        <div className="no-markets">
          <div className="no-markets-content">
            <div className="no-markets-icon">📊</div>
            <h3>No markets found</h3>
            <p>
              {filter === 'all' 
                ? "No markets have been created yet. Check back later!"
                : `No ${filter} markets found. Try a different filter.`
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="markets-grid">
          {sortedMarkets.map((market) => (
            <MarketCard 
              key={market.address} 
              market={market} 
              onClick={() => onMarketClick && onMarketClick(market.address)}
            />
          ))}
        </div>
      )}

      {!isConnected && (
        <div className="connect-wallet-prompt">
          <div className="prompt-content">
            <div className="prompt-icon">🔗</div>
            <h3>Connect Your Wallet</h3>
            <p>Connect your wallet to start betting on prediction markets</p>
          </div>
        </div>
      )}

      <style jsx="true">{`
        .markets-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
          padding: 40px 24px;
        }

        .markets-header {
          text-align: center;
          margin-bottom: 60px;
        }

        .header-content h1 {
          font-size: 48px;
          font-weight: 800;
          color: #f1f5f9;
          margin: 0 0 16px 0;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .header-content p {
          font-size: 20px;
          color: #94a3b8;
          margin: 0;
        }

        .markets-controls {
          max-width: 1200px;
          margin: 0 auto 40px auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 24px;
        }

        .filter-tabs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .filter-tab {
          padding: 12px 20px;
          border: 1px solid #475569;
          background: #334155;
          color: #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .filter-tab:hover {
          background: #475569;
          transform: translateY(-1px);
        }

        .filter-tab.active {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          border-color: #f59e0b;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
        }

        .sort-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sort-controls label {
          color: #94a3b8;
          font-size: 14px;
          font-weight: 500;
        }

        .sort-select {
          padding: 12px 16px;
          border: 1px solid #475569;
          background: #334155;
          color: #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          min-width: 150px;
        }

        .sort-select:focus {
          outline: none;
          border-color: #f59e0b;
          box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2);
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 100px 20px;
          color: #94a3b8;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #475569;
          border-top: 4px solid #f59e0b;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-container {
          text-align: center;
          padding: 100px 20px;
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          border-radius: 16px;
          border: 1px solid #dc2626;
          max-width: 500px;
          margin: 0 auto;
        }

        .error-container h3 {
          color: #dc2626;
          margin: 0 0 12px 0;
          font-size: 24px;
        }

        .error-container p {
          color: #94a3b8;
          margin: 0 0 24px 0;
        }

        .retry-button {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .retry-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
        }

        .no-markets {
          text-align: center;
          padding: 100px 20px;
        }

        .no-markets-content {
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          padding: 60px 40px;
          border-radius: 16px;
          border: 1px solid #475569;
          max-width: 500px;
          margin: 0 auto;
        }

        .no-markets-icon {
          font-size: 64px;
          margin-bottom: 24px;
        }

        .no-markets-content h3 {
          color: #f1f5f9;
          margin: 0 0 12px 0;
          font-size: 24px;
        }

        .no-markets-content p {
          color: #94a3b8;
          margin: 0;
        }

        .markets-grid {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 32px;
        }

        .connect-wallet-prompt {
          margin-top: 60px;
          text-align: center;
        }

        .prompt-content {
          background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
          padding: 40px;
          border-radius: 16px;
          border: 1px solid #3b82f6;
          max-width: 500px;
          margin: 0 auto;
        }

        .prompt-icon {
          font-size: 48px;
          margin-bottom: 20px;
        }

        .prompt-content h3 {
          color: #dbeafe;
          margin: 0 0 12px 0;
          font-size: 24px;
        }

        .prompt-content p {
          color: #93c5fd;
          margin: 0;
        }

        @media (max-width: 768px) {
          .markets-page {
            padding: 20px 16px;
          }

          .header-content h1 {
            font-size: 36px;
          }

          .header-content p {
            font-size: 18px;
          }

          .markets-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .filter-tabs {
            justify-content: center;
          }

          .sort-controls {
            justify-content: center;
          }

          .markets-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }
      `}</style>
    </div>
  );
};

export default MarketsPage;
