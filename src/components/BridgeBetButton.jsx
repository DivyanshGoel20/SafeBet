import React from 'react';
import { BridgeAndExecuteButton, TOKEN_METADATA } from '@avail-project/nexus-widgets';
import { parseUnits } from 'viem';

const BridgeBetButton = ({ 
  marketAddress, 
  side, 
  amount, 
  children 
}) => {
  // Arbitrum Sepolia chain ID
  const ARBITRUM_SEPOLIA_CHAIN_ID = 421614;

  const placeBetFunctionName = side === 1 ? 'placeBetYes' : 'placeBetNo';
  
  const marketContractAbi = [
    {
      name: 'placeBetYes',
      type: 'function',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'amount', type: 'uint256' }
      ],
      outputs: [],
    },
    {
      name: 'placeBetNo',
      type: 'function',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'amount', type: 'uint256' }
      ],
      outputs: [],
    },
  ];

  return (
    <BridgeAndExecuteButton
      contractAddress={marketAddress}
      contractAbi={marketContractAbi}
      functionName={placeBetFunctionName}
      buildFunctionParams={(token, amountInput, chainId, userAddress) => {
        console.log('Building function params:', { token, amountInput, chainId, userAddress });
        
        try {
          // Use the user input amount or fallback to prop
          const amountToParse = amountInput || amount || '0';
          const decimals = TOKEN_METADATA[token]?.decimals || 6; // USDC has 6 decimals
          const amountWei = parseUnits(amountToParse.toString(), decimals);
          
          console.log('Parsed amount:', amountWei.toString());
          
          return {
            functionParams: [amountWei],
          };
        } catch (error) {
          console.error('Error building function params:', error);
          throw error;
        }
      }}
      prefill={{
        toChainId: ARBITRUM_SEPOLIA_CHAIN_ID,
        token: 'USDC',
        amount: amount,
      }}
    >
      {({ onClick, isLoading, disabled }) => children({ onClick, isLoading, disabled })}
    </BridgeAndExecuteButton>
  );
};

export default BridgeBetButton;

