/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // appDir is enabled by default in Next.js 15
  },
  images: {
    domains: [],
  },
  // No rewrites needed; client uses NEXT_PUBLIC_API_URL directly
  // Note: CORS should be handled by the API server. Removing broad headers here.
};

module.exports = nextConfig;
