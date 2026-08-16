/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Playwright + the Claude call together can take 30-90s for a single audit.
  // Deploy this as a normal Node server (`next start`), not a serverless
  // function platform with a short execution timeout. See README.
  eslint: {
    // No eslint/eslint-config-next dependency in this starter on purpose,
    // keeps install light. Without this, `next build` stalls waiting to
    // prompt "install ESLint?" on a non-interactive terminal.
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
