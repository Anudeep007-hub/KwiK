import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        // This makes any request to /v1/... on your site...
        source: "/v1/:path*",
        // ...actually point to your backend API
        destination: "https://c5fa-27-34-241-74.ngrok-free.app/v1/:path*",
      },
    ];
  },
};

export default nextConfig;