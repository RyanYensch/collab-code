import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    preact(),
    cloudflare(),
  ],

  resolve: {
    alias: {
      'monaco-editor/esm/vs/editor/editor.api.js':
        fileURLToPath(
          new URL(
            './node_modules/monaco-editor/esm/vs/editor/editor.api.js',
            import.meta.url,
          ),
        ),
    },
  },
})