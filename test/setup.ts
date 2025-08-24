import { vi } from 'vitest'
import { config } from '@vue/test-utils'

// Mock Nuxt's auto-imports
vi.mock('#app', () => ({
  useNuxtApp: vi.fn(() => ({
    $trpc: vi.fn()
  })),
  navigateTo: vi.fn(),
  createError: vi.fn()
}))

// Mock tRPC client
vi.mock('~/api', () => ({
  useApi: vi.fn(() => ({
    $trpc: {
      customers: {
        getAll: { query: vi.fn() },
        getById: { query: vi.fn() },
        create: { mutate: vi.fn() },
        update: { mutate: vi.fn() },
        delete: { mutate: vi.fn() }
      },
      users: {
        getAll: { query: vi.fn() },
        getById: { query: vi.fn() },
        create: { mutate: vi.fn() },
        update: { mutate: vi.fn() },
        delete: { mutate: vi.fn() }
      },
      business: {
        getAll: { query: vi.fn() },
        getById: { query: vi.fn() },
        create: { mutate: vi.fn() },
        update: { mutate: vi.fn() },
        delete: { mutate: vi.fn() }
      },
      projects: {
        getAll: { query: vi.fn() },
        getById: { query: vi.fn() },
        create: { mutate: vi.fn() },
        update: { mutate: vi.fn() },
        delete: { mutate: vi.fn() }
      },
      plans: {
        getAll: { query: vi.fn() },
        getById: { query: vi.fn() },
        create: { mutate: vi.fn() },
        update: { mutate: vi.fn() },
        delete: { mutate: vi.fn() }
      },
      questions: {
        getAll: { query: vi.fn() },
        getById: { query: vi.fn() },
        create: { mutate: vi.fn() },
        update: { mutate: vi.fn() },
        delete: { mutate: vi.fn() }
      }
    }
  }))
}))

// Mock Pinia
vi.mock('pinia', () => ({
  createPinia: vi.fn(),
  setActivePinia: vi.fn(),
  defineStore: vi.fn(() => vi.fn(() => ({}))),
  storeToRefs: vi.fn(() => ({}))
}))

// Mock Vue Router
vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    go: vi.fn(),
    back: vi.fn(),
    forward: vi.fn()
  })),
  useRoute: vi.fn(() => ({
    params: {},
    query: {},
    path: '/',
    name: 'index'
  }))
}))

// Configure Vue Test Utils globally
config.global.mocks = {
  $trpc: vi.fn()
}

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn()
}