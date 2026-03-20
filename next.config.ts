import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";


const nextConfig: NextConfig = {
  serverExternalPackages: [],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  turbopack: {},
};

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",

});

export default withPWA(nextConfig);

