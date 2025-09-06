import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const currentDir = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '~': currentDir,
      '~/': `${currentDir}/`,
      '@/': `${currentDir}/`,
      '~/test': `${currentDir}/test`,
      '~/app': `${currentDir}/app`
    }
  }
})