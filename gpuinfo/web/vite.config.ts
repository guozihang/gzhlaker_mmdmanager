import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    proxy: {
      // 使用 `'/api'` 作为前缀的请求会被转发到下面的目标地址
      '/api': {
        target: 'http://101.43.186.22:7070', // 后端服务实际地址
        changeOrigin: true, // 必须设置为true
        rewrite: (path) => path.replace(/^\/api/, '') // 重写请求路径，去掉 `/api` 前缀
      }
    }
  }
})  
