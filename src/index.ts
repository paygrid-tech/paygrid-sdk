import { PaymentIntentClient } from './services/payment.service';
import { PaymentIntentSigner } from './services/payment-signer.service';
import { PermitService } from './services/permit.service';
import { ConfigUtils } from './utils/config';
import { isSignTypedDataSupported } from './utils/eip712-support';
import { PaymentIntent, Authorization, PaymentIntentResponse, PaymentType, ChargeBearer, RoutingPriority, OperatorData } from './core/types';
import { ethers } from 'ethers';
import { SDKConfig } from './core/types/config';
import { EIP712Domain, EIP712Types, EIP712Values } from './core/types';

// Export all types
export { 
    PaymentIntent, 
    Authorization, 
    PaymentIntentResponse,
    PaymentIntentSigner,
    PermitService,
    PaymentType,
    OperatorData,
    ChargeBearer,
    RoutingPriority,
    SDKConfig,
    EIP712Domain,
    EIP712Types,
    EIP712Values,
};
  
// Export types and constants
export * from './core/types';
export * from './core/constants';

/**
 * Paygrid SDK class
 * @class
 * @param {SDKConfig} config - The configuration object for the SDK
 */
export class Paygrid {
  private readonly paymentIntentClient: PaymentIntentClient;
  
  constructor(config: SDKConfig = {}) {
    this.paymentIntentClient = new PaymentIntentClient(config);
  }

  /** Initiate a payment intent */
  async initiatePaymentIntent(paymentIntent: PaymentIntent): Promise<PaymentIntentResponse> {
    return this.paymentIntentClient.initiatePaymentIntent(paymentIntent);
  }

  /**
   * Signs and submits a payment intent
   */
  async signAndInitiatePaymentIntent(paymentIntent: PaymentIntent, signer: ethers.Signer): Promise<PaymentIntentResponse> {
    return this.paymentIntentClient.signAndInitiatePaymentIntent(paymentIntent, signer);
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
    return PaymentIntentSigner.signPaymentIntent(paymentIntent, signer);
  }

  /**
   * Static utility to construct EIP-712 payload for manual signing
   */
  constructPaymentAuthorizationPayload(
    paymentIntent: PaymentIntent
  ): { domain: EIP712Domain; types: EIP712Types; values: EIP712Values } {
    return PaymentIntentSigner.constructPaymentAuthorizationPayload(paymentIntent);
  }
}

// Export utilities
export { ConfigUtils, isSignTypedDataSupported };
