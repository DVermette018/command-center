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

  // Mock fetch globally
  global.fetch = vi.fn()
  global.$fetch = vi.fn()
  global.useFetch = vi.fn()
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
global.ref = vi.fn((initialValue) => {
  let _value = initialValue
  return {
    get value() { return _value },
    set value(newValue) { _value = newValue },
    _rawValue: initialValue,
    _shallow: false,
    __v_isRef: true,
    __v_isShallow: false
  }
})

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
global.resolveComponent = vi.fn((name) => name)
global.getCurrentInstance = vi.fn(() => null)
global.inject = vi.fn()
global.provide = vi.fn()

// Mock date formatting functions
global.df = {
  format: vi.fn((date, format) => {
    if (!date) return ''
    const d = new Date(date)
    if (format === 'MMM dd, yyyy') return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
    if (format === 'yyyy-MM-dd') return d.toISOString().split('T')[0]
    return d.toLocaleDateString()
  })
}

global.$dt = vi.fn((date) => ({
  format: vi.fn((format) => global.df.format(date, format))
}))

// Mock date-fns functions more robustly
vi.mock('date-fns', () => ({
  format: vi.fn((date, formatStr) => {
    const d = new Date(date)
    if (formatStr === 'MMM dd, yyyy') return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
    return d.toLocaleDateString()
  }),
  eachDayOfInterval: vi.fn((interval) => {
    if (!interval?.start || !interval?.end) return []
    const start = new Date(interval.start)
    const end = new Date(interval.end)
    if (start > end) throw new Error('Invalid date range')
    const days = []
    const current = new Date(start)
    while (current <= end) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    return days
  }),
  differenceInDays: vi.fn((end, start) => Math.round((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24))),
  subDays: vi.fn((date, amount) => {
    const result = new Date(date)
    result.setDate(result.getDate() - amount)
    return result
  }),
  subWeeks: vi.fn((date, amount) => {
    const result = new Date(date)
    result.setDate(result.getDate() - (amount * 7))
    return result
  }),
  subMonths: vi.fn((date, amount) => {
    const result = new Date(date)
    result.setMonth(result.getMonth() - amount)
    return result
  }),
  subYears: vi.fn((date, amount) => {
    const result = new Date(date)
    result.setFullYear(result.getFullYear() - amount)
    return result
  }),
  startOfToday: vi.fn(() => new Date()),
  endOfDay: vi.fn((date) => {
    const result = new Date(date)
    result.setHours(23, 59, 59, 999)
    return result
  })
}))

// Mock the critical missing function that causes qupdate error
global.queuePostFlushCb = vi.fn()
global.queueJob = vi.fn()
global.queuePreFlushCb = vi.fn()
global.qupdate = vi.fn()
global.queueUpdate = vi.fn()

// Mock keyboard event handling
global.KeyboardEvent = class extends Event {
  constructor(type, options = {}) {
    super(type, options)
    this.key = options.key || ''
    this.code = options.code || ''
    this.keyCode = options.keyCode || 0
    this.which = options.which || 0
    this.altKey = options.altKey || false
    this.ctrlKey = options.ctrlKey || false
    this.metaKey = options.metaKey || false
    this.shiftKey = options.shiftKey || false
    this.repeat = options.repeat || false
  }
}

// Mock Event constructor for other event types
global.Event = class Event {
  constructor(type, options = {}) {
    this.type = type
    this.bubbles = options.bubbles || false
    this.cancelable = options.cancelable || false
    this.target = null
    this.currentTarget = null
    this.defaultPrevented = false
  }
  
  preventDefault() {
    this.defaultPrevented = true
  }
  
  stopPropagation() {}
  stopImmediatePropagation() {}
}

global.useNuxtApp = vi.fn(() => ({
  $trpc: vi.fn()
}))
global.navigateTo = vi.fn()

// Mock Vue Router composables - these need to be globals for the composable to access them
global.useRoute = vi.fn(() => ({
  params: {},
  query: {},
  path: '/',
  fullPath: '/',
  hash: '',
  matched: [],
  meta: {},
  name: 'index',
  redirectedFrom: undefined
}))

