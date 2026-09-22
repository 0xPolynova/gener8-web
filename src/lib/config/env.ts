function read(name: string, fallback = "") {
  return process.env[name] ?? fallback;
}

function readNumber(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function readBool(name: string, fallback = false) {
  const raw = process.env[name];
  if (!raw) return fallback;
  return raw === "true" || raw === "1";
}

export const env = {
  appUrl: read("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
  sessionSecret: read("SESSION_SECRET", "gener8-dev-session-secret-change-me"),

  supabaseUrl:
    read("NEXT_PUBLIC_SUPABASE_URL") || read("SUPABASE_PROJECT_URL"),
  supabaseAnonKey: read("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: read("SUPABASE_SERVICE_ROLE_KEY"),

  solanaRpc:
    read("SOLANA_RPC_URL") ||
    read("NEXT_PUBLIC_SOLANA_RPC") ||
    "https://api.mainnet-beta.solana.com",
  publicSolanaRpc:
    read("NEXT_PUBLIC_SOLANA_RPC") || "https://api.mainnet-beta.solana.com",

  tokenMint: read("GENER8_TOKEN_MINT") || read("NEXT_PUBLIC_GENER8_TOKEN_MINT"),
  tokenDecimals: readNumber("GENER8_TOKEN_DECIMALS", 9),
  tokenSymbol: read("NEXT_PUBLIC_GENER8_TOKEN_SYMBOL", "GENER8"),
  getTokenUrl: read("NEXT_PUBLIC_GET_GENER8_URL"),

  minBalance: readNumber("GENER8_MIN_BALANCE", 10_000),
  dailyGenerations: readNumber("GENER8_DAILY_GENERATIONS", 5),
  publicMinBalance: readNumber("NEXT_PUBLIC_GENER8_MIN_BALANCE", 10_000),

  videoProvider: read("VIDEO_PROVIDER", "mock"),
  videoProviderApiKey: read("VIDEO_PROVIDER_API_KEY"),
  videoProviderBaseUrl: read("VIDEO_PROVIDER_BASE_URL"),
  videoProviderWebhookSecret: read("VIDEO_PROVIDER_WEBHOOK_SECRET"),

  storageBucket: read("STORAGE_BUCKET"),
  cdnBaseUrl: read("CDN_BASE_URL"),
  cfImagesAccountHash: read(
    "NEXT_PUBLIC_CF_IMAGES_ACCOUNT_HASH",
    "evSvvg4gSrZmei5DvWV8Aw",
  ),
  cfImagesVariant: read("NEXT_PUBLIC_CF_IMAGES_VARIANT", "public"),

  demoMode: readBool("DEMO_MODE", true),
  demoTokenBalance: readNumber("DEMO_TOKEN_BALANCE", 25_000),
};

export function isSupabaseConfigured() {
  return Boolean(env.supabaseUrl && env.supabaseServiceRoleKey);
}

export function isOnChainConfigured() {
  return Boolean(env.tokenMint) && !env.demoMode;
}
