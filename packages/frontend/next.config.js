/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  async rewrites() {
    // Only use localhost rewrite in development
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:4000/:path*',
        },
      ]
    }
    // In production, API calls will go to NEXT_PUBLIC_API_URL
    return []
  },
}

module.exports = nextConfig