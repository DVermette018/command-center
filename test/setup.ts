import { beforeAll, beforeEach, afterEach, afterAll, vi } from 'vitest'
import { config } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

// Global test setup
beforeAll(() => {
  // Create a QueryClient with test-friendly settings
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Don't retry failed requests in tests
        refetchOnWindowFocus: false, // Don't refetch on window focus
        refetchOnMount: false, // Don't refetch on mount by default
        refetchOnReconnect: false, // Don't refetch on reconnect
        staleTime: Infinity, // Consider data always fresh to avoid unwanted refetches
        gcTime: Infinity // Keep data in cache indefinitely during tests
      },
      mutations: {
        retry: false // Don't retry failed mutations in tests
      }
    }
  })

  // Set up global configurations
  config.global.plugins = [
    [VueQueryPlugin, { queryClient }]
  ]

  config.global.stubs = {
    // Stub Nuxt components that might cause issues in tests
    ClientOnly: true,
    NuxtLink: true,
    NuxtPage: true,
    NuxtLayout: true
  }

  // Mock window.matchMedia for components that use media queries
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  })

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }))

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }))

  // Mock fetch globally
  global.fetch = vi.fn()
})

beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks()
})

afterEach(() => {
  // Cleanup after each test
  vi.resetAllMocks()
})

afterAll(() => {
  // Global cleanup
  vi.restoreAllMocks()
})