import { beforeEach, vi } from 'vitest'
import type { MockedFunction } from 'vitest'
import { createApp } from 'vue'

// Mock Vue components and hooks with proper context
const mockApp = createApp({})

// Global test setup
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks()
  
  // Reset DOM
  document.head.innerHTML = ''
  document.body.innerHTML = '<div id="app"></div>'
})

// Mock DOM APIs
Object.defineProperty(window, 'navigator', {
  value: {
    onLine: true,
    connection: {
      effectiveType: '4g',
      downlink: 10,
      rtt: 50,
      saveData: false,
      type: 'wifi'
    },
    userAgent: 'test'
  },
  writable: true
})

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  callback
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock Vue's h function globally for test components
global.h = vi.fn((tag, props, children) => ({ tag, props, children }))
global.ref = vi.fn((value) => ({ value }))
global.nextTick = vi.fn()
global.queueMicrotask = vi.fn((callback) => callback())

// Mock Nuxt auto-imports - set up as proper mocks
global.useToast = vi.fn(() => ({
  add: vi.fn(),
  remove: vi.fn(), 
  clear: vi.fn()
}))
global.navigateTo = vi.fn()
global.useQueryClient = vi.fn()

// Mock process.env for tests
global.process = {
  env: {
    NODE_ENV: 'test'
  }
}

// Mock Nuxt composables and utilities
export const mockNuxtComposables = () => {
  const mockNavigateTo = vi.fn()
  const mockUseRouter = vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    go: vi.fn(),
    back: vi.fn(),
    forward: vi.fn()
  }))
  
  const mockUseRoute = vi.fn(() => ({
    params: {},
    query: {},
    path: '/',
    name: 'index'
  }))

  const mockUseRuntimeConfig = vi.fn(() => ({
    public: {
      appwriteEndpoint: 'https://test.appwrite.io',
      appwriteProjectId: 'test-project',
      appwriteProjectName: 'Test Project'
    }
  }))

  const mockUseToast = vi.fn(() => ({
    add: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn()
  }))

  return {
    navigateTo: mockNavigateTo,
    useRouter: mockUseRouter,
    useRoute: mockUseRoute,
    useRuntimeConfig: mockUseRuntimeConfig,
    useToast: mockUseToast
  }
}

// Mock TRPC client
export const mockTRPCClient = () => {
  return {
    customers: {
      getAll: vi.fn(),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    projects: {
      getAll: vi.fn(),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    users: {
      getAll: vi.fn(),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }
  }
}

// Mock Vue Query
export const mockVueQuery = () => {
  const mockQueryClient = {
    invalidateQueries: vi.fn(),
    removeQueries: vi.fn(),
    setQueryData: vi.fn(),
    getQueryData: vi.fn(),
    refetchQueries: vi.fn()
  }

  const mockUseQuery = vi.fn(() => ({
    data: ref(null),
    isLoading: ref(false),
    isError: ref(false),
    error: ref(null),
    refetch: vi.fn(),
    isRefetching: ref(false)
  }))

  const mockUseMutation = vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isLoading: ref(false),
    isError: ref(false),
    error: ref(null),
    isSuccess: ref(false),
    data: ref(null),
    reset: vi.fn()
  }))

  return {
    queryClient: mockQueryClient,
    useQuery: mockUseQuery,
    useMutation: mockUseMutation,
    useQueryClient: vi.fn(() => mockQueryClient)
  }
}

// Test data factories
export const createTestCustomer = (overrides = {}) => ({
  id: '1',
  name: 'Test Customer',
  email: 'test@customer.com',
  phone: '+1234567890',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

export const createTestProject = (overrides = {}) => ({
  id: '1',
  title: 'Test Project',
  description: 'A test project description',
  status: 'active',
  customerId: '1',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

export const createTestUser = (overrides = {}) => ({
  id: '1',
  name: 'Test User',
  email: 'test@user.com',
  role: 'admin',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

// Network error simulation
export const createNetworkError = (message = 'Network Error') => {
  const error = new Error(message)
  error.name = 'NetworkError'
  return error
}

// TRPC error simulation
export const createTRPCError = (code = 'BAD_REQUEST', message = 'Bad Request') => {
  const error = new Error(message)
  // @ts-ignore - Simulating TRPC error structure
  error.data = { code, httpStatus: 400 }
  return error
}