const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  optimizeFonts: false,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        os: false,
        stream: false,
        buffer: false,
        process: false,
        encoding: false,
      };

      // Prioritize local node_modules over root-level ones
      config.resolve.modules = [
        path.resolve(__dirname, 'node_modules'),
        'node_modules',
      ];

      config.resolve.alias = {
        ...config.resolve.alias,
        'encoding': path.resolve(__dirname, 'src/polyfills/encoding.js'),
        'node-fetch': false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;

