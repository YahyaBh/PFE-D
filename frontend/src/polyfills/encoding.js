// Polyfill for encoding module to fix face-api.js issues
// This is a minimal implementation for browser compatibility

const TextEncoder = global.TextEncoder;
const TextDecoder = global.TextDecoder;

module.exports = {
  TextEncoder,
  TextDecoder,
  // Add any other encoding-related exports if needed
};
