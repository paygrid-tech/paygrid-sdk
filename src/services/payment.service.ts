import axios, { AxiosInstance, AxiosError } from 'axios';
import { ethers } from 'ethers';
import { PaymentIntentSigner } from './payment-signer.service';
import { ConfigUtils } from '../utils/config';
import { PAYGRID_API, SDK_CONFIG } from '../core/constants/config';
import { SDKConfig, PaygridAPIError } from '../core/types/config';
import { 
  PaymentIntent,
  PaymentIntentResponse,
  Authorization,
  PaymentStatus,
  PaymentType,
  RoutingPriority,
  NetworkKey,
  TokenSymbol,
  GridPaymentType,
  ChargeBearer
} from '../core/types';
import { FINAL_PAYMENT_STATES } from '../core/types/index';

/**
 * PaymentIntentClient class for interacting with the Paygrid Gateway API
 * @class
 * @param {SDKConfig} config - SDK configuration object
 */
export class PaymentIntentClient {
  private readonly axios: AxiosInstance;

  constructor(config: SDKConfig = {}) {
    const apiConfig = ConfigUtils.getApiConfig(config);
    // console.log('apiConfig', apiConfig);
    // Initialize axios instance with base configuration
    this.axios = axios.create({
      baseURL: `${apiConfig.baseUrl}/${apiConfig.version}`,
      timeout: apiConfig.timeout || SDK_CONFIG.DEFAULT_TIMEOUT, // 3 minutes
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'X-API-KEY': config.apiKey })
      }
    });

    // Response interceptor for error handling
    this.axios.interceptors.response.use(
      response => response,
      (error: AxiosError) => {
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
          const errorData = data as { message?: string; errors?: Record<string, string> };
          if (errorData.errors) {
            // Handle validation errors
            const validationErrors = Object.entries(errorData.errors)
              .map(([field, message]) => `${field}: ${message}`)
              .join(', ');
            paygridError.message = `Validation errors: ${validationErrors}`;
          } else {
            paygridError.message = errorData?.message || 'Unknown API error';
          }
        } else if (error.code === 'ECONNABORTED') {
          paygridError.message = 'API request timeout';
          paygridError.status = 408;
        } else {
          paygridError.message = error.message;
          paygridError.status = 500;
        }

        throw paygridError;
      }
    );
  }

  /**
   * Initiates a payment intent by submitting it to the Paygrid Gateway
   * @param paymentIntent - Complete payment intent object
   * @returns PaymentIntentResponse containing the payment intent ID and status
   * @throws {Error} If the API request fails or returns an error
   */
  async initiatePaymentIntent(
    paymentIntent: PaymentIntent
  ): Promise<PaymentIntentResponse> {

    // Format the payment intent for submission
    const paymentIntentRequest = this.formatPaymentIntentForSubmission(paymentIntent);

    try {
      const { data } = await this.axios.post(
        PAYGRID_API.ENDPOINTS.PAYMENTS,
        paymentIntentRequest
      );

      return data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(`Payment intent initiation failed: ${this.formatErrorResponse(error as PaygridAPIError)}`);
      }
      throw new Error(`An unexpected error occurred during payment intent initiation: ${this.formatErrorResponse(error as PaygridAPIError)}`);
    }
  }

  /**
   * Formats payment intent for API submission
   * @param paymentIntent - Raw payment intent with possible BigInt values
   * @returns Formatted payment intent matching DTO requirements
   */
  private formatPaymentIntentForSubmission(paymentIntent: PaymentIntent): any {
    return {
      payment_type: ['one-time', 'recurring'].includes(paymentIntent.payment_type?.toLowerCase()) ? 
        (paymentIntent.payment_type?.toLowerCase() === 'one-time' ? PaymentType.ONE_TIME : PaymentType.RECURRING) : 
        PaymentType.ONE_TIME, // Default to OneTime for invalid values
      routing_priority: paymentIntent.routing_priority || RoutingPriority.AUTO,
      operator_data: {
        id: paymentIntent.operator_data.id,
        operator: ethers.utils.getAddress(paymentIntent.operator_data.operator),
        treasury: ethers.utils.getAddress(paymentIntent.operator_data.treasury),
        fee_bps: Number(paymentIntent.operator_data.fee_bps),
        authorized_delegates: paymentIntent.operator_data.authorized_delegates?.map(delegate => ethers.utils.getAddress(delegate)) || [],
        ...(paymentIntent.operator_data.webhook_url && { webhook_url: paymentIntent.operator_data.webhook_url })
      },
      amount: Number(paymentIntent.amount),
      source: {
        from_account: ethers.utils.getAddress(paymentIntent.source.from_account),
        network_id: paymentIntent.source.network_id.toUpperCase() as NetworkKey,
        payment_token: paymentIntent.source.payment_token.toUpperCase() as TokenSymbol
      },
      destination: {
        to_account: ethers.utils.getAddress(paymentIntent.destination.to_account),
        network_id: paymentIntent.destination.network_id.toUpperCase() as NetworkKey,
        payment_token: paymentIntent.destination.payment_token.toUpperCase() as TokenSymbol
      },
      processing_date: Number(paymentIntent.processing_date) || Number(Math.floor(Date.now() / 1000) + 18000), // 5 hour buffer only if no date provided
      expiration_date: Number(paymentIntent.expiration_date) || Number(Math.floor(Date.now() / 1000) + 3600), // 1 hour from now
      authorizations: {
        permit2_permit: {
          signature: paymentIntent.authorizations.permit2_permit.signature,
          nonce: paymentIntent.authorizations.permit2_permit.nonce.toString(),
          deadline: Number(paymentIntent.authorizations.permit2_permit.deadline)
        },
        ...(paymentIntent.authorizations.initial_permit && {
          initial_permit: {
            signature: paymentIntent.authorizations.initial_permit.signature,
            nonce: paymentIntent.authorizations.initial_permit.nonce.toString(),
            deadline: Number(paymentIntent.authorizations.initial_permit.deadline)
          }
        })
      },
      processing_fees: paymentIntent.processing_fees && {
        ...(paymentIntent.processing_fees.quoteId && { quoteId: paymentIntent.processing_fees.quoteId }),
        ...(paymentIntent.processing_fees.corridor_fees && { corridor_fees: paymentIntent.processing_fees.corridor_fees }),
        ...(paymentIntent.processing_fees.charge_bearer && { charge_bearer: paymentIntent.processing_fees.charge_bearer })
      },
      payment_reference: paymentIntent.payment_reference || null,
      metadata: paymentIntent.metadata || {}
    };
  }

  /**
   * Signs and initiates a payment intent
   */
  /**
   * Signs a payment intent and submits it to the Paygrid Gateway
   * @param paymentIntent - Payment intent object without signatures
   * @param signer - Ethers signer for generating signatures
   * @returns PaymentIntentResponse containing the payment intent ID and status
   * @throws {Error} If signing fails or API request fails
   */
  async signAndInitiatePaymentIntent(
    paymentIntent: Omit<PaymentIntent, 'authorizations'> & {
      authorizations?: Partial<Authorization>
    },
    signer: ethers.Signer
  ): Promise<PaymentIntentResponse> {
    try {
      // Generate permit2 authorization signatures
      const permit2Authorization = await PaymentIntentSigner.signPaymentIntent(
        paymentIntent as PaymentIntent,
        signer
      );
      // Combine payment intent with signatures, preserving any existing initial_permit
      const signedPaymentIntent: PaymentIntent = {
        ...paymentIntent,
        authorizations: {
          permit2_permit: permit2Authorization.permit2_permit,
          ...(paymentIntent.authorizations?.initial_permit && {
            initial_permit: paymentIntent.authorizations.initial_permit
          })
        }
      };

      // Format and submit the signed payment intent
      return await this.initiatePaymentIntent(signedPaymentIntent);

    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('permit2')) {
          throw new Error(`Payment intent signing failed: ${error.message}`);
        }
        // Pass through formatted API errors
        throw error;
      }
      throw new Error('An unexpected error occurred during payment signing and submission');
    }
  }

  /**
   * Retrieves a payment intent by its ID
   * @param paymentIntentId - UUID of the payment intent
   * @returns Detailed payment intent response
   * @throws {Error} If payment intent is not found or request fails
   */
  async getPaymentIntentById(paymentIntentId: string): Promise<PaymentIntentResponse> {
    try {
      const { data } = await this.axios.get(
        `${PAYGRID_API.ENDPOINTS.PAYMENTS}/${paymentIntentId}`
      );
      return data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(`Failed to retrieve payment intent: ${this.formatErrorResponse(error as PaygridAPIError)}`);
      }
      throw new Error('An unexpected error occurred while retrieving payment intent');
    }
  }

  /**
   * Waits for a payment intent to reach a final state (COMPLETED, FAILED, or CANCELLED)
   * @param paymentIntentId - UUID of the payment intent
   * @param options - Optional configuration for polling behavior
   * @returns PaymentIntentResponse containing the final payment intent status
   * @throws {Error} If payment times out or encounters an error
   */
  async pollPaymentIntentStatus(
    paymentIntentId: string,
    options: {
      pollInterval?: number;
      timeout?: number;
      abortSignal?: AbortSignal;
    } = {}
  ): Promise<PaymentIntentResponse> {
    const interval = options.pollInterval || SDK_CONFIG.POLL_INTERVAL;
    const maxAttempts = options.timeout 
      ? Math.ceil(options.timeout / interval)
      : SDK_CONFIG.MAX_RETRIES;

    let attempts = 0;
    let lastPaymentIntent: PaymentIntentResponse | null = null;

    while (attempts < maxAttempts) {
      // Check if abort signal is triggered
      if (options.abortSignal?.aborted) {
        const details = this.formatPaymentDetails(lastPaymentIntent);
        throw new Error(`Payment status polling was aborted. ${details}`);
      }

      try {
        const paymentIntent = await this.getPaymentIntentById(paymentIntentId);
        lastPaymentIntent = paymentIntent;
        
        if (FINAL_PAYMENT_STATES.includes(paymentIntent.status as typeof FINAL_PAYMENT_STATES[number])) {
          // For failed payments, include error details
          if (paymentIntent.status === PaymentStatus.FAILED) {
            const details = this.formatPaymentDetails(paymentIntent);
            throw new Error(`Payment failed. ${details}`);
          }
          return paymentIntent;
        }

        // Add detailed status information in the error for timeout
        if (++attempts === maxAttempts) {
          const details = this.formatPaymentDetails(paymentIntent);
          throw new Error(`Payment timeout reached. ${details}`);
        }

        // Wait for next polling interval
        await new Promise(resolve => setTimeout(resolve, interval));
      } catch (error) {
        if (error instanceof Error) {
          // Rethrow errors that already include payment details
          if (error.message.includes('Payment failed') || 
              error.message.includes('Payment timeout') ||
              error.message.includes('polling was aborted')) {
            throw error;
          }
          // Add payment details to other errors
          const details = this.formatPaymentDetails(lastPaymentIntent);
          throw new Error(`Error while polling payment status: ${error.message}. ${details}`);
        }
        throw error;
      }
    }

    const details = this.formatPaymentDetails(lastPaymentIntent);
    throw new Error(`Payment status polling exceeded maximum attempts. ${details}`);
  }

  /**
   * Formats payment details for error messages
   * @param paymentIntent - Payment intent response
   * @returns Formatted string with relevant payment details
   */
  private formatPaymentDetails(paymentIntent: PaymentIntentResponse | null): string {
    if (!paymentIntent) return 'No payment details available.';

    const details = [
      `Last status: ${paymentIntent.status}`,
      `Payment Intent ID: ${paymentIntent.id}`,
      `Amount: ${paymentIntent.amount}`,
      `Source: ${paymentIntent.source.network_id}/${paymentIntent.source.payment_token}`,
      `Destination: ${paymentIntent.destination.network_id}/${paymentIntent.destination.payment_token}`
    ];

    // Add blockchain details if available
    if (paymentIntent.blockchain_metadata?.transaction) {
      const tx = paymentIntent.blockchain_metadata.transaction;
      if (tx.src_tx_hash) details.push(`Source TX: ${tx.src_tx_hash}`);
      if (tx.dst_tx_hash) details.push(`Destination TX: ${tx.dst_tx_hash}`);
      if (tx.error) details.push(`Error: ${tx.error}`);
      if (tx.gasAmountUSD) details.push(`Gas Cost: $${tx.gasAmountUSD}`);
    }

    // Add processing fees if available
    if (paymentIntent.processing_fees) {
      details.push(
        `Processing Fees: $${paymentIntent.processing_fees.corridor_fees} ` +
        `(${paymentIntent.processing_fees.charge_bearer})`
      );
    }

    return details.join(' | ');
  }

  /**
   * Formats API error response into a detailed error message
   */
  private formatErrorResponse(error: PaygridAPIError): string {
    const details = [];
    
    details.push(`Status: ${error.status}`);
    details.push(`Message: ${error.message}`);
    
    if (error.data) {
      details.push(`Response Data: ${JSON.stringify(error.data, null, 2)}`);
    }
    
    if (error.config) {
      details.push(`Request Details:
        URL PATH: ${error.config.url}
        METHOD: ${error.config.method}
        PAYLOAD: ${JSON.stringify(error.config.data, null, 2)}`);
    }
    
    return details.join('\n');
  }

  /**
   * Validates critical payment intent response properties
   * @param response - API response data
   * @throws {Error} If response lacks critical payment tracking information
   */
  private validateApiResponse(response: any): asserts response is PaymentIntentResponse {
    try {
      // Check essential tracking information
      if (!response.id) {
        throw new Error('Response missing payment intent ID');
      }

      if (!response.status) {
        throw new Error('Response missing payment status');
      }

      // Validate transaction data if payment is in a final state
      if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(response.status)) {
        if (!response.blockchain_metadata?.transaction) {
          throw new Error(
            `Payment ${response.status.toLowerCase()} but missing blockchain transaction data. ` +
            'This might indicate an unexpected state.'
          );
        }

        // For failed transactions, ensure error information is available
        if (response.status === 'FAILED' && !response.blockchain_metadata.transaction.error) {
          throw new Error(
            'Payment failed but error details are missing. ' +
            'Please contact support with payment ID: ' + response.id
          );
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Payment tracking error: ${error.message}`);
      }
      throw error;
    }
  }
} 