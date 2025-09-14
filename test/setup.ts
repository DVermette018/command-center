import { vi } from 'vitest'
import { config } from '@vue/test-utils'

// Don't mock Vue core - let it work normally for component mounting

// Mock Nuxt's auto-imports
vi.mock('#app', () => ({
  useNuxtApp: vi.fn(() => ({
    $trpc: vi.fn()
  })),
  navigateTo: vi.fn(),
  createError: vi.fn()
}))

// Mock Nuxt composables
vi.mock('#app/composables/toast', () => ({
  useToast: vi.fn(() => ({
    add: vi.fn()
  }))
}))

// Mock external utility libraries
vi.mock('scule', () => ({
  upperFirst: vi.fn((str) => str.charAt(0).toUpperCase() + str.slice(1))
}))

// Mock customer DTO schema
vi.mock('~~/dto/customer', () => ({
  createCustomerSchema: {
    safeParse: vi.fn(() => ({ success: true, data: {} })),
    parse: vi.fn((data) => data),
    // Add zod-like properties
    _def: {},
    _type: undefined
  },
  CreateCustomerSchema: {}
}))

// Global mocks for common Nuxt composables
global.useToast = vi.fn(() => ({
  add: vi.fn()
}))

// Add back core Vue reactivity function mocks (component likely needs these)
global.ref = vi.fn((value) => ({ 
  value,
  _rawValue: value,
  _shallow: false,
  __v_isRef: true,
  __v_isShallow: false
}))

global.reactive = vi.fn((obj) => new Proxy(obj || {}, {
  get: (target, prop) => target[prop],
  set: (target, prop, value) => {
    target[prop] = value
    return true
  }
}))

global.computed = vi.fn((fn) => ({
  value: typeof fn === 'function' ? fn() : fn,
  __v_isRef: true,
  __v_isReadonly: true
}))

global.watch = vi.fn()
global.watchEffect = vi.fn()
global.useTemplateRef = vi.fn((name) => ({ value: null }))
global.nextTick = vi.fn(() => Promise.resolve())
global.onMounted = vi.fn()
global.onUnmounted = vi.fn()
global.onBeforeMount = vi.fn()
global.onBeforeUnmount = vi.fn()

// Mock the critical missing function that causes qupdate error
global.queuePostFlushCb = vi.fn()
global.queueJob = vi.fn()
global.queuePreFlushCb = vi.fn()
global.qupdate = vi.fn()
global.queueUpdate = vi.fn()

global.useNuxtApp = vi.fn(() => ({
  $trpc: vi.fn()
}))
global.navigateTo = vi.fn()

// Mock tRPC client
vi.mock('~/api', () => ({
  useApi: vi.fn(() => ({
    customers: {
      useGetAllQuery: vi.fn(() => ({
        data: { value: { data: [], total: 0, page: 1, pageSize: 10 } },
        isLoading: { value: false },
        status: { value: 'success' },
        error: { value: null },
        refetch: vi.fn()
      })),
      useGetByIdQuery: vi.fn(() => ({
        data: { value: null },
        isLoading: { value: false },
        status: { value: 'success' },
        error: { value: null },
        refetch: vi.fn()
      })),
      useCreateMutation: vi.fn(() => ({
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isLoading: { value: false },
        error: { value: null }
      })),
      useUpdateMutation: vi.fn(() => ({
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isLoading: { value: false },
        error: { value: null }
      }))
    },
    users: {
      useGetAllQuery: vi.fn(() => ({
        data: { value: { data: [], total: 0, page: 1, pageSize: 10 } },
        isLoading: { value: false },
        status: { value: 'success' },
        error: { value: null },
        refetch: vi.fn()
      }))
    },
    business: {
      useGetAllQuery: vi.fn(() => ({
        data: { value: { data: [], total: 0, page: 1, pageSize: 10 } },
        isLoading: { value: false },
        status: { value: 'success' },
        error: { value: null },
        refetch: vi.fn()
      }))
    },
    projects: {
      useGetAllQuery: vi.fn(() => ({
        data: { value: { data: [], total: 0, page: 1, pageSize: 10 } },
        isLoading: { value: false },
        status: { value: 'success' },
        error: { value: null },
        refetch: vi.fn()
      }))
    },
    plans: {
      useGetAllQuery: vi.fn(() => ({
        data: { value: { data: [], total: 0, page: 1, pageSize: 10 } },
        isLoading: { value: false },
        status: { value: 'success' },
        error: { value: null },
        refetch: vi.fn()
      }))
    },
    questions: {
      useGetAllQuery: vi.fn(() => ({
        data: { value: { data: [], total: 0, page: 1, pageSize: 10 } },
        isLoading: { value: false },
        status: { value: 'success' },
        error: { value: null },
        refetch: vi.fn()
      }))
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

// Configure Vue Test Utils globally - minimal mocks
config.global.mocks = {
  $trpc: vi.fn(),
  useToast: vi.fn(() => ({
    add: vi.fn()
  })),
  useNuxtApp: vi.fn(() => ({
    $trpc: vi.fn()
  })),
  navigateTo: vi.fn()
}

// Global stubs for common UI components
config.global.stubs = {
  UButton: true,
  UModal: true,
  UForm: true,
  UPageCard: true,
  UFormField: true,
  UInput: true,
  USelect: true,
  USeparator: true,
  UTextarea: true,
  UTable: true,
  UBadge: true,
  UDropdown: true,
  UIcon: true,
  UCard: true,
  UContainer: true,
  UCommandPalette: true
}

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn()
}