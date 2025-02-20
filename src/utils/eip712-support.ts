import { ethers } from "ethers";

interface ExtendedSigner extends ethers.Signer {
  _signTypedData(
    domain: Record<string, any>,
    types: Record<string, any>,
    value: Record<string, any>
  ): Promise<string>;
}

/**
 * Ensures signer supports EIP-712 typed data signing
 * @param signer - Ethereum signer
 * @returns Injects _signTypedData support into the signer
 */
export function isSignTypedDataSupported(signer: ethers.Signer): ExtendedSigner {
  if ((signer as any)._signTypedData) {
    return signer as ExtendedSigner;
  }

  return Object.create(signer, {
    _signTypedData: {
      value: async function (domain: any, types: any, value: any): Promise<string> {
        const domainSeparator = ethers.utils._TypedDataEncoder.hashDomain(domain);
        const hashStruct = ethers.utils._TypedDataEncoder.hash(domain, types, value);
        const digest = ethers.utils.keccak256(
          ethers.utils.concat([
            ethers.utils.toUtf8Bytes("\x19\x01"),
            ethers.utils.arrayify(domainSeparator),
            ethers.utils.arrayify(hashStruct),
          ])
        );
        return signer.signMessage(ethers.utils.arrayify(digest));
      },
    },
  });
} 