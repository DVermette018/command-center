import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '~': resolve(__dirname, './app'),
      '~~': resolve(__dirname, '.'),
      '@': resolve(__dirname, './app'),
      '~~/': resolve(__dirname, './'),
      '@@/': resolve(__dirname, './')
    }
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    exclude: ['node_modules', 'dist', 'test/e2e', 'prisma', '.conductor/**'],
    isolate: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'test/',
        'coverage/',
        '**/*.d.ts',
        'nuxt.config.ts',
        '.nuxt/',
        'dist/',
        'prisma/'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
})
