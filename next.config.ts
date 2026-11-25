import type { NextConfig } from "next";
import pkg from "./package.json";

/**
 * DAYONE собирается как полностью статический сайт (output: "export"),
 * чтобы его можно было бесплатно разместить на GitHub Pages.
 *
 * NEXT_PUBLIC_BASE_PATH задаётся при сборке под GitHub Pages
 * (например "/dayone", если репозиторий называется dayone).
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") || "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: basePath || undefined,
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
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
