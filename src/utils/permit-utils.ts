// src/utils/permit-utils.ts
import { ethers } from 'ethers';
import { NETWORK_CONFIGS } from '../core/constants/networks';
import { TOKEN_CONFIGS } from '../core/constants/tokens';
import { NetworkKey, TokenSymbol } from '../core/types';
import { PermitType } from '../core/types/permit';
import { TOKEN_PERMIT_TYPES } from '../core/constants/permit-config';

// ABI for fetching nonce
const NONCE_ABI = [
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'nonces',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  }
];

/**
 * Get token nonce for a specific owner
 */
export async function getTokenNonce(
  provider: ethers.providers.Provider,
  tokenAddress: string,
  ownerAddress: string
): Promise<bigint> {
  const contract = new ethers.Contract(tokenAddress, NONCE_ABI, provider);
  const nonce = await contract.nonces(ownerAddress);
  return BigInt(nonce.toString());
}

/**
 * Get token name and version for EIP-712 domain
 */
export async function getTokenNameAndVersion(
  provider: ethers.providers.Provider,
  tokenAddress: string
): Promise<{ name: string; version: string }> {
  // Define ABIs for name and version
  const nameAbi = [
    { inputs: [], name: 'name', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function' }
  ];
  const versionAbi = [
    { inputs: [], name: 'version', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function' }
  ];
  
  // Create contracts
  const nameContract = new ethers.Contract(tokenAddress, nameAbi, provider);
  
  // Get name and version
  let name: string;
  try {
    name = await nameContract.name();
  } catch (e) {
    name = "Unknown Token";
  }
  
  let version: string;
  try {
    const versionContract = new ethers.Contract(tokenAddress, versionAbi, provider);
    version = await versionContract.version();
  } catch (e) {
    version = "1";
  }
  
  return { name, version };
}

/**
 * Get the permit type for a token on a specific network
 */
export function getTokenPermitType(
  tokenSymbol: TokenSymbol,
  network: NetworkKey
): PermitType | null {
  const tokenPermits = TOKEN_PERMIT_TYPES[tokenSymbol];
  if (!tokenPermits) return null;
  
  return tokenPermits[network] || null;
}

/**
 * Check if a token supports permit on a specific network
 */
export function isPermitSupported(
  tokenSymbol: TokenSymbol,
  network: NetworkKey
): boolean {
  const permitType = getTokenPermitType(tokenSymbol, network);
  return permitType !== null && permitType !== 'REGULAR';
}