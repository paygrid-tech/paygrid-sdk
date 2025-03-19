import { NetworkConfig } from '../types/config';

export const SUPPORTED_NETWORKS = {
  ETHEREUM: 'ethereum',
  POLYGON: 'polygon',
  OPTIMISM: 'optimism',
  ARBITRUM: 'arbitrum',
  BASE: 'base',
  SEPOLIA: 'sepolia',
  AMOY: 'amoy',
  OPTIMISM_SEPOLIA: 'optimism-sepolia',
  BASE_SEPOLIA: 'base-sepolia',
  ARBITRUM_SEPOLIA: 'arbitrum-sepolia',
} as const;

export const NETWORK_IDS = {
  // Mainnets
  ETHEREUM: 1,
  POLYGON: 137,
  OPTIMISM: 10,
  ARBITRUM: 42161,
  BASE: 8453,
  // Testnets
  SEPOLIA: 11155111,
  AMOY: 80002,
  OPTIMISM_SEPOLIA: 11155420,
  BASE_SEPOLIA: 84532,
  ARBITRUM_SEPOLIA: 421614,
} as const;

export const NETWORK_CONFIGS: Record<keyof typeof SUPPORTED_NETWORKS, NetworkConfig> = {
  ETHEREUM: {
    chainId: NETWORK_IDS.ETHEREUM,
    key: SUPPORTED_NETWORKS.ETHEREUM,
    permitSupported: true,
    defaultPermitType: 'EIP2612',
    gridGatewayProxy: '0x0000000000000000000000000000000000000000', // TODO: Add mainnet address
    explorerUrl: 'https://etherscan.io',
    defaultRpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/',
  },
  POLYGON: {
    chainId: NETWORK_IDS.POLYGON,
    key: SUPPORTED_NETWORKS.POLYGON,
    permitSupported: true,
    defaultPermitType: 'EIP2612',
    gridGatewayProxy: '0x945366b290db61105B8DbD4D50B1dFDCed7a4342',
    explorerUrl: 'https://polygonscan.com',
    defaultRpcUrl: 'https://polygon-mainnet.g.alchemy.com/v2/',
  },
  OPTIMISM: {
    chainId: NETWORK_IDS.OPTIMISM,
    key: SUPPORTED_NETWORKS.OPTIMISM,
    permitSupported: true,
    defaultPermitType: 'EIP2612',
    gridGatewayProxy: '0x4B1d5b0aF5AbAe333C8d2CCa2a346e0D5f68C427',
    explorerUrl: 'https://optimistic.etherscan.io',
    defaultRpcUrl: 'https://opt-mainnet.g.alchemy.com/v2/',
  },
  ARBITRUM: {
    chainId: NETWORK_IDS.ARBITRUM,
    key: SUPPORTED_NETWORKS.ARBITRUM,
    permitSupported: true,
    defaultPermitType: 'EIP2612',
    gridGatewayProxy: '0x4B1d5b0aF5AbAe333C8d2CCa2a346e0D5f68C427',
    explorerUrl: 'https://arbiscan.io',
    defaultRpcUrl: 'https://arb-mainnet.g.alchemy.com/v2/',
  },
  BASE: {
    chainId: NETWORK_IDS.BASE,
    key: SUPPORTED_NETWORKS.BASE,
    permitSupported: true,
    defaultPermitType: 'EIP2612',
    gridGatewayProxy: '0x93F07df792F40693fb9A31e62711aA6AFfe7efc6',
    explorerUrl: 'https://basescan.org',
    defaultRpcUrl: 'https://base-mainnet.g.alchemy.com/v2/',
  },
  // Testnets
  SEPOLIA: {
    chainId: NETWORK_IDS.SEPOLIA,
    key: SUPPORTED_NETWORKS.SEPOLIA,
    permitSupported: true,
    defaultPermitType: 'EIP2612',
    gridGatewayProxy: '0x0000000000000000000000000000000000000000', // TODO: Add sepolia address
    explorerUrl: 'https://sepolia.etherscan.io',
    defaultRpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/',
  },
  AMOY: {
    chainId: NETWORK_IDS.AMOY,
    key: SUPPORTED_NETWORKS.AMOY,
    permitSupported: true,
    defaultPermitType: 'EIP2612',
    gridGatewayProxy: '0x0000000000000000000000000000000000000000', // TODO: Add amoy address
    explorerUrl: 'https://polygonscan.com',
    defaultRpcUrl: 'https://polygon-amoy.g.alchemy.com/v2/',
  },
  OPTIMISM_SEPOLIA: {
    chainId: NETWORK_IDS.OPTIMISM_SEPOLIA,
    key: SUPPORTED_NETWORKS.OPTIMISM_SEPOLIA,
    permitSupported: true,
    defaultPermitType: 'EIP2612',
    gridGatewayProxy: '0x0000000000000000000000000000000000000000', // TODO: Add optimism sepolia address
    explorerUrl: 'https://optimism-sepolia.etherscan.io',
    defaultRpcUrl: 'https://opt-sepolia.g.alchemy.com/v2/',
  },
  BASE_SEPOLIA: {
    chainId: NETWORK_IDS.BASE_SEPOLIA,
    key: SUPPORTED_NETWORKS.BASE_SEPOLIA,
    permitSupported: true,
    defaultPermitType: 'EIP2612',
    gridGatewayProxy: '0x0000000000000000000000000000000000000000', // TODO: Add base sepolia address
    explorerUrl: 'https://base-sepolia.etherscan.io',
    defaultRpcUrl: 'https://base-sepolia.g.alchemy.com/v2/',
  },
  ARBITRUM_SEPOLIA: {
    chainId: NETWORK_IDS.ARBITRUM_SEPOLIA,
    key: SUPPORTED_NETWORKS.ARBITRUM_SEPOLIA,
    permitSupported: true,
    defaultPermitType: 'EIP2612',
    gridGatewayProxy: '0x0000000000000000000000000000000000000000', // TODO: Add arbitrum sepolia address
    explorerUrl: 'https://arbiscan.io',
    defaultRpcUrl: 'https://arb-sepolia.g.alchemy.com/v2/',
  },
} as const;

// Network Feature Support
export const NETWORK_FEATURES = {
  PERMIT2_SUPPORT: ['ETHEREUM', 'POLYGON', 'OPTIMISM', 'ARBITRUM', 'BASE'],
  CROSS_CHAIN_SUPPORT: ['ETHEREUM', 'POLYGON', 'OPTIMISM', 'ARBITRUM', 'BASE'],
  SAME_CHAIN_SUPPORT: ['ETHEREUM', 'POLYGON', 'OPTIMISM', 'ARBITRUM', 'BASE'],
} as const;

export enum Networks {
  ETHEREUM = 'ETHEREUM',
  POLYGON = 'POLYGON',
  BASE = 'BASE',
  ARBITRUM = 'ARBITRUM',
  OPTIMISM = 'OPTIMISM'
}