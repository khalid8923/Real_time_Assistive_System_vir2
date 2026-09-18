import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.0.185", "192.168.0.*", "localhost"],
};

export default nextConfig;