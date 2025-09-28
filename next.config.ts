import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
    // Set to true to ignore TS errors (not recommended)
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    remotePatterns: [
      {
        hostname: "iti5r1lm8t.ufs.sh",
        port: "",
        protocol: "https",
      },
    ],
  },
};

export default nextConfig;
