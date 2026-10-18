import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the Arena live-preview host to talk to the dev server.
  allowedDevOrigins: ["*.e2b.app"],
};

export default nextConfig;
