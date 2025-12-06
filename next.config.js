// next.config.js
/** @type {import('next').NextConfig} */
const path = require('path');

/**
 * Next.js kept inferring the workspace root as the parent directory because a different
 * lockfile lives up the tree. Explicitly tell Turbopack/Next where the project root lives
 * so that .env.local and other app-level config resolve correctly.
 */
const projectRoot = __dirname;

const nextConfig = {
  reactCompiler: true,
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
};

module.exports = nextConfig;