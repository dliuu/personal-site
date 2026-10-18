import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    // Models, textures, the Draco decoder and the land file are large and
    // change rarely: a week in the browser's cache, then served stale while
    // a fresh copy is checked, instead of a 304 round trip per file per visit.
    return [
      {
        source: "/:dir(models|textures|draco|geo)/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=2592000",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
