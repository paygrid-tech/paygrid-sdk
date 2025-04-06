import { PaymentIntentClient } from './services/payment.service';
import { PaymentIntentSigner } from './services/payment-signer.service';
import { PermitService } from './services/permit.service';
import { CorridorQuotesService } from './services/corridor-quotes.service';
import { ConfigUtils } from './utils/config';
import { isSignTypedDataSupported } from './utils/eip712-support';
import { PaymentIntent, Authorization, PaymentIntentResponse, PaymentType, ChargeBearer, RoutingPriority, OperatorData } from './core/types';
import { ethers } from 'ethers';
import { SDKConfig } from './core/types/config';
import { EIP712Domain, EIP712Types, EIP712Values } from './core/types';
import { CorridorQuoteRequest, CorridorQuoteResponse, NetworkTokens } from './core/types/corridor';
import { Networks } from './core/constants/networks';
import { Tokens } from './core/constants/tokens';

// Export all types
export { 
    PaymentIntent, 
    Authorization, 
    PaymentIntentResponse,
    PaymentIntentSigner,
    PermitService,
    CorridorQuotesService,
    PaymentType,
    OperatorData,
    ChargeBearer,
    RoutingPriority,
    SDKConfig,
    EIP712Domain,
    EIP712Types,
    EIP712Values,
    CorridorQuoteRequest,
    CorridorQuoteResponse,
    Tokens,
    Networks,
};
  
// Export types and constants
export * from './core/types';
export * from './core/constants';
export * from './core/types/corridor';

/**
 * Paygrid SDK class
 * @class
 * @param {SDKConfig} config - The configuration object for the SDK
 */
export class Paygrid {
  private readonly paymentIntentClient: PaymentIntentClient;
  private readonly corridorQuotesService: CorridorQuotesService;
  private readonly config: SDKConfig;
  
  constructor(config: SDKConfig = {}) {
    this.config = config;
    this.paymentIntentClient = new PaymentIntentClient(config);
    this.corridorQuotesService = new CorridorQuotesService(config);
  }

  /** Initiate a payment intent */
  async initiatePaymentIntent(paymentIntent: PaymentIntent): Promise<PaymentIntentResponse> {
    return this.paymentIntentClient.initiatePaymentIntent(paymentIntent);
  }

  /**
   * Signs and submits a payment intent
   */
  async signAndInitiatePaymentIntent(paymentIntent: PaymentIntent, signer: ethers.Signer): Promise<PaymentIntentResponse> {
    return this.paymentIntentClient.signAndInitiatePaymentIntent(paymentIntent, signer, this.config);
  }

  /**
   * Retrieves a payment intent by ID
   */
  async getPaymentIntentById(paymentIntentId: string): Promise<PaymentIntentResponse> {
    return this.paymentIntentClient.getPaymentIntentById(paymentIntentId);
  }

  /**
   * Polls a payment intent until completion or timeout
   */
  async pollPaymentIntentStatus(
    paymentIntentId: string,
    options?: {
      pollInterval?: number;
      timeout?: number;
      abortSignal?: AbortSignal;
    }
  ): Promise<PaymentIntentResponse> {
    return this.paymentIntentClient.pollPaymentIntentStatus(paymentIntentId, options);
  }

  /**
   * Static utility to sign a payment intent without submitting
   */
  async signPaymentIntent(
    paymentIntent: PaymentIntent,
    signer: ethers.Signer
  ): Promise<Authorization> {
    return PaymentIntentSigner.signPaymentIntent(paymentIntent, signer, this.config);
  }

  /**
   * Static utility to construct EIP-712 payload for manual signing
   */
  async constructPaymentAuthorizationPayload(
    paymentIntent: PaymentIntent
  ): Promise<{ domain: EIP712Domain; types: EIP712Types; values: EIP712Values }> {
    return PaymentIntentSigner.constructPaymentAuthorizationPayload(paymentIntent, this.config);
  }

  /**
   * Gets payment corridor routes with estimated fees and execution times
   * @param request - Object containing corridor quote parameters
   * @param request.amount - The amount to transfer
   * @param request.sourceAccount - The source account address
   * @param request.destinationAccount - Optional destination account address
   * @param request.sources - Optional source networks and tokens
   * @param request.destinations - Optional destination networks and tokens
   * @param request.routingPriority - Optional routing priority (AUTO, BALANCED, COST, SPEED)
   * @param request.paymentReference - Optional payment reference
   * @returns Promise with corridor quote response
   */
  async getPaymentCorridorRoutes(request: CorridorQuoteRequest): Promise<CorridorQuoteResponse> {

    return this.corridorQuotesService.getPaymentCorridorRoutes(
      request.amount,
      request.source_account,
      request.destination_account,
      request.sources,
      request.destinations,
      request.routing_priority,
      request.payment_reference
    );
  }
}

// Export utilities
export { ConfigUtils, isSignTypedDataSupported };
