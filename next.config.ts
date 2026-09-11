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
    remotePatterns: [
      { protocol: "https", hostname: "apkvision.org", pathname: "/wp-content/**" },
      { protocol: "https", hostname: "img.apkvision.org", pathname: "/**" },
      ...extraPatterns,
    ],
  },
};

export default nextConfig;
