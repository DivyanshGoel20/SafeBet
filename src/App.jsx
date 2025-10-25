import React, { useState } from 'react';
import { WalletProvider } from './contexts/WalletContext';
import { AdminProvider } from './contexts/AdminContext';
import { MarketProvider } from './contexts/MarketContext';
import Navigation from './components/Navigation';
import HomePage from './components/HomePage';
import MarketsPage from './components/MarketsPage';
import AdminPage from './components/AdminPage';
import MarketDetail from './components/MarketDetail';
import { NotificationProvider, TransactionPopupProvider } from '@blockscout/app-sdk';
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

  const navigateToMarkets = () => {
    setCurrentPage('markets');
    setSelectedMarket(null);
  };

  return (
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
                  <MarketDetail marketAddress={selectedMarket} onBack={navigateToMarkets} />
                )}
              </div>
            </MarketProvider>
          </WalletProvider>
        </AdminProvider>
      </TransactionPopupProvider>
    </NotificationProvider>
  );
}

export default App;
