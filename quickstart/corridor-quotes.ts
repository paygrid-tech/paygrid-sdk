import { ethers } from 'ethers';
import { 
    Paygrid,
    RoutingPriority,
    NetworkTokens,
    Networks,
    Tokens,
    CorridorQuoteRequest
} from '@paygrid-network/sdk';

import dotenv from 'dotenv';
  
dotenv.config();

async function main() {
  try {
    // Initialize Paygrid SDK
    const paygrid = new Paygrid();

    console.log('\n1. Getting Corridor Quotes');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Example parameters
    const amount = 1; // Amount to transfer in token units (e.g. 1 USDC)
    const sourceAccount = '0x1234567890123456789012345678901234567890'; // Source account address
    const destinationAccount = '0x9876543210987654321098765432109876543210'; // Destination account address
    
    // Define source networks and tokens (Optional - skip if not needed)
    const sources: NetworkTokens = {
      networks: [Networks.POLYGON],
      tokens: [Tokens.USDC]
    };
    
    // Define destination networks and tokens
    const destinations: NetworkTokens = {
      networks: [Networks.OPTIMISM, Networks.POLYGON, Networks.BASE],
      tokens: [Tokens.USDC, Tokens.USDT]
    };
    
    const request: CorridorQuoteRequest = {
      amount,
      source_account: sourceAccount,
      destination_account: destinationAccount,
      sources,
      destinations,
      routing_priority: RoutingPriority.COST
    };

    // Get corridor quotes
    const corridorQuotes = await paygrid.getPaymentCorridorRoutes(request);
    
    console.log('\n✓ Corridor Quotes Retrieved');
    console.log(`Found ${corridorQuotes.corridor_quotes.length} corridor routes`);
    
    // Display corridor quotes
    corridorQuotes.corridor_quotes.forEach((quote, index) => {
      console.log(`\nRoute ${index + 1}:`);
      console.log(`  Quote ID: ${quote.quoteId}`);
      console.log(`  Corridor ID: ${quote.corridorId}`);
      console.log(`  Estimated Total Fees: ${quote.estimated_total_fees}`);
      console.log(`  Estimated Execution Time: ${quote.estimated_execution_time} seconds`);
      console.log(`  Expires At: ${corridorQuotes.expires_at}`);
    });
    
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error:', error.message);
    } else {
      console.error('Error:', error);
    }
  }
}

// Run the corridor quotes demo
main(); 