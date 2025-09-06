import { vi } from 'vitest'

// Create mock objects that can be reused and reset
export const mockRoute = {
  params: {},
  query: {},
  path: '/',
  fullPath: '/',
  hash: '',
  matched: [],
  meta: {},
  name: undefined,
  redirectedFrom: undefined
}

export const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  go: vi.fn(),
  currentRoute: { value: mockRoute }
}

export const useFetch = vi.fn()
export const useRoute = vi.fn(() => mockRoute)
export const useRouter = vi.fn(() => mockRouter)
export const navigateTo = vi.fn()
export const useNuxtApp = vi.fn(() => ({
  $router: mockRouter,
  $route: mockRoute
}))

// Helper function to reset all mocks
export const resetNuxtMocks = () => {
  vi.clearAllMocks()
  mockRoute.params = {}
  mockRoute.query = {}
  mockRoute.path = '/'
  mockRoute.fullPath = '/'
  mockRoute.hash = ''
  mockRoute.matched = []
  mockRoute.meta = {}
  mockRoute.name = undefined
  mockRoute.redirectedFrom = undefined
}