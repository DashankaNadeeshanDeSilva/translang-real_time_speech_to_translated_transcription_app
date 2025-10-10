/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Production optimization for Docker/AWS deployment
  output: 'standalone', // Creates standalone build for Docker
  compress: true,
  
  webpack: (config, { isServer }) => {
    // Support for WASM files (needed for VAD library)
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // Add fallbacks for Node.js modules in browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        module: false,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    return config;
  },
  
  // Environment variables
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || '1.0.0',
  },
};

module.exports = nextConfig;

