// next.config.ts
import type { NextConfig } from "next";

/** Only the bits of Webpack config we need */
type MinimalWebpackConfig = {
  resolve?: {
    alias?: Record<string, string | false>;
  };
};

const nextConfig = {
  webpack(config) {
    // Narrow to the minimal shape we care about (no `any`)
    const cfg = config as MinimalWebpackConfig;

    cfg.resolve ??= {};
    cfg.resolve.alias ??= {};

    // Stub out the Winston transport so Webpack stops resolving it
    cfg.resolve.alias["@opentelemetry/winston-transport"] = false;

    return config;
  },
} satisfies NextConfig;

export default nextConfig;
