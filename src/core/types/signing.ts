import { Address } from 'web3';
import { NetworkKey } from './index';
import { IntervalUnit, PaymentType, TokenSymbol } from './index';

export interface Domain {
  account: Address;
  network_id: NetworkKey;
  payment_token: TokenSymbol;
}

export interface OperatorData {
  operatorId: string;
  operator: string;
  treasury_account: Address;
  fee: number;
  operatorURI?: string;
  authorized_signers?: Address[];
}

export interface PaymentSchedule {
  intervalUnit: IntervalUnit;
  intervalCount: bigint;
  iterations: bigint;
  startDate: bigint;
  endDate: bigint;
}