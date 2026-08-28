import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
// GitHub Pages のプロジェクトページは https://<user>.github.io/boardgame-scorer/ に配信されるため、
// ビルド時のパスをそのサブディレクトリに合わせる。ローカル開発では '/' のまま。
const base = process.env.GITHUB_PAGES === 'true' ? '/boardgame-scorer/' : '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'ボードゲーム得点記録',
        short_name: '得点記録',
        description:
          'ボードゲームの得点を、その場でスマホに記録するアプリ。記録は端末の中だけに保存されます。',
        lang: 'ja',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f5efe1',
        theme_color: '#f5efe1',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // 画面遷移はすべてクライアント側で行うので、オフラインでは index.html を返す
        navigateFallback: `${base}index.html`,
      },
    }),
  ],
})
