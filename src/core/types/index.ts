import { SUPPORTED_NETWORKS } from '../constants/networks';
import { SUPPORTED_TOKENS } from '../constants/tokens';
import { TypedDataDomain, TypedDataField } from 'ethers';

export type NetworkKey = keyof typeof SUPPORTED_NETWORKS;
export type TokenSymbol = keyof typeof SUPPORTED_TOKENS;

// Define final payment states
export const FINAL_PAYMENT_STATES = ['COMPLETED', 'FAILED', 'CANCELLED'] as const;

export type PermitType = 
  | 'EIP2612'
  | 'DAI'
  | 'USDC_ETHEREUM'
  | 'USDC_OPTIMISM'
  | 'REGULAR'
  | 'SKIP';

export interface NetworkConfig {
  chainId: number;
  name: string;
  permitSupported: boolean;
  defaultPermitType: PermitType;
}

export interface TokenConfig {
  symbol: string;
  decimals: number;
  permitType: Record<NetworkKey, PermitType>;
  version: string;
  addresses: Record<NetworkKey, string>;
}

export enum PaymentType {
  ONE_TIME = 'one-time',
  RECURRING = 'recurring',
}

export enum GridPaymentType {
  ONE_TIME = 0,
  RECURRING = 1,
}

export enum PaymentStatus {
  RELEASED_TO_GATEWAY = 'RELEASED_TO_GATEWAY',
  PROCESSING = 'PROCESSING',
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export enum ChargeBearer {
  OPERATOR = 'OPERATOR',
  PAYEE = 'PAYEE',
  PAYER = 'PAYER',
  PG_GATEWAY = 'PG_GATEWAY',
}

export enum IntervalUnit {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  YEAR = 'YEAR',
}

export enum RoutingPriority {
  AUTO = 'AUTO',
  BALANCED = 'BALANCED',
  COST = 'COST',
  SPEED = 'SPEED',
}

export interface OperatorData {
  id: string; // bytes32 hex string
  operator: string; // address
  authorized_delegates?: string[]; // address[]
  treasury: string; // address
  fee_bps?: number;
  webhook_url?: string;
}

export interface SourceDomain {
  from_account: string;
  network_id: NetworkKey | typeof SUPPORTED_NETWORKS[NetworkKey];
  payment_token: TokenSymbol | typeof SUPPORTED_TOKENS[TokenSymbol];
}

export interface DestinationDomain {
  to_account: string;
  network_id: NetworkKey | typeof SUPPORTED_NETWORKS[NetworkKey];
  payment_token: TokenSymbol | typeof SUPPORTED_TOKENS[TokenSymbol];
}

export interface Schedule {
  interval_unit: IntervalUnit;
  interval_count: number;
  iterations?: number;
  start_date: number; // unix timestamp
  end_date?: number; // unix timestamp
}

export interface Authorization {
  permit2_permit: {
    signature?: string;
    nonce: string | bigint;
    deadline: number | string | bigint;
  };
  initial_permit?: {
    nonce: string | bigint;
    deadline: number | string | bigint;
    signature?: string;
  };
}

export interface BlockchainTransaction {
  src_tx_hash: string | null;
  dst_tx_hash: string | null;
  error: string | null;
  effectiveGasPrice: string | null;
  gasUsed: string | null;
  gasAmountUSD: string | null;
}

export interface BlockchainMetadata {
  payment_gateway_proxy: string;
  transaction?: BlockchainTransaction;
}

export interface ProcessingFees {
  corridor_fees?: string; // Format: "0.00"
  charge_bearer: ChargeBearer;
}

// Main Payment Intent type
export interface PaymentIntent {
  payment_type: PaymentType;
  operator_data: OperatorData;
  amount: number; // Amount in cents
  source: SourceDomain;
  destination: DestinationDomain;
  schedule?: Schedule;
  routing_priority?: RoutingPriority;
  processing_date?: number | bigint;
  expiration_date: number | bigint;
  authorizations: Authorization;
  processing_fees?: ProcessingFees;
  payment_reference?: string;
  metadata?: Record<string, any>;
}

export interface PaymentIntentResponse {
  id: string;
  payment_type: PaymentType | string;
  routing_priority: RoutingPriority;
  operator_data: {
    id: string;
    operator: string;
    treasury: string;
    fee_bps: number;
    webhook_url?: string;
    authorized_delegates?: string[];
  };
  amount: number;
  source: {
    from_account: string;
    network_id: string | number;
    payment_token: string;
  };
  destination: {
    to_account: string;
    network_id: string | number;
    payment_token: string;
  };
  status: PaymentStatus;
  processing_date: string; // ISO datetime
  processing_fees?: ProcessingFees;
  payment_reference?: string;
  metadata?: Record<string, any> | null;
  blockchain_metadata?: BlockchainMetadata;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

export type EIP712Domain = TypedDataDomain;
export type EIP712Types = Record<string, TypedDataField[]>;
export type EIP712Values = Record<string, any>;