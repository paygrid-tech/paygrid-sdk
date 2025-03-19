import { TokenConfig } from '../types/config';
import { SUPPORTED_NETWORKS } from './networks';

export const SUPPORTED_TOKENS = {
  USDC: 'USDC',
  USDT: 'USDT',
  DAI: 'DAI',
} as const;

export enum Tokens {
  USDC = 'USDC',
  USDT = 'USDT',
  DAI = 'DAI'
}

export const TOKEN_CONFIGS: Record<keyof typeof SUPPORTED_TOKENS, TokenConfig> = {
  USDC: {
    symbol: 'USDC',
    decimals: 6,
    permitType: {
      ETHEREUM: 'USDC_ETHEREUM',
      POLYGON: 'EIP2612',
      OPTIMISM: 'USDC_OPTIMISM',
      ARBITRUM: 'EIP2612',
      BASE: 'EIP2612',
    },
    version: '2',
    address: {
      ETHEREUM: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      POLYGON: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
      OPTIMISM: '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
      ARBITRUM: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
      BASE: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    }
  },
  USDT: {
    symbol: 'USDT',
    decimals: 6,
    permitType: {
      ETHEREUM: 'REGULAR',
      POLYGON: 'REGULAR',
      OPTIMISM: 'REGULAR',
      ARBITRUM: 'REGULAR',
      BASE: 'REGULAR',
    },
    version: '1',
    address: {
      ETHEREUM: '0xdac17f958d2ee523a2206206994597c13d831ec7',
      POLYGON: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
      OPTIMISM: '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58',
      ARBITRUM: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
      BASE: '0xfde4c96c8593536e31f229ea8f37b2ada2699bb2',
    }
  },
  DAI: {
    symbol: 'DAI',
    decimals: 18,
    permitType: {
      ETHEREUM: 'DAI',
      POLYGON: 'DAI',
      OPTIMISM: 'EIP2612',
      ARBITRUM: 'EIP2612',
      BASE: 'REGULAR',
    },
    version: '1',
    address: {
      ETHEREUM: '0x6b175474e89094c44da98b954eedeac495271d0f',
      POLYGON: '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063',
      OPTIMISM: '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1',
      ARBITRUM: '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1',
      BASE: '0x50c5725949a6f0c72e6c4a641f24049a917db0cb',
    }
  },
} as const;

// Common constants
export const PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3' as const;
export const BPS_DENOMINATOR = BigInt(10000); 