"use client";

import { useMemo } from "react";
import { ConnectionProvider } from "@solana/wallet-adapter-react";
import { clusterApiUrl } from "@solana/web3.js";

export default function SolanaProviderInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const endpoint = useMemo(
    () => process.env.NEXT_PUBLIC_SOLANA_RPC || clusterApiUrl("mainnet-beta"),
    [],
  );

  return (
    <ConnectionProvider endpoint={endpoint}>{children}</ConnectionProvider>
  );
}
