import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Local dev environment can't verify the Unsplash TLS chain
    // (UNABLE_TO_VERIFY_LEAF_SIGNATURE). Bypass the optimizer so the browser
    // fetches the originals directly.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
