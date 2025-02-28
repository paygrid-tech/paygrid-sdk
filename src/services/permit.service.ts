// src/services/permit.service.ts
import { ethers } from 'ethers';
import { NetworkKey, TokenSymbol } from '../core/types';
import { PermitSignature, PermitSignatureParams, PermitSignaturePayload } from '../core/types/permit';
import { NETWORK_CONFIGS } from '../core/constants/networks';
import { EIP2612_PERMIT_TYPES, DAI_PERMIT_TYPES } from '../core/constants/permit-config';
import { 
  getTokenNonce, 
  getTokenNameAndVersion, 
  getTokenPermitType, 
  isPermitSupported 
} from '../utils/permit-utils';
import { isSignTypedDataSupported } from '../utils/eip712-support';
import { PERMIT2_CONFIG } from '../core/constants/config';

const GLOBAL_SPENDER = PERMIT2_CONFIG.ADDRESS;

export class PermitService {
  /**
   * Generate a permit payload for EIP-2612 compatible tokens
   */
  private static async generateEIP2612Payload(
    params: PermitSignatureParams,
    provider: ethers.providers.Provider,
    chainId: number
  ): Promise<PermitSignaturePayload> {
    const { token, owner, spender = GLOBAL_SPENDER, value = BigInt(ethers.constants.MaxUint256.toString()), deadline } = params;
    
    // Get token name and version
    const { name, version } = await getTokenNameAndVersion(provider, token);
    
    // Get nonce if not provided
    const nonce = params.nonce !== undefined 
      ? params.nonce 
      : await getTokenNonce(provider, token, owner);
    
    return {
      domain: {
        name,
        version,
        chainId,
        verifyingContract: token
      },
      types: EIP2612_PERMIT_TYPES,
      values: {
        owner,
        spender,
        value,
        nonce,
        deadline
      }
    };
  }
  
  /**
   * Generate a permit payload for DAI token
   */
  private static async generateDAIPayload(
    params: PermitSignatureParams,
    provider: ethers.providers.Provider,
    chainId: number
  ): Promise<PermitSignaturePayload> {
    const { token, owner, spender = GLOBAL_SPENDER, deadline } = params;
    
    // Get token name
    const { name } = await getTokenNameAndVersion(provider, token);
    
    // Get nonce if not provided
    const nonce = params.nonce !== undefined 
      ? params.nonce 
      : await getTokenNonce(provider, token, owner);
    
    return {
      domain: {
        name,
        version: '1',
        chainId,
        verifyingContract: token
      },
      types: DAI_PERMIT_TYPES,
      values: {
        holder: owner,
        spender,
        nonce,
        expiry: deadline,
        allowed: true
      }
    };
  }
  
  /**
   * Generate a permit payload based on token and network
   */
  static async getPermitPayload(
    tokenSymbol: TokenSymbol,
    network: NetworkKey,
    params: PermitSignatureParams,
    provider: ethers.providers.Provider
  ): Promise<PermitSignaturePayload> {

    const token_symbol = tokenSymbol.toUpperCase() as TokenSymbol;
    const network_key = network.toUpperCase() as NetworkKey;

    // Check if permit is supported
    const permitType = getTokenPermitType(token_symbol, network_key);
    if (!permitType || permitType === 'REGULAR') {
      throw new Error(`Token ${token_symbol} does not support permit on ${network_key}`);
    }
    
    // Get network chain ID
    const networkConfig = NETWORK_CONFIGS[network_key];
    const chainId = networkConfig.chainId;
    
    // Generate payload based on permit type
    switch (permitType) {
      case 'EIP2612':
        return this.generateEIP2612Payload(params, provider, chainId);
      case 'DAI':
        return this.generateDAIPayload(params, provider, chainId);
      default:
        throw new Error(`Unsupported permit type for ${token_symbol} on ${network_key}`);
    }
  }
  
  /**
   * Generate and sign a permit for a token on a specific network
   */
  static async generateAndSignPermit(
    tokenSymbol: TokenSymbol,
    network: NetworkKey,
    params: PermitSignatureParams,
    signer: ethers.Signer
  ): Promise<PermitSignature> {
    // Check if signer has a provider
    const provider = signer.provider;
    if (!provider) {
      throw new Error('Signer must be connected to a provider');
    }
    
    try {
      // Get permit payload
      const payload = await this.getPermitPayload(tokenSymbol, network, params, provider);
      
      // Ensure signer supports EIP-712
      const _signer = isSignTypedDataSupported(signer);
      
      // Get nonce for return value
      const nonce = params.nonce !== undefined 
        ? params.nonce 
        : await getTokenNonce(provider, params.token, params.owner);
      
      // Sign the permit
      const signature = await _signer._signTypedData(
        payload.domain,
        payload.types,
        payload.values
      );
      
      return {
        signature,
        deadline: params.deadline,
        nonce: nonce.toString()
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('user rejected')) {
          throw new Error('User rejected the permit signature request');
        }
        throw new Error(`Permit generation failed: ${error.message}`);
      }
      throw error;
    }
  }
  
  /**
   * Check if a token supports permit on a specific network
   */
  static isPermitSupported(tokenSymbol: TokenSymbol, network: NetworkKey): boolean {
    return isPermitSupported(tokenSymbol, network);
  }
}