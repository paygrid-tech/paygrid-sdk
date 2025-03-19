import axios, { AxiosInstance, AxiosError } from 'axios';
import { PAYGRID_API } from '../core/constants/config';
import { SDKConfig, PaygridAPIError } from '../core/types/config';
import { ConfigUtils } from '../utils/config';
import { 
  CorridorQuoteRequest, 
  CorridorQuoteResponse,
  NetworkTokens,
  EffectiveQuoteResponse
} from '../core/types/corridor';
import { RoutingPriority, NetworkKey, TokenSymbol } from '../core/types';

/**
 * CorridorQuotesService class for interacting with the Paygrid Corridor Quotes API
 * @class
 * @param {SDKConfig} config - SDK configuration object
 */
export class CorridorQuotesService {
  private readonly axios: AxiosInstance;

  constructor(config: SDKConfig = {}) {
    const apiConfig = ConfigUtils.getApiConfig(config);
    
    // Create axios instance with base URL and default headers
    this.axios = axios.create({
      baseURL: `${apiConfig.baseUrl}/${apiConfig.version}`,
      headers: apiConfig.headers,
      timeout: apiConfig.timeout
    });

    // Response interceptor for error handling
    this.axios.interceptors.response.use(
      response => response,
      (error: AxiosError) => {
        throw this.formatErrorResponse(error);
      }
    );
  }
  /**
   * Get corridor quotes for token transfers
   * @param request - The corridor quote request parameters
   * @returns Promise with corridor quote response
   */
  async getCorridorQuotes(request: CorridorQuoteRequest): Promise<CorridorQuoteResponse> {
    try {
      const response = await this.axios.post(
        PAYGRID_API.ENDPOINTS.CORRIDOR_QUOTES,
        request
      );
      
      // Add 5 minute expiry to quote response
      const expiryTime = new Date();
      expiryTime.setMinutes(expiryTime.getMinutes() + 5);
      
      return {
        ...response.data,
        expires_at: expiryTime.toTimeString().split(' ')[0]
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Corridor quote request failed: ${error.message}`);
      }
      throw new Error(`An unexpected error occurred during corridor quote request: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get effective quote for a specific quote ID
   * @param quoteId - The quote ID to retrieve
   * @param destinationAccount - Optional destination account
   * @returns Promise with effective quote response
   */
  async getEffectiveQuote(quoteId: string, destinationAccount?: string): Promise<EffectiveQuoteResponse> {
    try {
      const endpoint = `${PAYGRID_API.ENDPOINTS.CORRIDOR_QUOTES}/${quoteId}`;
      const params: Record<string, string> = {};
      
      if (destinationAccount) {
        params.dstAccount = destinationAccount;
      }
      
      const response = await this.axios.get(endpoint, { params });
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Effective quote request failed: ${error.message}`);
      }
      throw new Error(`An unexpected error occurred during effective quote request: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get payment corridor routes with estimated fees and execution times
   * @param amount - The amount to transfer
   * @param sourceAccount - The source account address
   * @param destinationAccount - Optional destination account address
   * @param sources - Optional source networks and tokens
   * @param destinations - destination networks and tokens
   * @param routingPriority - Optional routing priority (AUTO, BALANCED, COST, SPEED)
   * @param paymentReference - Optional payment reference
   * @returns Promise with corridor quote response
   */
  async getPaymentCorridorRoutes(
    amount: number,
    sourceAccount: string,
    destinationAccount?: string,
    sources?: NetworkTokens,
    destinations?: NetworkTokens,
    routingPriority?: RoutingPriority,
    paymentReference?: string
  ): Promise<CorridorQuoteResponse> {
    const request: CorridorQuoteRequest = {
      amount,
      source_account: sourceAccount,
      ...(destinationAccount && { destination_account: destinationAccount }),
      ...(sources && { sources }),
      ...(destinations && { destinations }),
      routing_priority: routingPriority || RoutingPriority.AUTO,
      ...(paymentReference && { payment_reference: paymentReference })
    };

    return this.getCorridorQuotes(request);
  }


  /**
   * Formats API error response into a detailed PaygridAPIError
   * @param error - The original AxiosError
   * @returns Formatted PaygridAPIError with detailed information
   */
  private formatErrorResponse(error: AxiosError): PaygridAPIError {
    const paygridError: PaygridAPIError = new Error() as PaygridAPIError;
    
    if (error.response) {
      const { status, data, config } = error.response;
      paygridError.status = status;
      paygridError.data = data;
      paygridError.config = {
        url: config.url,
        method: config.method,
        headers: config.headers,
        data: config.data
      };
      
      // Format the error message
      const errorData = data as any;
      
      // Create a detailed error message
      const details: string[] = [];
      
      // Add status code
      details.push(`Status: ${status}`);
      
      // Handle different error formats
      if (errorData.errors) {
        // Complex nested error structure with arrays
        if (Array.isArray(errorData.errors)) {
          errorData.errors.forEach((err: any) => {
            if (err.message) {
              details.push(`Message: ${err.message}`);
            }
            
            // Handle nested errors array
            if (Array.isArray(err.errors)) {
              err.errors.forEach((nestedErr: any) => {
                if (nestedErr.path && nestedErr.message) {
                  const path = Array.isArray(nestedErr.path) ? nestedErr.path.join('.') : nestedErr.path;
                  details.push(`Validation: ${path}: ${nestedErr.message}`);
                } else if (nestedErr.message) {
                  details.push(`Validation: ${nestedErr.message}`);
                }
              });
            }
          });
        } else {
          // Simple key-value error object
          details.push("Validation errors:");
          Object.entries(errorData.errors).forEach(([field, message]) => {
            details.push(`  ${field}: ${message}`);
          });
        }
      } else if (status === 404 && (errorData.message?.includes('No corridor routes found') || errorData.message?.includes('No realtime'))) {
        details.push('No corridor routes found for the requested parameters');
      } else if (errorData.message) {
        details.push(`Message: ${errorData.message}`);
      } else if (errorData.error) {
        details.push(`Error: ${errorData.error}`);
      } else {
        details.push(`Unknown API error`);
      }
      
      // Add raw response data for debugging
      details.push(`Response Data: ${JSON.stringify(errorData, null, 2)}`);
      
      // Add request details
      details.push(`Request Details:
        URL PATH: ${config.url}
        METHOD: ${config.method}
        PAYLOAD: ${JSON.stringify(config.data, null, 2)}`);
      
      // Set the formatted error message
      paygridError.message = details.join('\n');
      
    } else if (error.code === 'ECONNABORTED') {
      paygridError.message = 'API request timeout';
      paygridError.status = 408;
    } else {
      paygridError.message = error.message;
      paygridError.status = 500;
    }

    return paygridError;
  }

}