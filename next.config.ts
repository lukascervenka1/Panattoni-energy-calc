import type { NextConfig } from "next";

/**
 * The page is public, static, and takes no user data — so the realistic
 * threats are framing (someone embedding the calculator inside a page that
 * passes it off as their own, or overlaying it to harvest clicks) and content
 * injected via the Google Sheet. These headers close the first and limit the
 * blast radius of the second.
 *
 * Note on `script-src 'unsafe-inline'`: the page is statically prerendered, and
 * a nonce-based CSP would force every request to render dynamically. Since no
 * user-supplied string is ever written into the markup as HTML (React escapes
 * everything, and there is no dangerouslySetInnerHTML anywhere), the remaining
 * value of the CSP is in blocking *external* script/object/frame loads and
 * base/form hijacking, which the directives below still do.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

export const securityHeaders = [
  { key: "Content-Security-Policy", value: CSP },
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
