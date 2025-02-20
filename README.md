# Paygrid Network SDK
Official TypeScript/JavaScript SDK for integrating with the [Paygrid Network](https://paygrid.network) - The First Chain-Agnostic Payment Clearing Network.

## Overview
Paygrid Network is a chain-abstracted, application-specific clearing layer designed for payment operators. It provides a secure and scalable infrastructure for developers to build and orchestrate payment workflows across blockchain networks while capturing MEV value from their payment order flow.

## Features

- Chain-abstracted payment processing
- Cross-chain payment routing, matching, and settlement
- Supports EIP-2612 gasless permit approvals
- Supports gasless transactions
- Real-time payment status tracking
- More cooking ...

## Installation

```bash
npm install @paygrid-network/sdk
```

## Quick Start

1. Configure environment variables:
See [.env.example](./.env.example) for more details.

2. Initialize SDK:
```typescript
import { Paygrid } from '@paygrid-network/sdk';

const paygrid = new Paygrid({
  environment: 'mainnet', // or 'testnet'
  apiKey: process.env.PAYGRID_API_KEY
});
```

3. Create and process a payment intent:
```typescript
const payment = await paygrid.signAndInitiatePaymentIntent(paymentIntent, signer);
const status = await paygrid.pollPaymentIntentStatus(payment.id);
```

4. Run the quickstart examples:
```bash
npm run pg:sign-payment-intent # Sign a payment intent without submitting
npm run pg:payment-client # Sign and submit a payment intent, then poll its status
npm run demo # Run both quickstart examples
```

See [quickstart examples](./quickstart/) for complete implementation:
- [Payment Intent Authorization Signer](./quickstart/sign-payment-intent.ts)
- [Payment Client](./quickstart/payment-client.ts)

## Core Concepts

### Payment Intent

A Payment Intent is a primitive based on a declarative model to describe self-contained instructions for executing a payment workflow. Each payment intent defines parameters such as the payment type, source and destination domains, amount, recipient(s), and any conditions or constraints required for automation and coordination.

For more details, see [What is a Payment Intent?](https://docs.paygrid.network/technical-docs/what-is-a-payment-intent)

### Authorization
Paygrid provides a secure multi-level authorization mechanism for token approvals and payment intents processing:
- Uniswap's Permit2 as a canonical resource-locking authorization mechanism. See https://github.com/Uniswap/permit2/
- EIP-712 typed signatures
- Batched transfer permissions
- Deadline-based expiration
- Supports EIP-2612 gasless permit approvals
- Supports gasless transactions

## API Reference

### Main Methods
```typescript
// Initiate payment intent
initiatePaymentIntent(intent: PaymentIntent): Promise<PaymentResponse>

// Sign and initiate payment intent
signAndInitiatePaymentIntent(intent: PaymentIntent, signer: Signer): Promise<PaymentResponse>

// Get payment intent status
getPaymentIntentById(paymentIntentId: string): Promise<PaymentResponse>

// Wait for payment intent execution to complete
pollPaymentIntentStatus(paymentIntentId: string, options?: PollOptions): Promise<PaymentResponse>

// Sign payment intent without submitting
signPaymentIntent(intent: PaymentIntent, signer: Signer): Promise<Authorization>

// Construct payment intent EIP-712 payload for manual signing
constructPaymentAuthorizationPayload(intent: PaymentIntent): { domain: EIP712Domain; types: EIP712Types; values: EIP712Values }
```

### Configuration
```typescript
interface SDKConfig {
  environment?: 'testnet' | 'mainnet';
  apiKey?: string;
}
```

### Resources

- [API Documentation](https://docs.paygrid.network/technical-docs/paygrid-api)
- [Technical Docs](https://docs.paygrid.network/technical-docs)
- [Support](https://docs.paygrid.network/getting-started/reach-out)
- [Website](https://paygrid.network)

### Socials:
- [👾 Discord Community](https://discord.gg/KcTk7cTBQp)
- [🐦 Twitter (X)](https://x.com/paygridx)

## License

Apache-2.0 - See [LICENSE](./LICENSE)
