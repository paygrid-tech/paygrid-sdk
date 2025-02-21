import { ethers } from 'ethers';
import { 
  Paygrid,
  SDKConfig,
  ChargeBearer, 
  PaymentIntent, 
  PaymentType, 
  RoutingPriority,
} from '@paygrid-network/sdk';
import dotenv from 'dotenv';
  
dotenv.config();

async function main() {
  try {
    // Initialize SDK configuration - Optional
    // const sdkConfig: SDKConfig = {
    //   apiKey: process.env.PAYGRID_API_KEY,
    //   environment: 'MAINNET'
    // };

    // Initialize payment service
    const paymentIntentClient = new Paygrid();

    // Initialize a wallet (in production, you'd trigger the sender's wallet signer)
    const privateKey = process.env.TEST_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('TEST_PRIVATE_KEY is not set in the environment variables');
    }
    const signer = new ethers.Wallet(privateKey);

    // Set deadlines
    const deadline = BigInt(Math.floor(Date.now() / 1000)) + 3600n; // valid for 1 hour
    
    // Create a sample payment intent
    const paymentIntent: PaymentIntent = {
      payment_type: PaymentType.ONE_TIME,
      routing_priority: RoutingPriority.COST,
      operator_data: {
        id: ethers.utils.id('0x0AB796b0Db4333EF2fFaC835a1e05C75E0c119D4'),
        operator: '0x0AB796b0Db4333EF2fFaC835a1e05C75E0c119D4',
        treasury: '0x0AB796b0Db4333EF2fFaC835a1e05C75E0c119D4',
        authorized_delegates: [
          '0xF34c65196F4fC4E3dE7133eec7C13859e741875C'
        ],
        fee_bps: 10, // 0.3% fee
        webhook_url: 'https://grid.network/well-known/operators/1'
      },
      amount: 120, // $1.20 in cents
      source: {
        from_account: signer.address,
        network_id: 'BASE',
        payment_token: 'USDC'
      },
      destination: {
        to_account: '0xF34c65196F4fC4E3dE7133eec7C13859e741875C',
        network_id: 'POLYGON',
        payment_token: 'USDC'
      },
      processing_fees: {
        // Payer pays for the corridor fees
        charge_bearer: ChargeBearer.PAYER,
        // corridor fees are automatically calculated by the Paygrid SDK
        corridor_fees: '0.00'
      },
      payment_reference: '017e0e752d7dc551cc3bb605a2e25f8162d0cc6c2f905706deea543336f1409be5',
      metadata: {
        key: 'value',
        key2: 'value2'
      },
      authorizations: {
        permit2_permit: {
          nonce: BigInt(Math.floor(Math.random() * 1000000)),
          deadline: deadline
        }
      },
      processing_date: BigInt(Math.floor(Date.now() / 1000)) + 18000n, // can be processed up to 5 hours from now
      expiration_date: deadline // valid for 1 hour
    };

    console.log('\n1. Signing and Initiating Payment Intent:');
    const paymentIntentResponse = await paymentIntentClient.signAndInitiatePaymentIntent(
      paymentIntent,
      signer
    );
    console.log(JSON.stringify({
      payment_intent_id: paymentIntentResponse.id,
      status: paymentIntentResponse.status,
      blockchain_metadata: paymentIntentResponse.blockchain_metadata
    }, bigIntReplacer, 2));

    console.log('\n2. Retrieving Payment Intent by ID:');
    const retrievedPayment = await paymentIntentClient.getPaymentIntentById(paymentIntentResponse.id);
    console.log(JSON.stringify({
      status: retrievedPayment.status,
      processing_fees: retrievedPayment.processing_fees,
      blockchain_metadata: retrievedPayment.blockchain_metadata
    }, bigIntReplacer, 2));

    console.log('\n3. Polling Payment Status:');
    console.log('Waiting for payment to complete...');
    
    // Create abort controller for timeout
    const controller = new AbortController();
    
    try {
      const finalPayment = await paymentIntentClient.pollPaymentIntentStatus(
        paymentIntentResponse.id,
        // Optional: Specify poll interval, timeout, and abort signal
        // {
        //   pollInterval: 5000, // Poll every 5 seconds
        //   timeout: 180000,    // Timeout after 3 minutes
        //   abortSignal: controller.signal
        // }
      );

      console.log('\nFinal Payment Status:', JSON.stringify({
        status: finalPayment.status,
        blockchain_metadata: finalPayment.blockchain_metadata,
        processing_fees: finalPayment.processing_fees
      }, bigIntReplacer, 2));

    } catch (error) {
      if (error instanceof Error) {
        console.error('\nPolling Error:', error.message);
        
        // Get final state even if polling failed
        const finalState = await paymentIntentClient.getPaymentIntentById(paymentIntentResponse.id);
        console.log('\nFinal Payment State:', JSON.stringify({
          status: finalState.status,
          blockchain_metadata: finalState.blockchain_metadata
        }, bigIntReplacer, 2));
      }
    }

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

// Run the payment client demo
main(); 