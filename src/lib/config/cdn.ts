/**
 * Cloudflare Images delivery.
 * URL shape: https://imagedelivery.net/<account_hash>/<image_id>/<variant>
 */
const ACCOUNT_HASH =
  process.env.NEXT_PUBLIC_CF_IMAGES_ACCOUNT_HASH ?? "evSvvg4gSrZmei5DvWV8Aw";
const VARIANT = process.env.NEXT_PUBLIC_CF_IMAGES_VARIANT ?? "public";

export const cfImages = {
  accountHash: ACCOUNT_HASH,
  variant: VARIANT,
  host: "imagedelivery.net",
  baseUrl: `https://imagedelivery.net/${ACCOUNT_HASH}`,
};

export function cfImage(imageId: string, variant = VARIANT) {
  return `${cfImages.baseUrl}/${imageId}/${variant}`;
}

export const BRAND_ASSETS = {
  favicon: cfImage("33cbd265-b2e6-41b1-9d7a-6475a83f5a00"),
  logo: cfImage("f8f20a99-3659-4066-7e6b-b6aeb49e6a00"),
} as const;