global.useRouter = vi.fn(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  go: vi.fn(),
  back: vi.fn(),
  forward: vi.fn()
}))

// Mock Nuxt/Vue specific utilities
global.defineShortcuts = vi.fn()
global.useAsyncData = vi.fn()
global.useLazyAsyncData = vi.fn()
global.useLazyFetch = vi.fn()
global.refreshCookie = vi.fn()
global.createError = vi.fn()
global.showError = vi.fn()
global.clearError = vi.fn()
global.isNuxtError = vi.fn()
global.callOnce = vi.fn()

// Mock VueUse composables
global.useClipboard = vi.fn(() => ({
  copy: vi.fn(),
  copied: { value: false },
  text: { value: '' },
  isSupported: true
}))

global.useMouse = vi.fn(() => ({
  x: { value: 0 },
  y: { value: 0 }
}))

global.useWindowSize = vi.fn(() => ({
  width: { value: 1920 },
  height: { value: 1080 }
}))

global.useLocalStorage = vi.fn((key, defaultValue) => ref(defaultValue))
global.useSessionStorage = vi.fn((key, defaultValue) => ref(defaultValue))

// Mock form validation utilities
global.useVuelidate = vi.fn(() => ({
  $invalid: false,
  $error: false,
  $errors: [],
  $touch: vi.fn(),
  $reset: vi.fn()
}))

// Mock UI state management
global.useModal = vi.fn(() => ({
  isOpen: ref(false),
  open: vi.fn(),
  close: vi.fn(),
  toggle: vi.fn()
}))

