import { beforeAll, beforeEach, afterEach, afterAll, vi } from 'vitest'
import { config } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

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
})

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.resetAllMocks()
})

afterAll(() => {
  vi.restoreAllMocks()
})


// Mock Nuxt composables
vi.mock('#app/composables/toast', () => ({
  useToast: vi.fn(() => ({
    add: vi.fn()
  }))
}))

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn()
}

// comprehensive API mocking
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
      getAll: vi.fn(() => ({
        data: ref([]),
        isLoading: false,
        error: null,
        refetch: vi.fn()
      })),
      useGetByIdQuery: vi.fn(() => ({
        data: { value: null },
        isLoading: { value: false },
        status: { value: 'success' },
        error: { value: null },
        refetch: vi.fn()
      })),
      useGetPeriodVariationByStatusQuery: vi.fn(() => ({
        data: { value: { currentPeriod: 150, previousPeriod: 120, percentageChange: 25 } },
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
      })),
      useDeleteMutation: vi.fn(() => ({
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isLoading: { value: false },
        error: { value: null }
      })),
      getPeriodVariationByStatus: vi.fn(() => ({
        currentPeriod: 150,
        previousPeriod: 120,
        percentageChange: 25
      }))
    },
    users: {
      useGetAllQuery: vi.fn(() => ({
        data: { value: { data: [], total: 0, page: 1, pageSize: 10 } },
        isLoading: { value: false },
        status: { value: 'success' },
        error: { value: null },
        refetch: vi.fn()
      })),
      useGetAllByRolesQuery: vi.fn(() => ({
        data: { value: { data: [] } },
        isLoading: false,
        error: null
      })),
      getAllByRoles: () => ({ data: ref({ data: [] }), isLoading: false, error: null })
    },
    business: {
      useGetAllQuery: vi.fn(() => ({
        data: { value: { data: [], total: 0, page: 1, pageSize: 10 } },
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
      })),
      useDeleteMutation: vi.fn(() => ({
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isLoading: { value: false },
        error: { value: null }
      }))
    },
    projects: {
      useGetAllQuery: vi.fn(() => ({
        data: { value: { data: [], total: 0, page: 1, pageSize: 10 } },
        isLoading: { value: false },
        status: { value: 'success' },
        error: { value: null },
        refetch: vi.fn()
      })),
      getAll: vi.fn(() => ({
        data: ref([]),
        isLoading: false,
        error: null,
        refetch: vi.fn()
      })),
      useStoreMutation: vi.fn(() => ({
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isLoading: { value: false },
        error: { value: null }
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
      })),
      useDeleteMutation: vi.fn(() => ({
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isLoading: { value: false },
        error: { value: null }
      })),
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
