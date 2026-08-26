import type { NextConfig } from "next";

/**
 * The page is public and takes no user data — so the realistic threats are
 * framing (someone embedding the calculator inside a page that passes it off
 * as their own, or overlaying it to harvest clicks) and content injected via
 * the Google Sheet. These headers close the first and limit the blast radius
 * of the second.
 *
 * Content-Security-Policy is set here too, but only as a static fallback for
 * routes the proxy doesn't cover (its matcher excludes prefetches and static
 * assets). The real, strict CSP — with a per-request nonce and no
 * `'unsafe-inline'` in script-src — is set in src/proxy.ts; see the comment
 * there for why that needs a proxy instead of living here.
 */
export const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none'",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  // Don't advertise the framework version to anyone fingerprinting the site.
  poweredByHeader: false,
  images: {
    // The only image on the site is our own SVG logo, which Next never runs
    // through sharp anyway. Turning optimisation off removes the /_next/image
    // endpoint (and with it the libvips/sharp CVE surface) without changing
    // how anything renders.
    unoptimized: true,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
