import type { NextConfig } from "next";

const forPages = process.env.GITHUB_PAGES === "true";
const basePath = forPages ? "/sklad-zal" : "";

const nextConfig: NextConfig = {
  output: forPages ? "export" : undefined,
  basePath,
  assetPrefix: forPages ? `${basePath}/` : undefined,
  trailingSlash: forPages,
  images: { unoptimized: true },
};

export default nextConfig;
