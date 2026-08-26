/**
 * Builds the per-request Content-Security-Policy string. Pure and
 * framework-free (no `next/server` import) so it can be unit-tested directly
 * — see src/proxy.ts, which is the only caller and owns the actual nonce
 * generation and header wiring.
 */
export function buildCsp(nonce: string, isDev: boolean): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // Nonces only cover <style> elements, not style="" attributes, and this
    // app sets CSS custom properties via JSX `style={{...}}` throughout —
    // rewriting that to static classes isn't worth it for a page with no
    // way to inject untrusted content into a style attribute.
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
}
