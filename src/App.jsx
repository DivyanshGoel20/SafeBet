import React from 'react';
import { WalletProvider } from './contexts/WalletContext';
import { AdminProvider } from './contexts/AdminContext';
import ConnectWallet from './components/ConnectWallet';
import AdminPanel from './components/AdminPanel';
// import WalletBridge from './components/WalletBridge';
import { NotificationProvider, TransactionPopupProvider } from '@blockscout/app-sdk';
// import { NexusProvider } from '@avail-project/nexus-widgets';
import './App.css';

function App() {
  return (
    // <NexusProvider
    //   config={{
    //     debug: false, // Set to true for debug logs
    //     network: 'testnet', // "mainnet" or "testnet"
    //   }}
    // >
      <NotificationProvider>
        <TransactionPopupProvider>
          <AdminProvider>
            <WalletProvider>
              <div className="App">
                {/* Hero Section */}
                <section className="hero-section">
                  <div className="hero-content">
                    <div className="hero-text">
                      <h1 className="hero-title">
                        🎯 Lossless Prediction Markets
                      </h1>
                      <p className="hero-subtitle">
                        Bet on outcomes, earn yield, never lose your principal. 
                        The future of risk-free prediction markets on Base.
                      </p>
                      <div className="hero-stats">
                        <div className="stat">
                          <span className="stat-number">0%</span>
                          <span className="stat-label">Risk of Loss</span>
                        </div>
                        <div className="stat">
                          <span className="stat-number">100%</span>
                          <span className="stat-label">Principal Protected</span>
                        </div>
                        <div className="stat">
                          <span className="stat-number">∞</span>
                          <span className="stat-label">Yield Potential</span>
                        </div>
                      </div>
                    </div>
                    <div className="hero-actions">
                      <ConnectWallet />
                    </div>
                  </div>
                </section>

                {/* Main Content */}
                <main className="main-content">
                  <div className="content-grid">
                    {/* Left Column - Wallet & Admin */}
                    <div className="left-column">
                      <div className="card wallet-card">
                        <h3>🔗 Wallet Connection</h3>
                        <ConnectWallet />
                      </div>
                      
                      <AdminPanel />
                    </div>

                    {/* Right Column - How it Works */}
                    <div className="right-column">
                      <div className="card how-it-works">
                        <h3>🚀 How It Works</h3>
                        <div className="steps">
                          <div className="step">
                            <div className="step-number">1</div>
                            <div className="step-content">
                              <h4>Deposit & Earn</h4>
                              <p>Deposit USDC into Aave to generate yield while you predict</p>
                            </div>
                          </div>
                          <div className="step">
                            <div className="step-number">2</div>
                            <div className="step-content">
                              <h4>Make Predictions</h4>
                              <p>Bet "Yes" or "No" on real-world events with zero risk</p>
                            </div>
                          </div>
                          <div className="step">
                            <div className="step-number">3</div>
                            <div className="step-content">
                              <h4>Win or Break Even</h4>
                              <p>Winners get the yield, everyone gets their principal back</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="card features">
                        <h3>✨ Key Features</h3>
                        <div className="feature-list">
                          <div className="feature">
                            <span className="feature-icon">🛡️</span>
                            <span>Principal Protection</span>
                          </div>
                          <div className="feature">
                            <span className="feature-icon">💰</span>
                            <span>Yield Generation</span>
                          </div>
                          <div className="feature">
                            <span className="feature-icon">⚡</span>
                            <span>Instant Settlement</span>
                          </div>
                          <div className="feature">
                            <span className="feature-icon">🌐</span>
                            <span>Base Network</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </main>

                {/* Footer */}
                <footer className="app-footer">
                  <div className="footer-content">
                    <p>Built on Base • Powered by Aave • Secured by Smart Contracts</p>
                  </div>
                </footer>
              </div>
            </WalletProvider>
          </AdminProvider>
        </TransactionPopupProvider>
      </NotificationProvider>
    // </NexusProvider>
  );
}

export default App;
