/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'oiuccrhcovaglowbozcd.supabase.co', // Add your Supabase storage domain
      'localhost' // Optional: if you need local image support
    ]
  },
  // Other Next.js configurations can remain here
};

module.exports = nextConfig;