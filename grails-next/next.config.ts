import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ShaderGradient uses browser-only WebGL APIs.
  // Marking these packages as external for the server bundle prevents
  // "window is not defined" errors during SSR / Next.js static analysis.
  experimental: {
    serverComponentsExternalPackages: [
      "@shadergradient/react",
      "@react-three/fiber",
      "three",
      "three-stdlib",
      "camera-controls",
    ],
  },
};

export default nextConfig;
