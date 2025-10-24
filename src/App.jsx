import React, { useState } from 'react';
import { WalletProvider } from './contexts/WalletContext';
import { AdminProvider } from './contexts/AdminContext';
import { MarketProvider } from './contexts/MarketContext';
import Navigation from './components/Navigation';
import HomePage from './components/HomePage';
import MarketsPage from './components/MarketsPage';
import AdminPage from './components/AdminPage';
import MarketDetail from './components/MarketDetail';
// import WalletBridge from './components/WalletBridge';
import { NotificationProvider, TransactionPopupProvider } from '@blockscout/app-sdk';
// import { NexusProvider } from '@avail-project/nexus-widgets';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedMarket, setSelectedMarket] = useState(null);

  const navigateToPage = (page) => {
    setCurrentPage(page);
    setSelectedMarket(null);
  };

  const navigateToMarket = (marketAddress) => {
    setSelectedMarket(marketAddress);
    setCurrentPage('market');
  };

  const navigateToHome = () => {
    setCurrentPage('home');
    setSelectedMarket(null);
  };

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
              <MarketProvider>
                <div className="App">
                  <Navigation currentPage={currentPage} onNavigate={navigateToPage} />
                  
                  {currentPage === 'home' && <HomePage />}
                  {currentPage === 'markets' && <MarketsPage onMarketClick={navigateToMarket} />}
                  {currentPage === 'admin' && <AdminPage />}
                  {currentPage === 'market' && (
                    <MarketDetail marketAddress={selectedMarket} onBack={navigateToHome} />
                  )}
                </div>
              </MarketProvider>
            </WalletProvider>
          </AdminProvider>
        </TransactionPopupProvider>
      </NotificationProvider>
    // </NexusProvider>
  );
}

export default App;
