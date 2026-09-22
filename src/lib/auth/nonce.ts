import { nanoid } from "@/lib/utils";

interface NonceRecord {
  nonce: string;
  wallet: string;
  createdAt: number;
}

const TTL_MS = 5 * 60 * 1000;

const globalNonces = globalThis as unknown as {
  __gener8Nonces?: Map<string, NonceRecord>;
};

const nonces = globalNonces.__gener8Nonces ?? new Map<string, NonceRecord>();
if (!globalNonces.__gener8Nonces) globalNonces.__gener8Nonces = nonces;

export function issueNonce(wallet: string) {
  const nonce = nanoid(24);
  nonces.set(wallet, { nonce, wallet, createdAt: Date.now() });
  return nonce;
}

export function consumeNonce(wallet: string, nonce: string) {
  const record = nonces.get(wallet);
  if (!record) return false;
  if (record.nonce !== nonce) return false;
  if (Date.now() - record.createdAt > TTL_MS) {
    nonces.delete(wallet);
    return false;
  }
  nonces.delete(wallet);
  return true;
}

export function authMessage(wallet: string, nonce: string) {
  return [
    "Connect to Gener8",
    "",
    "Confirm this wallet as your Gener8 account.",
    "This does not send a transaction or spend funds.",
    "",
    `Wallet: ${wallet}`,
    `Nonce: ${nonce}`,
  ].join("\n");
}
