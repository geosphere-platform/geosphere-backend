import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  transpilePackages: [
    "@geosphere/ui-screens",
    "@geosphere/gis-web",
    "@geosphere/ui",
    "@saurabhnagare-sys/geosphere-web-sdk"
  ],
};

export default nextConfig;
