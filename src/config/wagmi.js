import { createConfig, http } from 'wagmi';
import { mainnet, sepolia, arbitrumSepolia } from 'wagmi/chains';
import { metaMask, injected } from 'wagmi/connectors';

// Arbitrum Sepolia Testnet configuration
const arbitrumSepoliaChain = {
  id: 421614,
  name: 'Arbitrum Sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://sepolia-rollup.arbitrum.io/rpc'],
      webSocket: ['wss://sepolia-rollup.arbitrum.io/ws'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Arbiscan Sepolia',
      url: 'https://sepolia.arbiscan.io',
    },
  },
  testnet: true,
};

export const wagmiConfig = createConfig({
  chains: [arbitrumSepoliaChain],
  connectors: [
    metaMask(),
    injected({
      target() {
        return typeof window !== 'undefined' ? window.ethereum : null;
      },
    }),
  ],
  transports: {
    [421614]: http('https://sepolia-rollup.arbitrum.io/rpc'),
  },
});

