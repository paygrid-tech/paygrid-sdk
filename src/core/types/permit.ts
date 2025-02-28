import { EIP712Domain, EIP712Types, EIP712Values } from './index';

export type PermitType = 'EIP2612' | 'DAI' | 'REGULAR';

export interface PermitSignaturePayload {
  domain: EIP712Domain;
  types: EIP712Types;
  values: EIP712Values;
}

export interface PermitSignatureParams {
  token: `0x${string}`;
  owner: `0x${string}`;
  spender?: `0x${string}`;
  value?: bigint;
  deadline: number;
  nonce?: bigint;
}

export interface PermitSignature {
  signature: string;
  deadline: number;
  nonce: string;
}