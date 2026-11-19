import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  cacheComponents: true,
  // partialPrefetching + Date.now (JWT / wait labels) spam PrefetchRuntime errors
  // and slows desk tab switches; re-enable only with navigation()-gated time reads.
  partialPrefetching: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
