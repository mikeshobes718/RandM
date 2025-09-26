import path from 'node:path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Fix path issues by explicitly setting the correct working directory
  distDir: '.next',
  outputFileTracingRoot: path.join(process.cwd()),
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
  eslint: {
    // The existing codebase includes legacy patterns and generated bundles; skip blocking the build on lint warnings.
    ignoreDuringBuilds: true,
  },
};
export default nextConfig;
