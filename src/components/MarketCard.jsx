import React, { useState, useEffect } from 'react';
import { useMarket } from '../contexts/MarketContext';
import { useWallet } from '../contexts/WalletContext';
import { ethers } from 'ethers';
import { MARKET_STATES, MARKET_SIDES, extractPriceFromQuestion } from '../utils/contracts';

const MarketCard = ({ market, onClick }) => {
  const { placeBet, getUserMarketStake, hasUserClaimedFromMarket, getMarketTimeLeft } = useMarket();
  const { account, isConnected } = useWallet();
  
  const [betAmount, setBetAmount] = useState('');
  const [userStake, setUserStake] = useState({ yesStake: '0', noStake: '0' });
  const [hasClaimed, setHasClaimed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [betError, setBetError] = useState(null);
  const [betSuccess, setBetSuccess] = useState(null);

  // Load user's stake in this market
  useEffect(() => {
    if (account && market) {
      loadUserStake();
      checkClaimStatus();
    }
  }, [account, market]);

  // Load time left for betting
  useEffect(() => {
    if (market) {
      loadTimeLeft();
      const interval = setInterval(loadTimeLeft, 1000);
      return () => clearInterval(interval);
    }
  }, [market]);

  const loadUserStake = async () => {
    try {
      const stake = await getUserMarketStake(market.address);
      setUserStake(stake);
    } catch (err) {
      console.error('Error loading user stake:', err);
    }
  };

  const checkClaimStatus = async () => {
    try {
      const claimed = await hasUserClaimedFromMarket(market.address);
      setHasClaimed(claimed);
    } catch (err) {
      console.error('Error checking claim status:', err);
    }
  };

  const loadTimeLeft = async () => {
    try {
      const time = await getMarketTimeLeft(market.address);
      setTimeLeft(Number(time));
    } catch (err) {
      console.error('Error loading time left:', err);
    }
  };

  const handlePlaceBet = async (side) => {
    if (!isConnected || !account) {
      setBetError('Please connect your wallet first');
      return;
    }

    if (!betAmount || Number(betAmount) <= 0) {
      setBetError('Please enter a valid bet amount');
      return;
    }

    if (market.marketState !== MARKET_STATES.ACTIVE) {
      setBetError('This market is not active');
      return;
    }

    if (timeLeft <= 0) {
      setBetError('Betting period has ended');
      return;
    }

    setIsPlacingBet(true);
    setBetError(null);
    setBetSuccess(null);

    try {
      const amount = ethers.parseUnits(betAmount, 6); // USDC has 6 decimals
      await placeBet(market.address, side, amount);
      
      setBetSuccess(`Bet placed successfully!`);
      setBetAmount('');
      await loadUserStake(); // Refresh user stake
    } catch (err) {
      console.error('Error placing bet:', err);
      setBetError(err.message);
    } finally {
      setIsPlacingBet(false);
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

  const getMarketStatusColor = () => {
    switch (market.marketState) {
      case MARKET_STATES.ACTIVE:
        return timeLeft > 0 ? '#059669' : '#f59e0b';
      case MARKET_STATES.RESOLVED:
        return '#3b82f6';
      case MARKET_STATES.CANCELLED:
        return '#dc2626';
      default:
        return '#64748b';
    }
  };

  const getMarketStatusText = () => {
    switch (market.marketState) {
      case MARKET_STATES.ACTIVE:
        return timeLeft > 0 ? 'Active' : 'Betting Ended';
      case MARKET_STATES.RESOLVED:
        return 'Resolved';
      case MARKET_STATES.CANCELLED:
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="market-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="market-header">
        <h3>{market.question}</h3>
        <div className="market-status" style={{ backgroundColor: getMarketStatusColor() }}>
          {getMarketStatusText()}
        </div>
      </div>

      <div className="market-info">
        <div className="info-row">
          <span className="info-label">Target Price:</span>
          <span className="info-value">${extractPriceFromQuestion(market.question)}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Resolve Date:</span>
          <span className="info-value">
            {new Date(Number(market.resolveDate) * 1000).toLocaleString()}
          </span>
        </div>
        {timeLeft > 0 && (
          <div className="info-row">
            <span className="info-label">Time Left:</span>
            <span className="info-value">{formatTimeLeft(timeLeft)}</span>
          </div>
        )}
      </div>

      <div className="market-stats">
        <div className="stat-box">
          <div className="stat-label">Yes</div>
          <div className="stat-value">{ethers.formatUnits(market.totalYes, 6)} USDC</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">No</div>
          <div className="stat-value">{ethers.formatUnits(market.totalNo, 6)} USDC</div>
        </div>
      </div>

      {account && (
        <div className="user-stake">
          <div className="stake-info">
            <span>Your Yes Stake: {ethers.formatUnits(userStake.yesStake, 6)} USDC</span>
            <span>Your No Stake: {ethers.formatUnits(userStake.noStake, 6)} USDC</span>
          </div>
        </div>
      )}

      {market.marketState === MARKET_STATES.ACTIVE && timeLeft > 0 && isConnected && (
        <div className="betting-section" onClick={(e) => e.stopPropagation()}>
          <div className="bet-input">
            <input
              type="number"
              step="0.01"
              placeholder="Enter USDC amount"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              disabled={isPlacingBet}
              onClick={(e) => e.stopPropagation()}
            />
            <span className="currency">USDC</span>
          </div>
          
          <div className="bet-buttons">
            <button
              className="bet-button yes"
              onClick={(e) => {
                e.stopPropagation();
                handlePlaceBet(MARKET_SIDES.YES);
              }}
              disabled={isPlacingBet || !betAmount}
            >
              {isPlacingBet ? 'Placing...' : 'Bet Yes'}
            </button>
            <button
              className="bet-button no"
              onClick={(e) => {
                e.stopPropagation();
                handlePlaceBet(MARKET_SIDES.NO);
              }}
              disabled={isPlacingBet || !betAmount}
            >
              {isPlacingBet ? 'Placing...' : 'Bet No'}
            </button>
          </div>

          {betError && (
            <div className="error-message">{betError}</div>
          )}
          
          {betSuccess && (
            <div className="success-message">{betSuccess}</div>
          )}
        </div>
      )}

      {market.marketState === MARKET_STATES.RESOLVED && (
        <div className="resolution-info">
          <div className="winning-side">
            Winning Side: <strong>{market.winningSide === MARKET_SIDES.YES ? 'Yes' : 'No'}</strong>
          </div>
          {market.resolvedInterest !== '0' && (
            <div className="interest-info">
              Total Interest Generated: {ethers.formatUnits(market.resolvedInterest, 6)} USDC
            </div>
          )}
        </div>
      )}

      <style jsx="true">{`
        .market-card {
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          border-radius: 12px;
          padding: 20px;
          border: 1px solid #475569;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .market-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .market-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }


        .market-header h3 {
          margin: 0;
          color: #f1f5f9;
          font-size: 18px;
          font-weight: 600;
          flex: 1;
          margin-right: 12px;
          line-height: 1.4;
        }

        .market-status {
          padding: 6px 12px;
          border-radius: 6px;
          color: white;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .market-info {
          margin-bottom: 16px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .info-label {
          color: #94a3b8;
          font-size: 14px;
          font-weight: 500;
        }

        .info-value {
          color: #e2e8f0;
          font-size: 14px;
          font-weight: 600;
        }

        .market-stats {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
        }

        .stat-box {
          flex: 1;
          background: #1e293b;
          padding: 12px;
          border-radius: 8px;
          text-align: center;
          border: 1px solid #475569;
        }

        .stat-label {
          color: #94a3b8;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .stat-value {
          color: #f1f5f9;
          font-size: 16px;
          font-weight: 700;
        }

        .user-stake {
          background: #1e40af;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 16px;
          border-left: 3px solid #3b82f6;
        }

        .stake-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stake-info span {
          color: #dbeafe;
          font-size: 13px;
          font-weight: 500;
        }

        .betting-section {
          background: #1e293b;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #475569;
        }

        .bet-input {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
          background: #334155;
          border-radius: 6px;
          border: 1px solid #475569;
          overflow: hidden;
        }

        .bet-input input {
          flex: 1;
          padding: 12px;
          border: none;
          background: transparent;
          color: #f1f5f9;
          font-size: 14px;
        }

        .bet-input input:focus {
          outline: none;
        }

        .bet-input .currency {
          padding: 12px;
          background: #475569;
          color: #e2e8f0;
          font-size: 12px;
          font-weight: 600;
        }

        .bet-buttons {
          display: flex;
          gap: 12px;
        }

        .bet-button {
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .bet-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .bet-button.yes {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          color: white;
        }

        .bet-button.yes:hover:not(:disabled) {
          background: linear-gradient(135deg, #047857 0%, #065f46 100%);
          transform: translateY(-1px);
        }

        .bet-button.no {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          color: white;
        }

        .bet-button.no:hover:not(:disabled) {
          background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
          transform: translateY(-1px);
        }

        .error-message {
          background: #dc2626;
          color: white;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          margin-top: 8px;
        }

        .success-message {
          background: #059669;
          color: white;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          margin-top: 8px;
        }

        .resolution-info {
          background: #1e40af;
          padding: 12px;
          border-radius: 8px;
          border-left: 3px solid #3b82f6;
        }

        .winning-side {
          color: #dbeafe;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .interest-info {
          color: #93c5fd;
          font-size: 12px;
        }

        @media (max-width: 768px) {
          .market-stats {
            flex-direction: column;
            gap: 8px;
          }

          .bet-buttons {
            flex-direction: column;
          }

          .market-header {
            flex-direction: column;
            gap: 8px;
          }

          .market-header h3 {
            margin-right: 0;
          }
        }
      `}</style>

    </div>
  );
};

export default MarketCard;