global.useDisclosure = vi.fn(() => ({
  isOpen: ref(false),
  open: vi.fn(),
  close: vi.fn(),
  toggle: vi.fn()
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

// Configure Vue Test Utils globally - minimal mocks
config.global.mocks = {
  $trpc: vi.fn(),
  $dt: vi.fn((date) => ({
    format: vi.fn((format) => global.df.format(date, format))
  })),
  df: {
    format: vi.fn((date, format) => {
      if (!date) return ''
      const d = new Date(date)
      if (format === 'MMM dd, yyyy') return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
      if (format === 'yyyy-MM-dd') return d.toISOString().split('T')[0]
      return d.toLocaleDateString()
    })
  },
  useToast: vi.fn(() => ({
    add: vi.fn()
  })),
  useNuxtApp: vi.fn(() => ({
    $trpc: vi.fn()
  })),
  navigateTo: vi.fn()
}

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

// Global stubs for common UI components  
config.global.stubs = {
  UButton: {
    template: '<button @click="$emit(\'click\')" @keydown="$emit(\'keydown\', $event)" tabindex="0" class="select ghost" :class="{ \'data-[state=open]:bg-elevated\': true }"><slot /></button>',
    emits: ['click', 'keydown'],
    props: ['variant', 'class', 'disabled', 'aria-label', 'data-testid']
  },
  UModal: {
    template: '<div v-if="open" role="dialog" aria-modal="true" tabindex="-1"><slot name="header" /><slot name="body" /><slot /></slot name="footer" /></div>',
    props: ['open', 'modelValue'],
    emits: ['update:open', 'update:modelValue']
  },
  UForm: {
    template: '<form @submit.prevent="$emit(\"submit\", { data: state })" @keydown="handleKeydown"><slot /></form>',
    props: ['schema', 'state'],
    emits: ['submit', 'error'],
    methods: {
      handleKeydown(event) {
        if (event.key === 'Enter' && event.target.type !== 'textarea') {
          this.$emit('submit', { data: this.state })
        }
      }
    }
  },
  UPageGrid: {
    template: '<div data-testid="page-grid" class="grid lg:grid-cols-4"><slot /></div>',
    props: ['class']
  },
  UPageCard: {
    template: `
      <div 
        data-testid="page-card"
        :data-icon="icon"
        :data-title="title"
        :data-to="to"
        class="page-card"
        @click="$emit('click')"
      >
        <div class="header"><slot name="header" /></div>
        <div class="body"><slot /></div>
      </div>
    `,
    props: ['icon', 'title', 'ui', 'class', 'to', 'variant'],
    emits: ['click']
  },
  UFormField: {
    template: '<div class="form-field"><label><slot name="label" /></label><slot /></div>'
  },
  UInput: {
    template: '<input v-bind="$attrs" @input="$emit(\"input\", $event.target.value)" @focus="$emit(\"focus\")" @blur="$emit(\"blur\")" tabindex="0" />',
    emits: ['input', 'focus', 'blur']
  },
  USelect: {
    template: `
      <select 
        :value="modelValue"
        @change="handleChange" 
        @focus="$emit('focus')" 
        @blur="$emit('blur')" 
        tabindex="0"
        class="select ghost data-[state=open]:bg-elevated"
        :class="[variant, $attrs.class]"
      >
        <option 
          v-for="(item, index) in computedItems" 
          :key="index" 
          :value="typeof item === 'string' ? item : item.value"
        >
          {{ typeof item === 'string' ? item : item.label }}
        </option>
      </select>
    `,
    props: ['items', 'modelValue', 'variant', 'ui', 'class', 'trailingIcon'],
    emits: ['change', 'focus', 'blur', 'update:modelValue'],
    computed: {
      computedItems() {
        return this.items || []
      }
    },
    methods: {
      handleChange(event) {
        const value = event.target.value
        this.$emit('change', value)
        this.$emit('update:modelValue', value)
      }
    }
  },
  USeparator: {
    template: '<hr />'
  },
  UTextarea: {
    template: '<textarea @input="$emit(\"input\", $event.target.value)" @focus="$emit(\"focus\")" @blur="$emit(\"blur\")" tabindex="0"></textarea>',
    emits: ['input', 'focus', 'blur']
  },
  UTable: {
    template: `
      <div data-testid="table">
        <div v-if="loading">Loading...</div>
        <table v-else role="table" tabindex="0">
          <thead v-if="columns">
            <tr>
              <th v-for="column in columns" :key="column.key">{{ column.label }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in rows" :key="index" @click="$emit('select', row)">
              <td v-for="column in columns" :key="column.key">
                {{ row[column.key] }}
              </td>
            </tr>
            <slot />
          </tbody>
        </table>
        <div class="table-footer">{{ rows?.length || 0 }} of {{ rows?.length || 0 }} row(s) selected.</div>
      </div>
    `,
    props: ['columns', 'rows', 'loading', 'modelValue'],
    emits: ['select', 'update:modelValue']
  },
  UBadge: {
    template: '<span data-testid="badge" :data-color="color" :class="variant" class="badge"><slot /></span>',
    props: ['color', 'class', 'variant']
  },
  UDropdown: {
    template: '<div class="dropdown"><slot /></div>'
  },
  UIcon: {
    template: '<span class="icon"></span>'
  },
  UCard: {
    template: '<div class="card"><slot /></div>'
  },
  UContainer: {
    template: '<div class="container"><slot /></div>'
  },
  UCommandPalette: {
    template: '<div class="command-palette"><slot /></div>'
  },
  DatePicker: {
    template: '<input type="date" @change="$emit(\"update:modelValue\", $event.target.value)" tabindex="0" />',
    props: ['modelValue'],
    emits: ['update:modelValue']
  }
}

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

global.CustomEvent = class MockCustomEvent extends CustomEvent {
  constructor(type, eventInitDict) {
    super(type, eventInitDict)
  }
}

// Enhanced event creation for tests
global.createTestEvent = (type, options = {}) => {
  try {
    return new Event(type, options)
  } catch (e) {
    // Fallback for older test environments
    const event = document.createEvent('Event')
    event.initEvent(type, options.bubbles || true, options.cancelable || true)
    return event
  }
}

// Mock Date objects and formatting utilities
global.Date.prototype.toDate = function() {
  return this
}

// Mock date formatter
global.$dt = vi.fn((date) => ({
  format: vi.fn((pattern) => '2024-01-01 10:00:00'),
  toISOString: vi.fn(() => '2024-01-01T10:00:00.000Z'),
  getTime: vi.fn(() => 1704110400000)
}))

global.df = {
  format: vi.fn(() => '2024-01-01 10:00:00')
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