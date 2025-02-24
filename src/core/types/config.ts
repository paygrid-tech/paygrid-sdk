import { SUPPORTED_NETWORKS } from "../constants/networks";
import { SDK_CONFIG } from "../constants/config";
// Define permit types based on usage in tokens.ts
export type PermitType = 'EIP2612' | 'USDC_ETHEREUM' | 'USDC_OPTIMISM' | 'REGULAR' | 'DAI';

export interface NetworkConfig {
  chainId: number;
  key: (typeof SUPPORTED_NETWORKS)[keyof typeof SUPPORTED_NETWORKS];
  permitSupported: boolean;
  defaultPermitType: PermitType;
  gridGatewayProxy: `0x${string}`; // Updated to match networks.ts
  explorerUrl: string;
  defaultRpcUrl: string;
}

export interface TokenConfig {
  symbol: string;
  decimals: number;
  permitType: Partial<Record<keyof typeof SUPPORTED_NETWORKS, PermitType>>;
  version: string;
  address: Partial<Record<keyof typeof SUPPORTED_NETWORKS, `0x${string}`>>;
}

export interface SDKConfig {
  environment?: keyof typeof SDK_CONFIG.ENVIRONMENTS;
  apiKey?: string;
  defaultNetwork?: keyof typeof SUPPORTED_NETWORKS;
  timeout?: number;
  maxRetries?: number;
  customRpcUrls?: Partial<Record<keyof typeof SUPPORTED_NETWORKS, string>>;
}

export interface PaygridAPIConfig {
  baseUrl: string;
  version: string;
  timeout: number;
  headers: Record<string, string>;
}

export interface PaygridAPIError extends Error {
    status: number;
    data?: any;
    config?: any;
  }

export interface PermitConfig {
  type: PermitType;
  version: string;
  name: string;
  verifyingContract: `0x${string}`;
}

export interface NetworkFeatureSupport {
  permit2: boolean;
  crossChain: boolean;
  sameChain: boolean;
}