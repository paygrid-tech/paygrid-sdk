import { ethers } from 'ethers';
import { ChargeBearer, PaymentIntent, PaymentType, RoutingPriority } from '../src/core/types';
import dotenv from 'dotenv';
import { PaymentIntentSigner } from '../src/services/payment-signer.service';

dotenv.config();

async function main() {
  try {
    // Initialize a wallet (in production, you'd trigger the sender's wallet signer - e.g. Metamask, Coinbase Wallet, etc.)
    const privateKey = process.env.TEST_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('TEST_PRIVATE_KEY is not set in the environment variables');
    }
    const signer = new ethers.Wallet(privateKey);

    // payment intent expiration date
    const deadline = BigInt(Math.floor(Date.now() / 1000)) + 3600n; // 1 hour from now
    
    // Create a sample payment intent
    const paymentIntent: PaymentIntent = {
      payment_type: PaymentType.ONE_TIME,
      routing_priority: RoutingPriority.AUTO,
      operator_data: {
        id: ethers.utils.id('0x0AB796b0Db4333EF2fFaC835a1e05C75E0c119D4'),
        operator: '0x0AB796b0Db4333EF2fFaC835a1e05C75E0c119D4',
        treasury: '0x0AB796b0Db4333EF2fFaC835a1e05C75E0c119D4',
        authorized_delegates: [
          '0xF34c65196F4fC4E3dE7133eec7C13859e741875C'
        ],
        fee_bps: 30, // 0.3% fee
        // replace with actual webhook url
        webhook_url: 'https://grid.network/well-known/operators/1' 
      },
      amount: 100, // $1.00 in cents
      source: {
        from_account: signer.address,
        network_id: 'BASE',
        payment_token: 'USDC'
      },
      destination: {
        to_account: '0xF34c65196F4fC4E3dE7133eec7C13859e741875C',
        network_id: 'BASE',
        payment_token: 'USDC'
      },
      processing_fees: {
        charge_bearer: ChargeBearer.PAYER
      },
      payment_reference: '017e0e752d7dc551cc3bb605a2e25f8162d0cc6c2f905706deea543336f1409be5',
      metadata: {
        key: 'value',
        key2: 'value2'
      },
      authorizations: {
        permit2_permit: {
            nonce: BigInt(Date.now()),
            deadline: deadline
        },
        // omit if not using initial permit
        initial_permit: {
          nonce: BigInt(Date.now()),
          deadline: deadline,
          signature: 'eip2612 gasless permit approval signature here'
        }
      },
      processing_date: BigInt(Math.floor(Date.now() / 1000)) + 18000n, // 5 hour from now
      expiration_date: deadline, // 1 hour from now
    };

    console.log('\n1. Payment Intent Details:');
    console.log(JSON.stringify(paymentIntent, bigIntReplacer, 2));

    // Get the payment intent authorization payload
    const payload = PaymentIntentSigner.constructPaymentAuthorizationPayload(paymentIntent);
    
    console.log('\n2. Generated Payload:');
    console.log(JSON.stringify({
      domain: payload.domain,
      types: payload.types,
      values: payload.values
    }, bigIntReplacer, 2));

    // Sign the payment intent
    const authorization = await PaymentIntentSigner.signPaymentIntent(paymentIntent, signer);
    
    console.log('\n3. Generated Authorization:');
    console.log(JSON.stringify({
      signature: authorization.permit2_permit.signature,
      nonce: paymentIntent.authorizations.permit2_permit.nonce,
      deadline: paymentIntent.authorizations.permit2_permit.deadline,
      processing_date: paymentIntent.processing_date,
      expiration_date: paymentIntent.expiration_date
    }, bigIntReplacer, 2));

  } catch (error) {
    console.error('Error:', error);
  }
}

function bigIntReplacer(key: string, value: any): any {
    if (typeof value === 'bigint') {
        return value.toString();
    }
    return value;
}

main(); 