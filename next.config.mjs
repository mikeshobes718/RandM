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
  // Note: eslint config moved to eslint.config.mjs (Next.js 16+)
  typescript: {
    // Skip type checking during build for faster deployments
    ignoreBuildErrors: true,
  },
};
export default nextConfig;
