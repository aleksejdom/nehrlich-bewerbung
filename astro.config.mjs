import { defineConfig } from 'astro/config'
import vercel from '@astrojs/vercel'
import tailwind from '@tailwindcss/vite'
import react from "@astrojs/react";


export default defineConfig({
  output: 'server', // oder 'hybrid' falls deine Astro-Version >=4.10
  adapter: vercel(),
  vite: {
    plugins: [tailwind()]
  },
  integrations: [react()],
})
