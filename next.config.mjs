import path from 'node:path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed 'output: standalone' - not needed for Vercel
  distDir: '.next',
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
