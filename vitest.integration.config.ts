import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '~': resolve(__dirname, '.'),
      '~~': resolve(__dirname, '.'),
      '@': resolve(__dirname, '.'),
      '~~/': resolve(__dirname, './'),
      '@@/': resolve(__dirname, './')
    }
  },
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./test/setup-integration.ts'],
    isolate: true,
    include: ['**/integration/**/*.test.ts', '**/performance/**/*.test.ts'],
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
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    }
  }
})