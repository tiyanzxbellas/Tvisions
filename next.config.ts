import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "apkvision.org", pathname: "/wp-content/**" },
      { protocol: "https", hostname: "img.apkvision.org", pathname: "/**" },
    ],
  },
};

export default nextConfig;
