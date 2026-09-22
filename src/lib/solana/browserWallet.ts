import { PublicKey } from "@solana/web3.js";

export const WALLET_OPTIONS = [
  {
    name: "Phantom" as const,
    installUrl: "https://phantom.app/download",
  },
  {
    name: "Solflare" as const,
    installUrl: "https://solflare.com/download",
  },
];

export type WalletOptionName = (typeof WALLET_OPTIONS)[number]["name"];

type InjectedProvider = {
  isPhantom?: boolean;
  isSolflare?: boolean;
  isConnected?: boolean;
  publicKey?: unknown;
  connect: () => Promise<unknown>;
  disconnect?: () => Promise<void>;
  request?: (args: { method: string; params?: unknown }) => Promise<unknown>;
};

let active: InjectedProvider | null = null;

function win() {
  return window as Window & {
    phantom?: { solana?: InjectedProvider };
    solflare?: InjectedProvider;
    solana?: InjectedProvider;
  };
}

export function getInjectedProvider(name: WalletOptionName): InjectedProvider | null {
  if (typeof window === "undefined") return null;
  const w = win();
  if (name === "Phantom") {
    if (w.phantom?.solana) return w.phantom.solana;
    if (w.solana?.isPhantom) return w.solana;
    return null;
  }
  if (w.solflare) return w.solflare;
  if (w.solana?.isSolflare) return w.solana;
  return null;
}

export function isWalletInstalled(name: WalletOptionName) {
  return Boolean(getInjectedProvider(name));
}

export async function connectInjectedWallet(name: WalletOptionName) {
  const provider = getInjectedProvider(name);
  if (!provider) {
    throw new Error(`${name} isn’t installed. Install it, then refresh this page.`);
  }

  if (!provider.isConnected || !readPublicKey(provider.publicKey)) {
    try {
      if (typeof provider.request === "function") {
        await provider.request({ method: "connect" });
      } else {
        await provider.connect();
      }
    } catch (error) {
      if (!readPublicKey(provider.publicKey) && !provider.isConnected) throw error;
    }
  }

  const publicKey =
    readPublicKey(provider.publicKey) ?? (await waitForPublicKey(provider));
  if (!publicKey) {
    throw new Error(
      `${name} approved, but no wallet address came back. Unlock it and try again.`,
    );
  }

  active = provider;
  return publicKey.toBase58();
}

export async function disconnectInjectedWallet() {
  try {
    await active?.disconnect?.();
  } catch {
    /* ignore */
  }
  active = null;
}

async function waitForPublicKey(provider: InjectedProvider) {
  const started = Date.now();
  while (Date.now() - started < 4000) {
    const key = readPublicKey(provider.publicKey);
    if (key) return key;
    await new Promise((r) => window.setTimeout(r, 50));
  }
  return null;
}

function readPublicKey(value: unknown): PublicKey | null {
  if (!value) return null;
  try {
    if (value instanceof PublicKey) return value;
    if (typeof value === "string") return new PublicKey(value);
    if (value instanceof Uint8Array) return new PublicKey(value);
    if (ArrayBuffer.isView(value)) {
      const view = value as ArrayBufferView;
      return new PublicKey(
        new Uint8Array(view.buffer, view.byteOffset, view.byteLength),
      );
    }
    if (typeof value === "object") {
      const obj = value as {
        publicKey?: unknown;
        toBase58?: () => string;
        toBytes?: () => Uint8Array;
        toString?: () => string;
      };
      if (obj.publicKey && obj.publicKey !== value) {
        return readPublicKey(obj.publicKey);
      }
      if (typeof obj.toBase58 === "function") return new PublicKey(obj.toBase58());
      if (typeof obj.toBytes === "function") return new PublicKey(obj.toBytes());
      if (typeof obj.toString === "function") {
        const text = obj.toString();
        if (text && text !== "[object Object]") return new PublicKey(text);
      }
    }
  } catch {
    return null;
  }
  return null;
}
