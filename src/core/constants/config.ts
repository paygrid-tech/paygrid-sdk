import { ethers } from "ethers";

// API and Service Configuration
export const PAYGRID_API = {
  BASE_URL: 'https://api.paygrid.co',
  VERSION: 'v1',
  ENDPOINTS: {
    PAYMENTS: '/payments',
    CORRIDOR_QUOTES: '/corridors/quotes',
    // OPERATORS: '/operators',
  },
} as const;

// Grid Gateway Proxy Contract Addresses
export const GRID_GATEWAY_PROXY: Record<string, string> = {
  ETHEREUM: '0x0000000000000000000000000000000000000000', // TODO: Add mainnet address
  OPTIMISM: '0x4B1d5b0aF5AbAe333C8d2CCa2a346e0D5f68C427',
  POLYGON: '0x945366b290db61105B8DbD4D50B1dFDCed7a4342',
  BASE: '0x93F07df792F40693fb9A31e62711aA6AFfe7efc6',
  ARBITRUM: '0x4B1d5b0aF5AbAe333C8d2CCa2a346e0D5f68C427',
} as const;

// Fee Configuration (in basis points)
export const FEE_CONFIG = {
  GATEWAY_FEE_BPS: BigInt(10), // 0.1% (10 bps)
  BPS_DENOMINATOR: BigInt(10000),
  MAX_FEE_BPS: BigInt(1000), // 10% maximum fee
} as const;

// Permit2 Configuration
export const PERMIT2_CONFIG = {
  ADDRESS: '0x000000000022D473030F116dDEE9F6B43aC78BA3' as `0x${string}`,
  DOMAIN_NAME: 'Permit2',
  DOMAIN_VERSION: '1',
} as const;

// SDK Configuration
export const SDK_CONFIG = {
  VERSION: '0.1.0',
  DEFAULT_TIMEOUT: 180000, // 3 minutes
  POLL_INTERVAL: 2000, // 2 seconds
  MAX_RETRIES: 600, // 30 minutes (2 second intervals)
  ENVIRONMENTS: {
    MAINNET: 'mainnet',
    TESTNET: 'testnet',
  },
} as const;

// EIP-712 type definitions for payment intents and permits
export const WITNESS_TYPE_STRING =
  "PaymentIntent witness)" +
  "Domain(address account,uint256 network_id,address payment_token)" +
  "OperatorData(bytes32 operatorId,address operator,address treasury_account,uint256 fee)" +
  "PaymentIntent(uint8 payment_type,OperatorData operator_data,uint256 amount,Domain source,Domain destination,uint256 processing_date,uint256 expires_at)" +
  "PaymentIntent(uint8 payment_type,OperatorData operator_data,uint256 amount,Domain source,Domain destination,uint256 processing_date,uint256 expires_at)" +
  "TokenPermissions(address token,uint256 amount)";

// Type hash stubs for permit batch transfers
export const PERMIT_BATCH_WITNESS_TRANSFER_FROM_TYPEHASH_STUB =
  "PermitBatchWitnessTransferFrom(TokenPermissions[] permitted,address spender,uint256 nonce,uint256 deadline,";

// Keccak256 hashes of various type definitions for EIP-712 signing
export const WITNESS_PAYMENT_INTENT_TYPEHASH = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes(
    "PaymentIntent(uint8 payment_type,OperatorData operator_data,uint256 amount,Domain source,Domain destination,uint256 processing_date,uint256 expires_at)"
  )
);

export const WITNESS_OPERATOR_DATA_TYPEHASH = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes(
    "OperatorData(bytes32 operatorId,address operator,address treasury_account,uint256 fee)"
  )
);

export const DOMAIN_TYPEHASH = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes(
    "Domain(address account,uint256 network_id,address payment_token)"
  )
);
