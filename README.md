# Paygrid Network SDK
Official TypeScript/JavaScript SDK for integrating with the [Paygrid Network](https://paygrid.network) - The First Chain-Agnostic Payment Clearing Network.

## Overview
Paygrid Network is a chain-abstracted, application-specific clearing layer designed for payment operators. It provides a secure and scalable infrastructure for developers to build and orchestrate payment workflows across blockchain networks while capturing MEV value from their payment order flow.

## Features

- Chain-abstracted payment processing
- Cross-chain payment routing, matching, and settlement
- Payment corridor routes pricing with estimated fees and execution times
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

2. Initialize SDK (Optional):
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
npm run pg:get-corridor-quotes # Get corridor quotes for a payment intent
npm run pg:payment-client # Sign and submit a payment intent, then poll its status
npm run demo # Run both quickstart examples
```

See [quickstart examples](./quickstart/) for complete implementation:
- [Payment Intent Authorization Signer](./quickstart/sign-payment-intent.ts)
- [Corridor Quotes](./quickstart/corridor-quotes.ts)
- [Payment Client](./quickstart/payment-client.ts)

## Gasless Token Permit Approval

Paygrid SDK provides utilities for generating and signing EIP-2612 permit signatures, allowing gasless token approvals before submitting a payment intent:

```typescript
import { ethers } from 'ethers';
import { PaymentIntentSigner } from '@paygrid-network/sdk';

// Option 1: Get the EIP-712 permit payload (for inspection or manual signing)
const permitPayload = await PaymentIntentSigner.getTokenPermitPayload(
  Tokens.USDC,                                             // Token symbol
  Networks.BASE,                                           // Network
  '0xPayerWalletAddress',                                  // Owner address
  Math.floor(Date.now() / 1000) + 3600,                   // Deadline (1 hour)
  provider,                                               // ethers provider (payer's wallet)
  ethers.constants.MaxUint256.toString()                  // Value (infinite approval)
);
// permitPayload contains: { domain, types, values } for EIP-712 signing

// Option 2: Generate and sign a permit in one step
const signedPermit = await PaymentIntentSigner.generateTokenPermit(
  Tokens.USDC,                                                  // Token symbol
  Networks.ARBITRUM,                                              // Network
  '0xPayerWalletAddress',                                   // Owner address
  Math.floor(Date.now() / 1000) + 3600,                    // Deadline (1 hour)
  signer,                                                   // ethers signer attached to an RPC provider (payer's wallet)
  ethers.constants.MaxUint256.toString()                  // Value (infinite approval)
);
// signedPermit contains: { signature, nonce, deadline }

// 3. Use the signed permit in a payment intent
paymentIntent.authorizations.initial_permit = signedPermit;

```

**Note: The permit is signed with the payer's wallet, so the payer must have approved the spender (Permit2 contract) to spend the token. This can be done once per token per network per payer wallet to save on gas otherwise the payment amount will be used as the value for the permit.**

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
// Get payment corridor routes with estimated fees and execution times
getPaymentCorridorRoutes(request: CorridorQuoteRequest): Promise<CorridorQuoteResponse>

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
constructPaymentAuthorizationPayload(intent: PaymentIntent): Promise<{ domain: EIP712Domain; types: EIP712Types; values: EIP712Values }>

// Generate token permit payload for inspection or custom signing
getTokenPermitPayload(tokenSymbol, network, owner, deadline, provider, value?: bigint): { domain: EIP712Domain, types: EIP712Types, values: EIP712Values }

// Generate and sign a token permit in one step
generateTokenPermit(tokenSymbol, network, owner, deadline, signer, value?: bigint): { signature: string, nonce: number, deadline: number }
```

### Configuration
```typescript
interface SDKConfig {
  apiKey?: string;
}
```

### Corridor Routes Quotes

Get corridor routes quotes to estimate fees and execution times before initiating a payment intent:

```typescript
// Request parameters for corridor route quotes
interface CorridorQuoteRequest {
  amount: number;                      // Amount to transfer in token units (required)
  source_account: string;              // source account address (required)
  destination_account: string;        // destination account address (required)
  sources: NetworkTokens;             // source networks and tokens (optional if not specified will default to all supported networks and tokens)
  destinations: NetworkTokens;        // destination networks and tokens (required)
  routing_priority: RoutingPriority;  // routing priority (optional but recommended)
  payment_reference: string;          // payment reference (optional)
}

// Example usage
const request: CorridorQuoteRequest = {
  amount: 10,                          // 10 USDC
  source_account: "0xYourSourceAddress",
  destination_account: "0xDestinationAddress",
  sources: {
    networks: [Networks.BASE],
    tokens: [Tokens.USDC]
  },
  destinations: {
    networks: [Networks.POLYGON, Networks.OPTIMISM],
    tokens: [Tokens.USDC, Tokens.USDT]
  },
  routing_priority: RoutingPriority.COST
};

const corridorQuotes = await paygrid.getPaymentCorridorRoutes(request);
// Get the quoteId from the list of corridor quotes to use in the payment intent object
const quoteId = corridorQuotes.corridor_quotes[0].quoteId;
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
