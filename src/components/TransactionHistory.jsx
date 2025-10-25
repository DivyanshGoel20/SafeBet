import React from 'react';
import { useTransactionPopup } from '@blockscout/app-sdk';

const TransactionHistory = ({ marketAddress, isOpen, onClose }) => {
  const { openPopup } = useTransactionPopup();

  React.useEffect(() => {
    if (isOpen && marketAddress) {
      // Open BlockScout transaction popup for the specific market address
      openPopup({
        chainId: "1500", // Arbitrum Sepolia chain ID
        address: marketAddress
      });
      // Close our modal since BlockScout popup will handle the display
      onClose();
    }
  }, [isOpen, marketAddress, openPopup, onClose]);

  // This component now just triggers the BlockScout popup
  // No need to return anything since BlockScout handles the display
  return null;
};

export default TransactionHistory;
