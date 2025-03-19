import { NetworkKey, TokenSymbol, RoutingPriority } from './index';

/**
 * Network tokens interface for specifying destination networks and tokens
 */
export interface NetworkTokens {
  networks?: NetworkKey[];
  tokens?: TokenSymbol[];
}

/**
 * Corridor quote request interface
 */
export interface CorridorQuoteRequest {
  amount: number;
  source_account: string;
  destination_account?: string;
  routing_priority?: RoutingPriority;
  sources?: NetworkTokens;
  destinations?: NetworkTokens;
  payment_reference?: string;
}

/**
 * Corridor fee interface
 */
export interface CorridorFee {
  quoteId: string;
  corridorId: string;
  estimated_total_fees: number;
  estimated_execution_time: number;
  price_impact?: number;
}

/**
 * Corridor quote response interface
 */
export interface CorridorQuoteResponse {
  corridor_quotes: CorridorFee[];
  expires_at?: string;
}

/**
 * Effective quote response interface with additional metadata
 */
export interface EffectiveQuoteResponse extends CorridorQuoteResponse {}