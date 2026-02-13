/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Add this line
  images: {
    unoptimized: true,  // Add this line
  },
  reactStrictMode: true,
}

module.exports = nextConfig
