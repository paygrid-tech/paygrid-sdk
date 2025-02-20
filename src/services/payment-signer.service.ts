import { SignatureTransfer, PermitBatchTransferFrom, Witness, TokenPermissions } from '@uniswap/permit2-sdk';
import { ethers } from 'ethers';
import { 
  PaymentIntent, 
  Authorization,
  NetworkKey,
  TokenSymbol,
  EIP712Types,
  EIP712Domain,
  EIP712Values,
  PaymentType,
  GridPaymentType
} from '../core/types';
import { ConfigUtils } from '../utils/config';
import { PERMIT2_CONFIG, FEE_CONFIG } from '../core/constants/config';
import { isSignTypedDataSupported } from '../utils/eip712-support';

export class PaymentIntentSigner {
 /**
   * Signs a payment intent using Permit2
   * Uses constructPaymentAuthorizationPayload to prepare the data
   * and generates an EIP-712 signature
   * 
   * @param paymentIntent - The payment intent object
   * @param signer - The ethers signer object
   * @returns The properly formatted authorization object
   */
 static async signPaymentIntent(
    paymentIntent: PaymentIntent,
    signer: ethers.Signer,
  ): Promise<Authorization> {
    try {
      // Get the payload for signing
      const { domain, types, values } = this.constructPaymentAuthorizationPayload(paymentIntent);

      // Sign the permit data
      const signature = await isSignTypedDataSupported(signer)._signTypedData(domain, types, values);
      // Return properly formatted authorization
      return {
        permit2_permit: {
          signature,
          nonce: values.nonce.toString(),
          deadline: values.deadline.toString()
        }
      };

    } catch (error) {
      throw new Error(`Failed to sign payment intent: ${error}`);
    }
  }

