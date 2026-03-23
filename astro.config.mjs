// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
  site: "https://cert.gdgpup.org",
  output: "server",
  adapter: vercel({
    webAnalytics: {
      enabled: true,
    },
  }),
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ["@resvg/resvg-js", "@resvg/resvg-js-win32-x64-msvc"],
    },
    ssr: {
      external: ["@resvg/resvg-js", "@resvg/resvg-js-win32-x64-msvc"],
    },
  },
});
