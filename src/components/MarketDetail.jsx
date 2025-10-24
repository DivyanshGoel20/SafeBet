import React, { useState, useEffect } from 'react';
import { useMarket } from '../contexts/MarketContext';
import { useWallet } from '../contexts/WalletContext';
import { ethers } from 'ethers';
import { MARKET_STATES, MARKET_SIDES } from '../utils/contracts';

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

  const handleResolveMarket = async () => {
    if (!isConnected || !account) {
      setError('Please connect your wallet first');
      return;
    }

    if (market.marketState !== MARKET_STATES.ACTIVE) {
      setError('This market is not active');
      return;
    }

    if (Date.now() / 1000 < Number(market.resolveDate)) {
      setError('Market cannot be resolved before resolve date');
      return;
    }

    setIsResolving(true);
    setError(null);
    setSuccess(null);

    try {
      // Note: In a real implementation, you would need to provide the Pyth price update data
      // For now, we'll show an error that this needs to be implemented
      setError('Market resolution requires Pyth price update data. This needs to be implemented with actual price feeds.');
    } catch (err) {
      console.error('Error resolving market:', err);
      setError(err.message);
    } finally {
      setIsResolving(false);
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
      
      <div className="market-header">
        <h1>{market.question}</h1>
        <div className="market-status" data-state={market.marketState}>
          {market.marketState === MARKET_STATES.ACTIVE ? 'Active' : 
           market.marketState === MARKET_STATES.RESOLVED ? 'Resolved' : 'Cancelled'}
        </div>
      </div>

      <div className="market-info-grid">
        <div className="info-card">
          <h3>Market Details</h3>
          <div className="info-item">
            <span className="label">Target Price:</span>
            <span className="value">${(Number(market.targetPrice) / 1e8).toFixed(2)}</span>
          </div>
          <div className="info-item">
            <span className="label">Resolve Date:</span>
            <span className="value">{new Date(Number(market.resolveDate) * 1000).toLocaleString()}</span>
          </div>
          <div className="info-item">
            <span className="label">Creator:</span>
            <span className="value">{market.creator.slice(0, 6)}...{market.creator.slice(-4)}</span>
          </div>
          {timeLeft > 0 && (
            <div className="info-item">
              <span className="label">Time Left:</span>
              <span className="value">{formatTimeLeft(timeLeft)}</span>
            </div>
          )}
        </div>

        <div className="info-card">
          <h3>Market Statistics</h3>
          <div className="stat-row">
            <span className="stat-label">Total Yes:</span>
            <span className="stat-value">{ethers.formatUnits(market.totalYes, 6)} USDC</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Total No:</span>
            <span className="stat-value">{ethers.formatUnits(market.totalNo, 6)} USDC</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Total Staked:</span>
            <span className="stat-value">
              {ethers.formatUnits(
                (BigInt(market.totalYes) + BigInt(market.totalNo)).toString(), 
                6
              )} USDC
            </span>
          </div>
          {market.marketState === MARKET_STATES.RESOLVED && market.resolvedInterest !== '0' && (
            <div className="stat-row">
              <span className="stat-label">Interest Generated:</span>
              <span className="stat-value">{ethers.formatUnits(market.resolvedInterest, 6)} USDC</span>
            </div>
          )}
        </div>
      </div>

      {account && (
        <div className="user-section">
          <h3>Your Position</h3>
          <div className="user-stakes">
            <div className="stake-item">
              <span className="stake-label">Yes Stake:</span>
              <span className="stake-value">{ethers.formatUnits(userStake.yesStake, 6)} USDC</span>
            </div>
            <div className="stake-item">
              <span className="stake-label">No Stake:</span>
              <span className="stake-value">{ethers.formatUnits(userStake.noStake, 6)} USDC</span>
            </div>
          </div>
        </div>
      )}

      {market.marketState === MARKET_STATES.ACTIVE && timeLeft > 0 && isConnected && (
        <div className="betting-section">
          <h3>Place Your Bet</h3>
          <div className="bet-input">
            <input
              type="number"
              step="0.01"
              placeholder="Enter USDC amount"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              disabled={isPlacingBet}
            />
            <span className="currency">USDC</span>
          </div>
          
          <div className="bet-buttons">
            <button
              className="bet-button yes"
              onClick={() => handlePlaceBet(MARKET_SIDES.YES)}
              disabled={isPlacingBet || !betAmount}
            >
              {isPlacingBet ? 'Placing...' : 'Bet Yes'}
            </button>
            <button
              className="bet-button no"
              onClick={() => handlePlaceBet(MARKET_SIDES.NO)}
              disabled={isPlacingBet || !betAmount}
            >
              {isPlacingBet ? 'Placing...' : 'Bet No'}
            </button>
          </div>
        </div>
      )}

      {market.marketState === MARKET_STATES.ACTIVE && timeLeft <= 0 && isConnected && (
        <div className="resolution-section">
          <h3>Resolve Market</h3>
          <p>Betting has ended. You can now resolve this market.</p>
          <button
            className="resolve-button"
            onClick={handleResolveMarket}
            disabled={isResolving}
          >
            {isResolving ? 'Resolving...' : 'Resolve Market'}
          </button>
        </div>
      )}

      {market.marketState === MARKET_STATES.RESOLVED && isConnected && !hasClaimed && (
        <div className="claim-section">
          <h3>Claim Your Winnings</h3>
          <p>This market has been resolved. You can now claim your winnings.</p>
          <button
            className="claim-button"
            onClick={handleClaimWinnings}
            disabled={isClaiming}
          >
            {isClaiming ? 'Claiming...' : 'Claim Winnings'}
          </button>
        </div>
      )}

      {hasClaimed && (
        <div className="claimed-section">
          <h3>✅ Winnings Claimed</h3>
          <p>You have already claimed your winnings from this market.</p>
        </div>
      )}

      {error && (
        <div className="error-message">{error}</div>
      )}
      
      {success && (
        <div className="success-message">{success}</div>
      )}

      <style jsx>{`
        .market-detail {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
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

        .market-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
          padding-bottom: 20px;
          border-bottom: 2px solid #475569;
        }

        .market-header h1 {
          color: #f1f5f9;
          font-size: 28px;
          font-weight: 700;
          margin: 0;
          flex: 1;
          margin-right: 20px;
        }

        .market-status {
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .market-status[data-state="0"] {
          background: #059669;
          color: white;
        }

        .market-status[data-state="1"] {
          background: #3b82f6;
          color: white;
        }

        .market-status[data-state="2"] {
          background: #dc2626;
          color: white;
        }

        .market-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }

        .info-card {
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          padding: 24px;
          border-radius: 12px;
          border: 1px solid #475569;
        }

        .info-card h3 {
          color: #f59e0b;
          margin: 0 0 16px 0;
          font-size: 18px;
          font-weight: 600;
        }

        .info-item, .stat-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #475569;
        }

        .info-item:last-child, .stat-row:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }

        .label, .stat-label {
          color: #94a3b8;
          font-size: 14px;
          font-weight: 500;
        }

        .value, .stat-value {
          color: #f1f5f9;
          font-size: 14px;
          font-weight: 600;
        }

        .user-section {
          background: #1e40af;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 24px;
          border-left: 4px solid #3b82f6;
        }

        .user-section h3 {
          color: #dbeafe;
          margin: 0 0 16px 0;
          font-size: 18px;
          font-weight: 600;
        }

        .user-stakes {
          display: flex;
          gap: 24px;
        }

        .stake-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stake-label {
          color: #93c5fd;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stake-value {
          color: #dbeafe;
          font-size: 16px;
          font-weight: 700;
        }

        .betting-section, .resolution-section, .claim-section, .claimed-section {
          background: #1e293b;
          padding: 24px;
          border-radius: 12px;
          border: 1px solid #475569;
          margin-bottom: 24px;
        }

        .betting-section h3, .resolution-section h3, .claim-section h3, .claimed-section h3 {
          color: #f1f5f9;
          margin: 0 0 16px 0;
          font-size: 18px;
          font-weight: 600;
        }

        .bet-input {
          display: flex;
          align-items: center;
          margin-bottom: 16px;
          background: #334155;
          border-radius: 8px;
          border: 1px solid #475569;
          overflow: hidden;
        }

        .bet-input input {
          flex: 1;
          padding: 16px;
          border: none;
          background: transparent;
          color: #f1f5f9;
          font-size: 16px;
        }

        .bet-input input:focus {
          outline: none;
        }

        .bet-input .currency {
          padding: 16px;
          background: #475569;
          color: #e2e8f0;
          font-size: 14px;
          font-weight: 600;
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
    </div>
  );
};

export default MarketDetail;
