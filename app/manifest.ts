import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Grand Citizens — Finance Portal",
    short_name: "GC Finance",
    description:
      "Donation & expense management for Grand Citizens iftaar drives",
    start_url: "/protected",
    display: "standalone",
    orientation: "portrait-primary",
    scope: "/",
    theme_color: "#0a0a0a",
    background_color: "#ffffff",
    categories: ["finance", "business"],
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-maskable-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
