import React from 'react';
import { WalletProvider } from './contexts/WalletContext';
import ConnectWallet from './components/ConnectWallet';
import './App.css';

function App() {
  return (
    <WalletProvider>
      <div className="App">
        <header className="app-header">
          <h1 className="app-title">Lossless Prediction Market</h1>
          <p className="app-subtitle">Bet on outcomes, earn yield, never lose your principal</p>
        </header>
        
        <main className="app-main">
          <div className="wallet-section">
            <h2 className="section-title">Connect Your Wallet</h2>
            <p className="section-description">
              Connect your MetaMask wallet to start participating in prediction markets on Base network.
            </p>
            <ConnectWallet />
          </div>
          
          <div className="info-section">
            <h3 className="info-title">How it works</h3>
            <div className="info-cards">
              <div className="info-card">
                <div className="card-icon">💰</div>
                <h4>Deposit USDC</h4>
                <p>Deposit USDC into Aave to generate yield while betting</p>
              </div>
              <div className="info-card">
                <div className="card-icon">🎯</div>
                <h4>Make Predictions</h4>
                <p>Bet on "Yes" or "No" outcomes for various events</p>
              </div>
              <div className="info-card">
                <div className="card-icon">🏆</div>
                <h4>Win or Break Even</h4>
                <p>Winners get the yield, everyone gets their principal back</p>
              </div>
            </div>
          </div>
        </main>
        
      </div>
    </WalletProvider>
  );
}

export default App;
