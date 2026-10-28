import type { NextConfig } from "next";

// If SOURCE_ORIGIN is overridden (dev/local mock), also allow its images.
const extraPatterns: { protocol: "http" | "https"; hostname: string; port?: string; pathname: string }[] = [];
const origin = process.env.SOURCE_ORIGIN;
if (origin) {
  try {
    const u = new URL(origin);
    const protocol = u.protocol.replace(":", "") === "http" ? "http" : "https";
    extraPatterns.push({
      protocol,
      hostname: u.hostname,
      ...(u.port ? { port: u.port } : {}),
      pathname: "/**",
    });
  } catch {
    /* ignore invalid SOURCE_ORIGIN */
  }
}

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    // Next's optimizer refuses local/private-IP upstreams by default — allow
    // them ONLY when SOURCE_ORIGIN points at the local mock (dev). In
    // production SOURCE_ORIGIN is unset and this stays off.
    ...(origin ? { dangerouslyAllowLocalIP: true } : {}),
    remotePatterns: [
      { protocol: "https", hostname: "apkvision.org", pathname: "/wp-content/**" },
      { protocol: "https", hostname: "img.apkvision.org", pathname: "/**" },
      // belt & braces: the parser upgrades source hosts to https, but never
      // let the optimizer 400 a card icon over a stray http:// or www. URL
      { protocol: "http", hostname: "apkvision.org", pathname: "/wp-content/**" },
      { protocol: "https", hostname: "www.apkvision.org", pathname: "/wp-content/**" },
      { protocol: "http", hostname: "www.apkvision.org", pathname: "/wp-content/**" },
      { protocol: "http", hostname: "img.apkvision.org", pathname: "/**" },
      ...extraPatterns,
    ],
  },
};

export default nextConfig;
