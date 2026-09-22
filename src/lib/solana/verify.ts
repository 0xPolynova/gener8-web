import nacl from "tweetnacl";
import bs58 from "bs58";

export function verifyWalletSignature(params: {
  wallet: string;
  message: string;
  signature: string;
}) {
  try {
    const message = new TextEncoder().encode(params.message);
    const signature = decodeSignature(params.signature);
    const publicKey = bs58.decode(params.wallet);
    if (publicKey.length !== 32) return false;
    return nacl.sign.detached.verify(message, signature, publicKey);
  } catch {
    return false;
  }
}

function decodeSignature(signature: string): Uint8Array {
  try {
    return bs58.decode(signature);
  } catch {
    const buf = Buffer.from(signature, "base64");
    return new Uint8Array(buf);
  }
}
