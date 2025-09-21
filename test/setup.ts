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

  // Mock focus-related properties for accessibility testing
  Object.defineProperty(document, 'activeElement', {
    value: document.body,
    writable: true
  })

  // Override HTMLElement focus method to actually set activeElement
  HTMLElement.prototype.focus = vi.fn(function() {
    Object.defineProperty(document, 'activeElement', {
      value: this,
      writable: true
    })
  })

  // Mock blur to reset activeElement to body
  HTMLElement.prototype.blur = vi.fn(function() {
    Object.defineProperty(document, 'activeElement', {
      value: document.body,
      writable: true
    })
  })

  // Mock HTMLElement properties for focusability
  Object.defineProperty(HTMLElement.prototype, 'tabIndex', {
    get: function() { return this.getAttribute('tabindex') || 0 },
    set: function(value) { this.setAttribute('tabindex', value.toString()) }
  })

  // Mock element visibility and interactability
  Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
    get: function() { return this.parentElement || document.body }
  })

  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    get: function() { return 100 }
  })

  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    get: function() { return 20 }
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


// Mock Nuxt's auto-imports
vi.mock('#app', () => ({
  useNuxtApp: vi.fn(() => ({
    $trpc: vi.fn()
  })),
  navigateTo: vi.fn(),
  createError: vi.fn(),
  useRoute: vi.fn(() => ({
    params: {},
    query: {},
    path: '/',
    fullPath: '/',
    hash: '',
    matched: [],
    meta: {},
    name: 'index',
    redirectedFrom: undefined
  })),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    go: vi.fn(),
    back: vi.fn(),
    forward: vi.fn()
  })),
  useModal: vi.fn(() => ({
    isOpen: ref(false),
    open: vi.fn(),
    close: vi.fn(),
    toggle: vi.fn()
  })),
  useToast: vi.fn(),
  navigate: vi.fn(),
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

// Mock tRPC client - comprehensive API mocking
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
      create: () => ({ mutate: vi.fn(), isLoading: false, error: null }),
      getAll: () => ({
        data: ref([]),
        isLoading: false,
        error: null,
        refetch: vi.fn()
      }),
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
      create: () => ({ mutate: vi.fn(), isLoading: false, error: null }),
      getAll: () => ({
        data: ref([]),
        isLoading: false,
        error: null,
        refetch: vi.fn()
      }),
      update: () => ({
        mutate: vi.fn(),
        isLoading: false,
        error: null
      })
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

// Configure Vue Test Utils with missing utilities
Object.assign(config.global, {
  renderStubDefaultSlot: true,
  stubs: {
    // Keep existing stubs but add default rendering for slots
    transition: true,
    'transition-group': true,
    teleport: true,
    suspense: true
  }
})

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn()
}

// Fix event creation for jsdom
global.Event = class MockEvent extends Event {
  constructor(type, eventInitDict) {
    super(type, eventInitDict)
  }
}

// Also add as a vi mock for modules that import it
vi.mock('~/utils/date', () => ({
  df: {
    format: vi.fn(() => '2024-01-01 10:00:00')
  },
  formatDate: vi.fn(() => '2024-01-01'),
  formatDateTime: vi.fn(() => '2024-01-01 10:00:00')
}))

vi.mock('~/composables/useDate', () => ({
  useDate: vi.fn(() => ({
    df: {
      format: vi.fn(() => '2024-01-01 10:00:00')
    }
  }))
}))

// Mock useDateFormat
global.useDateFormat = vi.fn(() => ({
  value: '2024-01-01 10:00:00'
}))

// Mock date manipulation functions
global.formatDate = vi.fn((date) => '2024-01-01')
global.formatDateTime = vi.fn((date) => '2024-01-01 10:00:00')
global.formatCurrency = vi.fn((value) => `$${value.toLocaleString()}`)

// Add Intl mocks for better cross-environment support
if (!global.Intl) {
  global.Intl = {
    DateTimeFormat: vi.fn(() => ({
      format: vi.fn(() => '2024-01-01')
    })),
    NumberFormat: vi.fn(() => ({
      format: vi.fn((num) => num.toLocaleString())
    }))
  } as any
}

// Mock date-fns functions
vi.mock('date-fns', () => ({
  eachDayOfInterval: vi.fn((interval) => {
    const days = []
    const start = new Date(interval.start)
    const end = new Date(interval.end)

    const current = new Date(start)
    while (current <= end) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    return days
  }),
  differenceInDays: vi.fn((end, start) => {
    const msPerDay = 24 * 60 * 60 * 1000
    return Math.floor((end.getTime() - start.getTime()) / msPerDay)
  }),
  format: vi.fn((date, pattern) => {
    if (pattern === 'yyyy-MM-dd') return '2024-01-01'
    if (pattern === 'MMM d, yyyy') return 'Jan 1, 2024'
    return '2024-01-01 10:00:00'
  }),
  startOfDay: vi.fn((date) => {
    const newDate = new Date(date)
    newDate.setHours(0, 0, 0, 0)
    return newDate
  }),
  endOfDay: vi.fn((date) => {
    const newDate = new Date(date)
    newDate.setHours(23, 59, 59, 999)
    return newDate
  }),
  addDays: vi.fn((date, days) => {
    const newDate = new Date(date)
    newDate.setDate(newDate.getDate() + days)
    return newDate
  }),
  subDays: vi.fn((date, days) => {
    const newDate = new Date(date)
    newDate.setDate(newDate.getDate() - days)
    return newDate
  }),
  isAfter: vi.fn((date1, date2) => date1.getTime() > date2.getTime()),
  isBefore: vi.fn((date1, date2) => date1.getTime() < date2.getTime()),
  isEqual: vi.fn((date1, date2) => date1.getTime() === date2.getTime())
}))
