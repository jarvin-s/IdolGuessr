import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'elbiqmbschvswaahfxib.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'cmxamdnyfovgoikbxunk.supabase.co',
      },
    ],
  },
};

export default nextConfig;
