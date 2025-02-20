import { SDKConfig, PaygridAPIConfig } from '../core/types/config';
import { PAYGRID_API, SDK_CONFIG, GRID_GATEWAY_PROXY } from '../core/constants/config';
import { NETWORK_CONFIGS, SUPPORTED_NETWORKS, NETWORK_IDS } from '../core/constants/networks';
import { TOKEN_CONFIGS, SUPPORTED_TOKENS } from '../core/constants/tokens';
import { NetworkKey, TokenSymbol } from '../core/types/index';
import { ethers } from 'ethers';

export class ConfigUtils {
  /**
   * Validates the SDK configuration
   * @param config - SDK configuration object
   * @throws Error if configuration is invalid
   */
  static validateConfig(config: SDKConfig): void {
    // Validate environment
    if (config.environment && !(config.environment in SDK_CONFIG.ENVIRONMENTS)) {
      throw new Error(`Invalid environment: ${config.environment}. Must be one of: ${Object.keys(SDK_CONFIG.ENVIRONMENTS).join(', ')}`);
    }

    // Validate default network
    if (config.defaultNetwork && !(config.defaultNetwork in SUPPORTED_NETWORKS)) {
      throw new Error(`Invalid default network: ${config.defaultNetwork}. Must be one of: ${Object.keys(SUPPORTED_NETWORKS).join(', ')}`);
    }

    // Validate timeout
    if (config.timeout !== undefined) {
      if (!Number.isInteger(config.timeout) || config.timeout < 1000) {
        throw new Error('Timeout must be an integer greater than or equal to 1000ms');
      }
    }

    // Validate max retries
    if (config.maxRetries !== undefined) {
      if (!Number.isInteger(config.maxRetries) || config.maxRetries < 0 || config.maxRetries > 5) {
        throw new Error('maxRetries must be an integer between 0 and 5');
      }
    }

    // Validate custom RPC URLs
    if (config.customRpcUrls) {
      for (const [network, url] of Object.entries(config.customRpcUrls)) {
        if (!(network in SUPPORTED_NETWORKS)) {
          throw new Error(`Invalid network in customRpcUrls: ${network}`);
        }
        if (typeof url !== 'string' || !url.startsWith('http')) {
          throw new Error(`Invalid RPC URL for network ${network}: ${url}`);
        }
      }
    }
  }

  /**
   * Gets the API configuration based on SDK config
   * @param sdkConfig - SDK configuration object
   * @returns PaygridAPIConfig object
   */
  static getApiConfig(sdkConfig: SDKConfig): PaygridAPIConfig {
    const environment = SDK_CONFIG.ENVIRONMENTS.MAINNET;
    const baseUrl = environment === SDK_CONFIG.ENVIRONMENTS.MAINNET
      ? PAYGRID_API.BASE_URL
      : `https://api-${environment}.paygrid.co`;

    return {
      baseUrl,
      version: PAYGRID_API.VERSION,
      timeout: SDK_CONFIG.DEFAULT_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'X-SDK-Version': SDK_CONFIG.VERSION,
        ...(sdkConfig.apiKey && { 'X-API-KEY': sdkConfig.apiKey }),
      },
    };
  }

  /**
   * Gets the RPC URL for a given network
   * @param network - Network name
   * @param customRpcUrls - Optional custom RPC URLs
   * @returns RPC URL string
   */
  static getRpcUrl(network: NetworkKey, customRpcUrls?: Partial<Record<NetworkKey, string>>): string {
    if (customRpcUrls?.[network]) {
      return customRpcUrls[network]!;
    }
    return NETWORK_CONFIGS[network]?.defaultRpcUrl;
  }

  /**
   * Gets the Grid Gateway Proxy address for a given network
   * @param network - Network name
   * @returns Grid Gateway Proxy address as hex string
   * @throws Error if network is not supported or proxy address is not configured
   */
  static getGridProxyAddress(network: NetworkKey): `0x${string}` {
    const address = GRID_GATEWAY_PROXY[network];
    if (!address) {
      throw new Error(`Grid Gateway Proxy address not configured for network: ${network}`);
    }
    return address as `0x${string}`;
  }

  /**
   * Validates if a token is supported on a given network
   * @param token - Token symbol
   * @param network - Network name
   * @returns boolean indicating if token is supported
   */
  static isTokenSupportedOnNetwork(token: keyof typeof SUPPORTED_TOKENS, network: NetworkKey): boolean {
    return (
      token in TOKEN_CONFIGS &&
      network in TOKEN_CONFIGS[token].address &&
      !!TOKEN_CONFIGS[token].address[network]
    );
  }

  /**
   * Gets chain ID for a network
   * @param network - Network name or chain ID
   * @returns chain ID number
   * @throws Error if network is invalid
   */
  static getChainId(network: NetworkKey | number): number {
    if (typeof network === 'number') {
      const validChainIds = Object.values(NETWORK_IDS) as number[];
      if (validChainIds.includes(network)) {
        return network;
      }
      throw new Error(`Invalid chain ID: ${network}`);
    }
    
    if (network in NETWORK_IDS) {
      return NETWORK_IDS[network as keyof typeof NETWORK_IDS];
    }
    throw new Error(`Invalid network name: ${network}`);
  }

  /**
   * Gets token configuration and performs necessary conversions
   */
  static getTokenConfig(token: TokenSymbol, network: NetworkKey) {
    const tokenConfig = TOKEN_CONFIGS[token];
    if (!tokenConfig) {
      throw new Error(`Token ${token} not configured`);
    }

    const address = tokenConfig.address[network];
    if (!address) {
      throw new Error(`Token ${token} not configured for network ${network}`);
    }

    return {
      address: address as `0x${string}`,
      decimals: tokenConfig.decimals,
      permitType: tokenConfig.permitType[network],
      version: tokenConfig.version
    };
  }

  /**
   * Converts amount from cents to token decimals
   */
  static convertAmountToDecimals(amountInCents: number, decimals: number): bigint {
    // Convert cents to base units first (divide by 100)
    const baseUnits = amountInCents / 100;
    // Convert to token decimals
    return ethers.utils.parseUnits(baseUnits.toString(), decimals).toBigInt();
  }

  /**
   * Gets network configuration with proper typing
   */
  static getNetworkConfig(network: NetworkKey) {
    const config = NETWORK_CONFIGS[network];
    if (!config) {
      throw new Error(`Network ${network} not configured`);
    }

    return {
      key: network,
      chainId: config.chainId,
      permitSupported: config.permitSupported,
      defaultPermitType: config.defaultPermitType,
      gridGatewayProxy: GRID_GATEWAY_PROXY[network] as `0x${string}`,
      rpcUrl: config.defaultRpcUrl
    };
  }
} 