  /**
   * Constructs the EIP-712 typed data payload for a payment intent signature
   * This includes:
   * - Domain: Permit2 contract details and chain info
   * - Types: The type structure for the permit and witness data
   * - Values: The actual data to be signed including permitted transfers and witness
   * 
   * @param paymentIntent - The complete payment intent object
   * @returns Object containing domain, types and values ready for EIP-712 signing
   */
  static constructPaymentAuthorizationPayload(
    paymentIntent: PaymentIntent
  ): { domain: EIP712Domain; types: EIP712Types; values: EIP712Values } {
    // Get network and token configurations
    const sourceNetworkKey = paymentIntent.source.network_id as NetworkKey;
    const sourceTokenSymbol = paymentIntent.source.payment_token as TokenSymbol;
    const sourceNetwork = ConfigUtils.getNetworkConfig(sourceNetworkKey);
    const sourceTokenConfig = ConfigUtils.getTokenConfig(sourceTokenSymbol, sourceNetworkKey);

    const destinationNetworkKey = paymentIntent.destination.network_id as NetworkKey;
    const destinationTokenSymbol = paymentIntent.destination.payment_token as TokenSymbol;
    const destinationNetwork = ConfigUtils.getNetworkConfig(destinationNetworkKey);
    const destinationTokenConfig = ConfigUtils.getTokenConfig(destinationTokenSymbol, destinationNetworkKey);

    // Convert amount from cents to token decimals
    const amount = ConfigUtils.convertAmountToDecimals(
        paymentIntent.amount,
        sourceTokenConfig.decimals
    );

    const gridGatewayProxy = sourceNetwork.gridGatewayProxy;

    // Calculate fee distributions using basis points (BPS)
    // Example: For 1 USDC (1000000 units):
    // - Operator fee (50 BPS = 0.5%): 1000000 * 50 / 10000 = 5000
    // - Gateway fee (10 BPS = 0.1%): 1000000 * 10 / 10000 = 1000
    const operatorFee = (amount * BigInt(paymentIntent.operator_data.fee_bps || 0)) / FEE_CONFIG.BPS_DENOMINATOR;
    const gatewayFee = (amount * FEE_CONFIG.GATEWAY_FEE_BPS) / FEE_CONFIG.BPS_DENOMINATOR;
    const payeeAmount = amount - operatorFee - gatewayFee;

    // Verify amount calculations are correct
    const totalAmount = payeeAmount + operatorFee + gatewayFee;
    if (totalAmount !== amount) {
        throw new Error(`Amount mismatch: total ${totalAmount} != original ${amount}`);
    }

    // Construct permitted transfers array
    const permitted: TokenPermissions[] = [
        { token: sourceTokenConfig.address, amount: payeeAmount },
        { token: sourceTokenConfig.address, amount: operatorFee },
        { token: sourceTokenConfig.address, amount: gatewayFee }
    ];

    // Prepare permit batch transfer data
    const permitBatchTransferFrom: PermitBatchTransferFrom = {
        permitted,
        spender: gridGatewayProxy,
        nonce: BigInt(paymentIntent.authorizations.permit2_permit.nonce) || BigInt(Date.now()), // random nonce
        deadline: BigInt(paymentIntent.expiration_date) || BigInt(Math.floor(Date.now() / 1000) + 3600) // 1 hour from now
    };

    // Construct witness data matching the smart contract structure
    const witnessData: Witness = {
    witness: {
        payment_type: paymentIntent.payment_type === PaymentType.ONE_TIME ? GridPaymentType.ONE_TIME : GridPaymentType.RECURRING,
        operator_data: {
            operatorId: paymentIntent.operator_data.id || ethers.utils.id(paymentIntent.operator_data.operator),
            operator: ethers.utils.getAddress(paymentIntent.operator_data.operator),
            treasury_account: ethers.utils.getAddress(paymentIntent.operator_data.treasury),
            fee: BigInt(paymentIntent.operator_data.fee_bps || 0)
        },
        amount: amount,
        source: {
            account: ethers.utils.getAddress(paymentIntent.source.from_account),
            network_id: BigInt(sourceNetwork.chainId),
            payment_token: ethers.utils.getAddress(sourceTokenConfig.address)
        },
        destination: {
            account: ethers.utils.getAddress(paymentIntent.destination.to_account),
            network_id: BigInt(destinationNetwork.chainId),
            payment_token: ethers.utils.getAddress(destinationTokenConfig.address)
        },
        processing_date: paymentIntent.processing_date || BigInt(Math.floor(Date.now() / 1000) + 18000), // 5 hour buffer only if no date provided
        expires_at: paymentIntent.expiration_date || BigInt(Math.floor(Date.now() / 1000) + 3600), // 1 hour from now
    },
    witnessTypeName: "PaymentIntent",
    witnessType: {
        PaymentIntent: [
            { name: "payment_type", type: "uint8" },
            { name: "operator_data", type: "OperatorData" },
            { name: "amount", type: "uint256" },
            { name: "source", type: "Domain" },
            { name: "destination", type: "Domain" },
            { name: "processing_date", type: "uint256" },
            { name: "expires_at", type: "uint256" }
        ],
        OperatorData: [
            { name: "operatorId", type: "bytes32" },
            { name: "operator", type: "address" },
            { name: "treasury_account", type: "address" },
            { name: "fee", type: "uint256" }
        ],
        Domain: [
            { name: "account", type: "address" },
            { name: "network_id", type: "uint256" },
            { name: "payment_token", type: "address" }
        ]
    }
    };

    // console.log("======= Permit2 Signature Payload =======>", 
    //     permitBatchTransferFrom,
    //     PERMIT2_CONFIG.ADDRESS,
    //     sourceNetwork.chainId,
    //     witnessData
    // );

    // Generate permit data using Uniswap SDK
    const permitData = SignatureTransfer.getPermitData(
        permitBatchTransferFrom,
        PERMIT2_CONFIG.ADDRESS,
        sourceNetwork.chainId,
        witnessData
    );

    console.log("======= Permit2 Signature Payload =======>", 
        permitData.domain,
        permitData.types,
        permitData.values
    );

    return {
      domain: permitData.domain,
      types: permitData.types,
      values: permitData.values
    };
  }
} 