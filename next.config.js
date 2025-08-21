/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  images: {
    domains: ['ccytbpimimkkaxsemdov.supabase.co'],
  },
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}