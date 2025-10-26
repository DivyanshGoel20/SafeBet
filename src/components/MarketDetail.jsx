import React, { useState, useEffect } from 'react';
import { useMarket } from '../contexts/MarketContext';
import { useWallet } from '../contexts/WalletContext';
import { ethers } from 'ethers';
import { MARKET_STATES, MARKET_SIDES, extractPriceFromQuestion } from '../utils/contracts';
import TransactionHistory from './TransactionHistory';
import TradingViewWidget from './TradingViewWidget';

const MarketDetail = ({ marketAddress, onBack }) => {
  const { getMarket, placeBet, resolveMarket, claimWinnings, getUserMarketStake, hasUserClaimedFromMarket, getMarketTimeLeft } = useMarket();
  const { account, isConnected, provider } = useWallet();
  
  const [market, setMarket] = useState(null);
  const [betAmount, setBetAmount] = useState('');
  const [userStake, setUserStake] = useState({ yesStake: '0', noStake: '0' });
  const [hasClaimed, setHasClaimed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);

  useEffect(() => {
    if (marketAddress) {
      loadMarket();
    }
  }, [marketAddress]);

  useEffect(() => {
    if (market && account) {
      loadUserData();
    }
  }, [market, account]);

  useEffect(() => {
    if (market) {
      loadTimeLeft();
      const interval = setInterval(loadTimeLeft, 1000);
      return () => clearInterval(interval);
    }
  }, [market]);

  const loadMarket = () => {
    const marketData = getMarket(marketAddress);
    setMarket(marketData);
  };

  const loadUserData = async () => {
    try {
      const [stake, claimed] = await Promise.all([
        getUserMarketStake(marketAddress),
        hasUserClaimedFromMarket(marketAddress)
      ]);
      setUserStake(stake);
      setHasClaimed(claimed);
    } catch (err) {
      console.error('Error loading user data:', err);
    }
  };

  const loadTimeLeft = async () => {
    try {
      const time = await getMarketTimeLeft(marketAddress);
      setTimeLeft(Number(time));
    } catch (err) {
      console.error('Error loading time left:', err);
    }
  };

  const handlePlaceBet = async (side) => {
    if (!isConnected || !account) {
      setError('Please connect your wallet first');
      return;
    }

    if (!betAmount || Number(betAmount) <= 0) {
      setError('Please enter a valid bet amount');
      return;
    }

    if (market.marketState !== MARKET_STATES.ACTIVE) {
      setError('This market is not active');
      return;
    }

    if (timeLeft <= 0) {
      setError('Betting period has ended');
      return;
    }

    setIsPlacingBet(true);
    setError(null);
    setSuccess(null);

    try {
      const amount = ethers.parseUnits(betAmount, 6);
      await placeBet(marketAddress, side, amount);
      
      setSuccess(`Bet placed successfully!`);
      setBetAmount('');
      await loadUserData();
    } catch (err) {
      console.error('Error placing bet:', err);
      setError(err.message);
    } finally {
      setIsPlacingBet(false);
    }
  };


  const handleClaimWinnings = async () => {
    if (!isConnected || !account) {
      setError('Please connect your wallet first');
      return;
    }

    if (market.marketState === MARKET_STATES.ACTIVE) {
      setError('Market is still active');
      return;
    }

    if (hasClaimed) {
      setError('You have already claimed from this market');
      return;
    }

    setIsClaiming(true);
    setError(null);
    setSuccess(null);

    try {
      await claimWinnings(marketAddress);
      setSuccess('Winnings claimed successfully!');
      await loadUserData();
    } catch (err) {
      console.error('Error claiming winnings:', err);
      setError(err.message);
    } finally {
      setIsClaiming(false);
    }
  };


  const handleResolveMarket = async () => {
    if (!isConnected || !account) {
      setError('Please connect your wallet first');
      return;
    }

    if (market.marketState !== MARKET_STATES.ACTIVE) {
      setError('Market is not active');
      return;
    }

    setIsResolving(true);
    setError(null);
    setSuccess(null);

    try {
      // Call resolveMarket without priceUpdate parameter - it will fetch from Hermes API
      const tx = await resolveMarket(marketAddress);
      setSuccess(`Market resolved successfully! Transaction: ${tx.hash}`);
      await loadMarket();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsResolving(false);
    }
  };

  const formatTimeLeft = (seconds) => {
    if (seconds <= 0) return 'Betting ended';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  if (!market) {
    return (
      <div className="market-detail">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading market details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="market-detail">
      {onBack && (
        <div className="back-button-container">
          <button className="back-button" onClick={onBack}>
            ← Back to Markets
          </button>
        </div>
      )}
      
      {/* Header Section */}
      <div className="market-header">
        <div className="header-content">
          <h1>{market.question}</h1>
          <div className="header-actions">
            <button 
              className="transaction-history-button"
              onClick={() => setShowTransactionHistory(true)}
            >
              📊 Transaction History
            </button>
            <div className="market-status" data-state={market.marketState}>
              {market.marketState === MARKET_STATES.ACTIVE ? 'Active' : 
               market.marketState === MARKET_STATES.RESOLVED ? 'Resolved' : 'Cancelled'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="market-layout">
        {/* Left Column - Market Info & Chart */}
        <div className="left-column">
          {/* Market Details Card */}
          <div className="info-card">
            <div className="card-header">
              <h3>📊 Market Details</h3>
            </div>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Symbol</span>
                <span className="value">{market.symbol || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="label">Target Price</span>
                <span className="value price">${extractPriceFromQuestion(market.question)}</span>
              </div>
              <div className="info-item">
                <span className="label">Resolve Date</span>
                <span className="value">{new Date(Number(market.resolveDate) * 1000).toLocaleString()}</span>
              </div>
              <div className="info-item">
                <span className="label">Creator</span>
                <span className="value">{market.creator.slice(0, 6)}...{market.creator.slice(-4)}</span>
              </div>
              {timeLeft > 0 && (
                <div className="info-item">
                  <span className="label">Time Left</span>
                  <span className="value time-left">{formatTimeLeft(timeLeft)}</span>
                </div>
              )}
            </div>
          </div>

          {/* TradingView Chart */}
          <div className="chart-card">
            {market.symbol ? (
              <TradingViewWidget symbol={market.symbol} height={400} />
            ) : (
              <div className="no-chart-message">
                <p>📊 No trading symbol available for this market</p>
                <small>Chart will appear when a trading symbol is set</small>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Betting & Actions */}
        <div className="right-column">
          {/* Market Statistics */}
          <div className="stats-card">
            <div className="card-header">
              <h3>📈 Market Statistics</h3>
            </div>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-label">Total Yes</div>
                <div className="stat-value yes">{ethers.formatUnits(market.totalYes, 6)} USDC</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Total No</div>
                <div className="stat-value no">{ethers.formatUnits(market.totalNo, 6)} USDC</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Total Staked</div>
                <div className="stat-value total">
                  {ethers.formatUnits(
                    (BigInt(market.totalYes) + BigInt(market.totalNo)).toString(), 
                    6
                  )} USDC
                </div>
              </div>
              {market.marketState === MARKET_STATES.RESOLVED && market.resolvedInterest !== '0' && (
                <div className="stat-item">
                  <div className="stat-label">Interest Generated</div>
                  <div className="stat-value interest">{ethers.formatUnits(market.resolvedInterest, 6)} USDC</div>
                </div>
              )}
            </div>
          </div>

          {/* User Position */}
          {account && (
            <div className="position-card">
              <div className="card-header">
                <h3>👤 Your Position</h3>
              </div>
              <div className="position-grid">
                <div className="position-item">
                  <div className="position-label">Yes Stake</div>
                  <div className="position-value">{ethers.formatUnits(userStake.yesStake, 6)} USDC</div>
                </div>
                <div className="position-item">
                  <div className="position-label">No Stake</div>
                  <div className="position-value">{ethers.formatUnits(userStake.noStake, 6)} USDC</div>
                </div>
              </div>
            </div>
          )}

          {/* Betting Section */}
          {market.marketState === MARKET_STATES.ACTIVE && timeLeft > 0 && isConnected && (
            <div className="betting-card">
              <div className="card-header">
                <h3>🎯 Place Your Bet</h3>
              </div>
              <div className="betting-content">
                <div className="bet-input-group">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Enter USDC amount"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    disabled={isPlacingBet}
                    className="bet-input"
                  />
                  <span className="currency-label">USDC</span>
                </div>
                
                <div className="bet-buttons">
                  <button
                    className="bet-button yes"
                    onClick={() => handlePlaceBet(MARKET_SIDES.YES)}
                    disabled={isPlacingBet || !betAmount}
                  >
                    {isPlacingBet ? 'Placing...' : '✅ Bet Yes'}
                  </button>
                  <button
                    className="bet-button no"
                    onClick={() => handlePlaceBet(MARKET_SIDES.NO)}
                    disabled={isPlacingBet || !betAmount}
                  >
                    {isPlacingBet ? 'Placing...' : '❌ Bet No'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Resolution Section */}
          {market.marketState === MARKET_STATES.ACTIVE && isConnected && (
            <div className="action-card">
              <div className="card-header">
                <h3>🔧 Market Actions</h3>
              </div>
              <div className="action-content">
                <p>Resolve this market using the latest price data from Pyth Oracle via Hermes API.</p>
                <button
                  className="resolve-button"
                  onClick={handleResolveMarket}
                  disabled={isResolving}
                >
                  {isResolving ? 'Resolving...' : '🎯 Resolve Market'}
                </button>
              </div>
            </div>
          )}

          {/* Claim Section */}
          {market.marketState === MARKET_STATES.RESOLVED && isConnected && !hasClaimed && (
            <div className="claim-card">
              <div className="card-header">
                <h3>💰 Claim Winnings</h3>
              </div>
              <div className="claim-content">
                <p>This market has been resolved. You can now claim your winnings.</p>
                <button
                  className="claim-button"
                  onClick={handleClaimWinnings}
                  disabled={isClaiming}
                >
                  {isClaiming ? 'Claiming...' : '💰 Claim Winnings'}
                </button>
              </div>
            </div>
          )}

          {/* Claimed Section */}
          {hasClaimed && (
            <div className="claimed-card">
              <div className="card-header">
                <h3>✅ Winnings Claimed</h3>
              </div>
              <div className="claimed-content">
                <p>You have already claimed your winnings from this market.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}
      
      {success && (
        <div className="success-message">{success}</div>
      )}

      <style jsx="true">{`
        .market-detail {
          max-width: 1400px;
          margin: 0 auto;
          padding: 24px;
          background: #0f172a;
          min-height: 100vh;
        }

        .back-button-container {
          margin-bottom: 24px;
        }

        .back-button {
          background: linear-gradient(135deg, #64748b 0%, #475569 100%);
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .back-button:hover {
          background: linear-gradient(135deg, #475569 0%, #334155 100%);
          transform: translateY(-1px);
        }

        /* Header Styles */
        .market-header {
          margin-bottom: 32px;
          padding: 32px;
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          border-radius: 20px;
          border: 1px solid #475569;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
        }

        .market-header h1 {
          color: #f1f5f9;
          font-size: 32px;
          font-weight: 700;
          margin: 0;
          line-height: 1.3;
          flex: 1;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-shrink: 0;
        }

        /* Main Layout Grid */
        .market-layout {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 32px;
          align-items: start;
        }

        .left-column {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .right-column {
          display: flex;
          flex-direction: column;
          gap: 24px;
          position: sticky;
          top: 24px;
        }

        /* Card Styles */
        .info-card, .stats-card, .position-card, .betting-card, .action-card, .claim-card, .claimed-card, .chart-card {
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          border-radius: 16px;
          border: 1px solid #475569;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
          transition: all 0.3s ease;
        }

        .info-card:hover, .stats-card:hover, .position-card:hover, .betting-card:hover, .action-card:hover, .claim-card:hover, .claimed-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .card-header {
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #475569;
        }

        .card-header h3 {
          color: #f1f5f9;
          font-size: 18px;
          font-weight: 600;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Info Grid */
        .info-grid {
          display: grid;
          gap: 16px;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
        }

        .info-item .label {
          color: #94a3b8;
          font-size: 14px;
          font-weight: 500;
        }

        .info-item .value {
          color: #f1f5f9;
          font-size: 14px;
          font-weight: 600;
        }

        .info-item .value.price {
          color: #f59e0b;
          font-size: 16px;
          font-weight: 700;
        }

        .info-item .value.time-left {
          color: #10b981;
          font-weight: 700;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          gap: 16px;
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: rgba(71, 85, 105, 0.3);
          border-radius: 12px;
          border: 1px solid #475569;
        }

        .stat-label {
          color: #94a3b8;
          font-size: 14px;
          font-weight: 500;
        }

        .stat-value {
          font-size: 16px;
          font-weight: 700;
        }

        .stat-value.yes {
          color: #10b981;
        }

        .stat-value.no {
          color: #ef4444;
        }

        .stat-value.total {
          color: #f59e0b;
        }

        .stat-value.interest {
          color: #8b5cf6;
        }

        /* Position Grid */
        .position-grid {
          display: grid;
          gap: 12px;
        }

        .position-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: rgba(71, 85, 105, 0.3);
          border-radius: 10px;
          border: 1px solid #475569;
        }

        .position-label {
          color: #94a3b8;
          font-size: 14px;
          font-weight: 500;
        }

        .position-value {
          color: #f1f5f9;
          font-size: 16px;
          font-weight: 700;
        }

        /* Betting Styles */
        .betting-content {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .bet-input-group {
          position: relative;
          display: flex;
          align-items: center;
        }

        .bet-input {
          width: 100%;
          padding: 16px 80px 16px 16px;
          background: rgba(15, 23, 42, 0.8);
          border: 2px solid #475569;
          border-radius: 12px;
          color: #f1f5f9;
          font-size: 16px;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .bet-input:focus {
          outline: none;
          border-color: #f59e0b;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
        }

        .bet-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .currency-label {
          position: absolute;
          right: 16px;
          color: #94a3b8;
          font-size: 14px;
          font-weight: 600;
          pointer-events: none;
        }

        .bet-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .bet-button {
          padding: 16px 20px;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .bet-button.yes {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
        }

        .bet-button.yes:hover:not(:disabled) {
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
          transform: translateY(-2px);
        }

        .bet-button.no {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
        }

        .bet-button.no:hover:not(:disabled) {
          box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
          transform: translateY(-2px);
        }

        .bet-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        /* Action Styles */
        .action-content, .claim-content, .claimed-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .action-content p, .claim-content p, .claimed-content p {
          color: #94a3b8;
          font-size: 14px;
          line-height: 1.5;
          margin: 0;
        }

        .resolve-button, .claim-button {
          padding: 16px 24px;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .resolve-button:hover:not(:disabled), .claim-button:hover:not(:disabled) {
          box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
          transform: translateY(-2px);
        }

        .resolve-button:disabled, .claim-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        /* Chart Card */
        .chart-card {
          padding: 0;
          overflow: hidden;
        }

        .chart-card .card-header {
          margin: 0;
          padding: 24px 24px 0 24px;
          border-bottom: none;
        }

        /* Transaction History Button */
        .transaction-history-button {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .transaction-history-button:hover {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        /* Market Status */
        .market-status {
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .market-status[data-state="0"] {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }

        .market-status[data-state="1"] {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
        }

        .market-status[data-state="2"] {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
        }

        /* Error and Success Messages */
        .error-message, .success-message {
          padding: 16px 20px;
          border-radius: 12px;
          margin: 20px 0;
          font-weight: 600;
          text-align: center;
        }

        .error-message {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          border: 1px solid #dc2626;
        }

        .success-message {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: 1px solid #059669;
        }

        /* Bridge Section */
        .bridge-section {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #475569;
        }

        .bridge-text {
          color: #94a3b8;
          font-size: 14px;
          margin: 0 0 12px 0;
          text-align: center;
        }


        @media (max-width: 968px) {
          .market-layout {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          
          .right-column {
            position: static;
          }
          
          .header-content {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
          }
          
          .market-header h1 {
            font-size: 24px;
          }
        }

        .resolve-input {
          display: flex;
          align-items: center;
          margin-bottom: 16px;
        }

        .resolve-input input {
          flex: 1;
          padding: 12px 16px;
          border: 1px solid #475569;
          border-radius: 8px;
          background: #334155;
          color: #f1f5f9;
          font-size: 16px;
        }

        .resolve-input input:focus {
          outline: none;
          border-color: #f59e0b;
          box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2);
        }

        .bet-buttons {
          display: flex;
          gap: 16px;
        }

        .bet-button, .resolve-button, .claim-button {
          flex: 1;
          padding: 16px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .bet-button:disabled, .resolve-button:disabled, .claim-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .bet-button.yes {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          color: white;
        }

        .bet-button.yes:hover:not(:disabled) {
          background: linear-gradient(135deg, #047857 0%, #065f46 100%);
          transform: translateY(-2px);
        }

        .bet-button.no {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          color: white;
        }

        .bet-button.no:hover:not(:disabled) {
          background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
          transform: translateY(-2px);
        }

        .resolve-button {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
        }

        .resolve-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
          transform: translateY(-2px);
        }

        .resolve-button.disabled {
          background: #64748b;
          opacity: 0.6;
          cursor: not-allowed;
        }

        .resolve-button.disabled:hover {
          background: #64748b;
          transform: none;
        }

        .no-chart-message {
          background: #334155;
          border: 1px solid #475569;
          border-radius: 12px;
          padding: 40px;
          text-align: center;
          margin: 20px 0;
        }

        .no-chart-message p {
          color: #f1f5f9;
          font-size: 18px;
          margin: 0 0 8px 0;
        }

        .no-chart-message small {
          color: #94a3b8;
          font-size: 14px;
        }

        .claim-button {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
        }

        .claim-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          transform: translateY(-2px);
        }

        .error-message {
          background: #dc2626;
          color: white;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          margin-top: 16px;
        }

        .success-message {
          background: #059669;
          color: white;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          margin-top: 16px;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          color: #94a3b8;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #475569;
          border-top: 3px solid #f59e0b;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .market-header {
            flex-direction: column;
            gap: 16px;
          }

          .market-header h1 {
            margin-right: 0;
          }

          .user-stakes {
            flex-direction: column;
            gap: 12px;
          }

          .bet-buttons {
            flex-direction: column;
          }
        }
      `}</style>

      <TransactionHistory 
        marketAddress={marketAddress}
        isOpen={showTransactionHistory}
        onClose={() => setShowTransactionHistory(false)}
      />
    </div>
  );
};

export default MarketDetail;
