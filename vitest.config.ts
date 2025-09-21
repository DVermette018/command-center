// vitest.config.ts
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'
import { defineVitestProject } from '@nuxt/test-utils/config'

export default defineConfig(async () => ({
  plugins: [vue()],
  resolve: {
    alias: {
      '~': resolve(__dirname, './app'),
      '~~': resolve(__dirname, '.'),
      '@': resolve(__dirname, './app'),
      // you usually don't need the extra '~/','~~/','@@/' entries
    },
  },
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['test/{unit,utils}/**/*.{test,spec}.{ts,tsx}'],
          exclude: ['node_modules', 'dist', 'test/e2e', 'prisma', '.conductor/**'],
          setupFiles: ['./test/setup.ts'],
          environment: 'happy-dom',
        },
      },
      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['test/{components,composables,pages}/**/*.{test,spec}.{ts,tsx}'],
          exclude: ['node_modules', 'dist', 'test/e2e', 'prisma', '.conductor/**'],
          environment: 'nuxt',
          setupFiles: ['./test/setupNuxt.ts'],
          isolate: true,
        },
      }),
    ],
  },
}))
