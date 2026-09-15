import type { NextConfig } from "next";

// GitHub Pages serves this project from a subpath (/digital-settlement-studio),
// so basePath is only set for that build — local dev and preview stay at "/".
const basePath = process.env.NEXT_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  // Exposed so client-side search can fetch page HTML under the GitHub Pages subpath.
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
