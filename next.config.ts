import type { NextConfig } from "next";

const CF_FAVICON =
  "https://imagedelivery.net/evSvvg4gSrZmei5DvWV8Aw/1b118ac1-8ab1-487a-0efc-0ef8d4be0400/public";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "imagedelivery.net",
        pathname: "/evSvvg4gSrZmei5DvWV8Aw/**",
      },
      {
        protocol: "https",
        hostname: "commondatastorage.googleapis.com",
      },
    ],
  },
  async rewrites() {
    const api = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    const rules = [
      {
        source: "/favicon.ico",
        destination: CF_FAVICON,
      },
    ];
    if (api) {
      rules.push({
        source: "/api/:path*",
        destination: `${api}/api/:path*`,
      });
    }
    return rules;
  },
  serverExternalPackages: ["@solana/web3.js", "@solana/spl-token", "tweetnacl"],
};

export default nextConfig;
