import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // For a user site (username.github.io), no basePath needed.
  // If deploying to a project site, set:
  //   basePath: "/repo-name",
  //   assetPrefix: "/repo-name/",
};

export default nextConfig;
