/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['wdvgfxhyauvfyqebfmit.supabase.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wdvgfxhyauvfyqebfmit.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

module.exports = nextConfig
