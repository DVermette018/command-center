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
    // setupFiles: ['./test/setup-integration.ts'], // Don't use global setup for performance tests
    isolate: true,
    include: ['**/performance/**/*.test.ts'],
    timeout: 120000, // 2 minutes for performance tests
    testTimeout: 180000, // 3 minutes for individual test timeout
    hookTimeout: 90000, // 90 seconds for hooks
    teardownTimeout: 60000, // 60 seconds for teardown
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
      ]
    },
    // Performance test specific settings
    pool: 'forks', // Use forks for better isolation in performance tests
    poolOptions: {
      forks: {
        singleFork: true // Run tests in sequence to avoid interference
      }
    },
    // Retry failed tests once (performance tests can be flaky)
    retry: 1,
    // Custom reporter for performance tests
    reporters: [
      'default',
      ['json', { outputFile: 'performance-results.json' }]
    ]
  }
})