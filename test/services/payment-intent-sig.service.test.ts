import { ethers } from 'ethers';
import { PaymentIntentSigner } from '../../src/services/payment-signer.service';
import { PaymentIntent, PaymentType } from '../../src/core/types';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import * as chai from 'chai';
import dotenv from 'dotenv';

dotenv.config();

describe('PaymentIntentSigningService', () => {
  // Test wallet with known private key for consistent testing
  const TEST_PRIVATE_KEY = process.env.TEST_PRIVATE_KEY || '';
  const signer = new ethers.Wallet(TEST_PRIVATE_KEY);

  const mockPaymentIntent: PaymentIntent = {
    payment_type: PaymentType.ONE_TIME,
    operator_data: {
      id: '0x1234567890123456789012345678901234567890123456789012345678901234',
      operator: '0x1234567890123456789012345678901234567890',
      treasury: '0x2234567890123456789012345678901234567890',
      fee_bps: 50, // 0.5%
    },
    authorizations: {
      permit2_permit: {
        signature: '',
        nonce: BigInt(1767680000000).toString(),
        deadline: (Math.floor(Date.now() / 1000) + 3600).toString() // 1 hour from now
      }
    },
    amount: 1000, // $10.00 in cents
    source: {
      from_account: '0x3234567890123456789012345678901234567890',
      network_id: 'BASE',
      payment_token: 'USDC'
    },
    destination: {
      to_account: '0x4234567890123456789012345678901234567890',
      network_id: 'POLYGON',
      payment_token: 'USDC'
    },
    processing_date: Math.floor(Date.now() / 1000), // 1 hour from now
    expiration_date: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  };

  describe('constructPaymentAuthorizationPayload', () => {
    it('should construct a valid EIP-712 payload', () => {
      const payload = PaymentIntentSigner.constructPaymentAuthorizationPayload(mockPaymentIntent);

      // Verify payload structure
      expect(payload).to.have.all.keys(['domain', 'types', 'values']);
      
      // Verify domain
      expect(payload.domain).to.have.all.keys(['name', 'chainId', 'verifyingContract']); // version is not present
      
      // Verify types structure
      expect(payload.types).to.have.all.keys([
        'PermitBatchWitnessTransferFrom',
        'TokenPermissions',
        'PaymentIntent',
        'OperatorData',
        'Domain'
      ]);

      // Verify values
      expect(payload.values).to.have.all.keys([
        'permitted',
        'spender',
        'nonce',
        'deadline',
        'witness'
      ]);
    });
  });

  describe('signPaymentIntent', () => {
    it('should generate a valid signature and authorization', async () => {
      const authorization = await PaymentIntentSigner.signPaymentIntent(mockPaymentIntent, signer);

      // Verify authorization structure
      expect(authorization).to.have.nested.property('permit2_permit.signature');
      expect(authorization).to.have.nested.property('permit2_permit.nonce');
      expect(authorization).to.have.nested.property('permit2_permit.deadline');

      // Verify signature format (0x followed by 130 hex characters)
      expect(authorization.permit2_permit.signature).to.match(/^0x[0-9a-f]{130}$/i);

      // Verify nonce is a valid string that can be converted to a number
      expect(authorization.permit2_permit.nonce).to.be.a('string');
      expect(BigInt(authorization.permit2_permit.nonce).toString()).to.equal(authorization.permit2_permit.nonce);

      // Verify deadline is in the future
      const deadline = Number(authorization.permit2_permit.deadline);
      expect(deadline).to.be.a('number');
      expect(deadline).to.be.greaterThan(Math.floor(Date.now() / 1000));
    });

    it('should throw error for invalid payment intent', async () => {
      const invalidPaymentIntent = { ...mockPaymentIntent, source: undefined };
      
      try {
        await PaymentIntentSigner.signPaymentIntent(invalidPaymentIntent as any, signer);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).to.include('Failed to sign payment intent');
      }
    });
  });

  // Example of how to use the signing service
  describe('Usage Example', () => {
    it('demo on how to sign a payment intent', async () => {
      // Step 1: Create a payment intent object
      const paymentIntent: PaymentIntent = mockPaymentIntent;

      // Step 2: (Optional) Construct the payload separately if needed
      const payload = PaymentIntentSigner.constructPaymentAuthorizationPayload(paymentIntent);
      console.log('Constructed Payload:', {
        domain: payload.domain,
        types: payload.types,
        values: payload.values
      });

      // Step 3: Sign the payment intent
      const authorization = await PaymentIntentSigner.signPaymentIntent(paymentIntent, signer);
      console.log('Generated Authorization:', {
        signature: authorization.permit2_permit.signature,
        nonce: authorization.permit2_permit.nonce,
        deadline: authorization.permit2_permit.deadline
      });

      console.log("authorization", authorization);
    });
  });
}); 