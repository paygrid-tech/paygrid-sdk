// src/core/constants/permit-config.ts
import { NetworkKey, TokenSymbol } from '../types';
import { PermitType } from '../types/permit';

// EIP-712 type definitions
export const EIP2612_PERMIT_TYPES = {
  Permit: [
    { name: 'owner', type: 'address' },
    { name: 'spender', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' }
  ]
};

export const DAI_PERMIT_TYPES = {
  Permit: [
    { name: 'holder', type: 'address' },
    { name: 'spender', type: 'address' },
    { name: 'nonce', type: 'uint256' },
    { name: 'expiry', type: 'uint256' },
    { name: 'allowed', type: 'bool' }
  ]
};

// Token permit type mapping
export const TOKEN_PERMIT_TYPES: Record<TokenSymbol, Partial<Record<NetworkKey, PermitType>>> = {
  USDC: {
    ETHEREUM: 'EIP2612',
    POLYGON: 'EIP2612',
    OPTIMISM: 'EIP2612',
    ARBITRUM: 'EIP2612',
    BASE: 'EIP2612'
  },
  USDT: {
    ETHEREUM: 'REGULAR',
    POLYGON: 'REGULAR',
    OPTIMISM: 'REGULAR',
    ARBITRUM: 'REGULAR',
    BASE: 'REGULAR'
  },
  DAI: {
    ETHEREUM: 'DAI',
    POLYGON: 'DAI',
    OPTIMISM: 'EIP2612',
    ARBITRUM: 'EIP2612',
    BASE: 'REGULAR'
  }
};