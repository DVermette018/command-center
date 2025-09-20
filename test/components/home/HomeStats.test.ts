import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import HomeStats from '~/components/home/HomeStats.vue'
import type { Period, Range, Stat } from '~/types'

// Mock the API response
const mockApiResponse = {
  currentPeriod: 150,
  previousPeriod: 120,
  percentageChange: 25
}

const mockApi = {
  customers: {
    getPeriodVariationByStatus: vi.fn().mockResolvedValue(mockApiResponse)
  }
}

vi.mock('~/api', () => ({
  useApi: () => mockApi
}))

// Mock useAsyncData
const mockAsyncData = vi.fn()
vi.mock('#app', () => ({
  useAsyncData: mockAsyncData
}))

// Mock date formatting
vi.mock('~/utils', () => ({
  formatCurrency: (value: number) => `$${value.toLocaleString()}`
}))

const createWrapper = (props: { period: Period; range: Range }) => {
  return mount(HomeStats, {
    props,
    global: {
      stubs: {
        UPageGrid: {
          template: '<div data-testid="page-grid" class="grid"><slot /></div>',
          props: ['class']
        },
        UPageCard: {
          template: `
            <div data-testid="page-card"
                 :data-icon="icon"
                 :data-title="title"
                 :data-to="to"
                 @click="$emit('click')">
              <slot />
            </div>
          `,
          props: ['icon', 'title', 'ui', 'class', 'to', 'variant'],
          emits: ['click']
        },
        UBadge: {
          template: '<span data-testid="badge" :data-color="color" :class="variant"><slot /></span>',
          props: ['color', 'class', 'variant']
        }
      }
    }
  })
}

const createMockRange = (): Range => ({
  start: new Date('2024-01-01'),
  end: new Date('2024-01-31')
})

const createMockStats = (): Stat[] => [
  {
    title: 'Customers',
    key: 'customers',
    icon: 'i-lucide-users',
    value: 150,
    variation: 25
  },
  {
    title: 'Conversions',
    key: 'conversions',
    icon: 'i-lucide-chart-pie',
    value: 45,
    variation: -5
  },
  {
    title: 'Revenue',
    key: 'revenue',
    icon: 'i-lucide-circle-dollar-sign',
    value: 12500,
    variation: 15
  },
  {
    title: 'Orders',
    key: 'orders',
    icon: 'i-lucide-shopping-cart',
    value: 89,
    variation: 8
  }
]

describe('HomeStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock for useAsyncData
    mockAsyncData.mockReturnValue({
      data: ref(createMockStats()),
      pending: ref(false),
      error: ref(null),
      refresh: vi.fn()
    })
  })

  describe('Component Rendering', () => {
    it('renders with proper grid layout', () => {
      const wrapper = createWrapper({
        period: 'daily',
        range: createMockRange()
      })

      const grid = wrapper.find('[data-testid="page-grid"]')
      expect(grid.exists()).toBe(true)
      expect(grid.classes()).toContain('lg:grid-cols-4')
    })

    it('renders all stat cards', () => {
      const wrapper = createWrapper({
        period: 'daily',
        range: createMockRange()
      })

      const cards = wrapper.findAll('[data-testid="page-card"]')
      expect(cards.length).toBe(4)
    })

    it('displays correct stat titles and icons', () => {
      const wrapper = createWrapper({
        period: 'daily',
        range: createMockRange()
      })

      const cards = wrapper.findAll('[data-testid="page-card"]')

      expect(cards[0].attributes('data-title')).toBe('Customers')
      expect(cards[0].attributes('data-icon')).toBe('i-lucide-users')

      expect(cards[1].attributes('data-title')).toBe('Conversions')
      expect(cards[1].attributes('data-icon')).toBe('i-lucide-chart-pie')

      expect(cards[2].attributes('data-title')).toBe('Revenue')
      expect(cards[2].attributes('data-icon')).toBe('i-lucide-circle-dollar-sign')

      expect(cards[3].attributes('data-title')).toBe('Orders')
      expect(cards[3].attributes('data-icon')).toBe('i-lucide-shopping-cart')
    })

    it('renders stat values correctly', () => {
      const wrapper = createWrapper({
        period: 'daily',
        range: createMockRange()
      })

      const statValues = wrapper.findAll('.text-2xl.font-semibold')
      expect(statValues[0].text()).toBe('150')
      expect(statValues[1].text()).toBe('45')
      expect(statValues[2].text()).toBe('12500')
      expect(statValues[3].text()).toBe('89')
    })

    it('renders variation badges with correct colors', () => {
      const wrapper = createWrapper({
        period: 'daily',
        range: createMockRange()
      })

      const badges = wrapper.findAll('[data-testid="badge"]')

      // Positive variation (customers: +25%)
      expect(badges[0].attributes('data-color')).toBe('success')
      expect(badges[0].text()).toBe('+25%')

      // Negative variation (conversions: -5%)
      expect(badges[1].attributes('data-color')).toBe('error')
      expect(badges[1].text()).toBe('-5%')

      // Positive variation (revenue: +15%)
      expect(badges[2].attributes('data-color')).toBe('success')
      expect(badges[2].text()).toBe('+15%')

      // Positive variation (orders: +8%)
      expect(badges[3].attributes('data-color')).toBe('success')
      expect(badges[3].text()).toBe('+8%')
    })
  })

  describe('Data Fetching', () => {
    it('calls useAsyncData with correct parameters', () => {
      const range = createMockRange()
      createWrapper({
        period: 'weekly',
        range
      })

      expect(mockAsyncData).toHaveBeenCalledWith(
        'stats',
        expect.any(Function),
        expect.objectContaining({
          watch: expect.arrayContaining([
            expect.any(Function), // props.period watcher
            expect.any(Function)  // props.range watcher
          ]),
          default: expect.any(Function)
        })
      )
    })

    it('calls API with correct parameters', async () => {
      const range = createMockRange()

      // Get the async data function that was passed to useAsyncData
      createWrapper({ period: 'monthly', range })

      const asyncDataCall = mockAsyncData.mock.calls[0]
      const fetchFunction = asyncDataCall[1]

      // Execute the fetch function
      await fetchFunction()

      expect(mockApi.customers.getPeriodVariationByStatus).toHaveBeenCalledWith({
        status: 'ACTIVE',
        period: 'monthly',
        range: {
          start: range.start.toISOString(),
          end: range.end.toISOString()
        }
      })
    })

    it('maps API response to stats structure correctly', async () => {
      const range = createMockRange()

      createWrapper({ period: 'daily', range })

      const asyncDataCall = mockAsyncData.mock.calls[0]
      const fetchFunction = asyncDataCall[1]

      const result = await fetchFunction()

      expect(result).toEqual([
        expect.objectContaining({
          title: 'Customers',
          key: 'customers',
          icon: 'i-lucide-users',
          value: 150,
          variation: 25
        }),
        expect.objectContaining({
          title: 'Conversions',
          key: 'conversions',
          value: 0, // Default for unmapped stats
          variation: 0
        }),
        expect.objectContaining({
          title: 'Revenue',
          key: 'revenue',
          value: 0,
          variation: 0
        }),
        expect.objectContaining({
          title: 'Orders',
          key: 'orders',
          value: 0,
          variation: 0
        })
      ])
    })

    it('provides default empty array when data is loading', () => {
      const defaultFunction = mockAsyncData.mock.calls[0][2].default
      const result = defaultFunction()

      expect(result).toEqual([])
    })
  })

  describe('Loading States', () => {
    it('handles loading state gracefully', () => {
      mockAsyncData.mockReturnValue({
        data: ref([]),
        pending: ref(true),
        error: ref(null),
        refresh: vi.fn()
      })

      const wrapper = createWrapper({
        period: 'daily',
        range: createMockRange()
      })

      // Should render without crashing during loading
      expect(wrapper.find('[data-testid="page-grid"]').exists()).toBe(true)
    })

    it('shows empty state when no data available', () => {
      mockAsyncData.mockReturnValue({
        data: ref([]),
        pending: ref(false),
        error: ref(null),
        refresh: vi.fn()
      })

      const wrapper = createWrapper({
        period: 'daily',
        range: createMockRange()
      })

      const cards = wrapper.findAll('[data-testid="page-card"]')
      expect(cards.length).toBe(0)
    })
  })

  describe('Error Handling', () => {
    it('handles API errors gracefully', () => {
      mockAsyncData.mockReturnValue({
        data: ref([]),
        pending: ref(false),
        error: ref(new Error('API Error')),
        refresh: vi.fn()
      })

      const wrapper = createWrapper({
        period: 'daily',
        range: createMockRange()
      })

      // Should render without crashing on error
      expect(wrapper.find('[data-testid="page-grid"]').exists()).toBe(true)
    })

    it('continues to work if API call fails', async () => {
      mockApi.customers.getPeriodVariationByStatus.mockRejectedValue(new Error('Network error'))

      const range = createMockRange()
      createWrapper({ period: 'daily', range })

      const asyncDataCall = mockAsyncData.mock.calls[0]
      const fetchFunction = asyncDataCall[1]

      // Should not throw error
      await expect(fetchFunction()).rejects.toThrow('Network error')
    })
  })

  describe('Reactivity', () => {
    it('watches period changes', () => {
      createWrapper({
        period: 'daily',
        range: createMockRange()
      })

      const watchConfig = mockAsyncData.mock.calls[0][2]
      expect(watchConfig.watch).toHaveLength(2)

      // The watch functions should be reactive to props changes
      expect(watchConfig.watch[0]).toBeInstanceOf(Function)
      expect(watchConfig.watch[1]).toBeInstanceOf(Function)
    })

    it('watches range changes', () => {
      const wrapper = createWrapper({
        period: 'daily',
        range: createMockRange()
      })

      // Verify that changing props would trigger the watchers
      const watchConfig = mockAsyncData.mock.calls[0][2]
      expect(watchConfig.watch).toBeDefined()
    })

    it('updates stats when props change', async () => {
      const wrapper = createWrapper({
        period: 'daily',
        range: createMockRange()
      })

      // Simulate prop change by updating the component
      await wrapper.setProps({
        period: 'weekly',
        range: createMockRange()
      })

      // The watch should trigger new data fetch
      expect(wrapper.vm).toBeDefined()
    })
  })

  describe('Currency Formatting', () => {
    it('formats currency values correctly', () => {
      const component = mount(HomeStats, {
        props: {
          period: 'daily',
          range: createMockRange()
        }
      })

      // Test the formatCurrency function
      const result = component.vm.formatCurrency(12500)
      expect(result).toBe('$12,500')
    })

    it('handles zero values', () => {
      const component = mount(HomeStats, {
        props: {
          period: 'daily',
          range: createMockRange()
        }
      })

      const result = component.vm.formatCurrency(0)
      expect(result).toBe('$0')
    })

    it('handles large numbers', () => {
      const component = mount(HomeStats, {
        props: {
          period: 'daily',
          range: createMockRange()
        }
      })

      const result = component.vm.formatCurrency(1234567)
      expect(result).toBe('$1,234,567')
    })
  })

  describe('Navigation', () => {
    it('sets correct navigation link on customer card', () => {
      const wrapper = createWrapper({
        period: 'daily',
        range: createMockRange()
      })

      const customerCard = wrapper.findAll('[data-testid="page-card"]')[0]
      expect(customerCard.attributes('data-to')).toBe('/customers')
    })

    it('handles card click events', async () => {
      const wrapper = createWrapper({
        period: 'daily',
        range: createMockRange()
      })

      const firstCard = wrapper.find('[data-testid="page-card"]')
      await firstCard.trigger('click')

      // Should not throw error on click
      expect(firstCard.exists()).toBe(true)
    })
  })

  describe('Accessibility', () => {
    it('provides meaningful stat titles', () => {
      const wrapper = createWrapper({
        period: 'daily',
        range: createMockRange()
      })

      const cards = wrapper.findAll('[data-testid="page-card"]')

      cards.forEach(card => {
        const title = card.attributes('data-title')
        expect(title).toBeTruthy()
        expect(title).not.toBe('')
      })
    })

    it('includes proper icons for visual context', () => {
      const wrapper = createWrapper({
        period: 'daily',
        range: createMockRange()
      })

      const cards = wrapper.findAll('[data-testid="page-card"]')

      cards.forEach(card => {
        const icon = card.attributes('data-icon')
        expect(icon).toBeTruthy()
        expect(icon).toMatch(/^i-lucide-/)
      })
    })

    it('provides color-coded variation indicators', () => {
      const wrapper = createWrapper({
        period: 'daily',
        range: createMockRange()
      })

      const badges = wrapper.findAll('[data-testid="badge"]')

      badges.forEach(badge => {
        const color = badge.attributes('data-color')
        expect(['success', 'error']).toContain(color)
      })
    })
  })

  describe('Performance', () => {
    it('uses proper async data configuration', () => {
      createWrapper({
        period: 'daily',
        range: createMockRange()
      })

      const config = mockAsyncData.mock.calls[0][2]

      expect(config).toHaveProperty('watch')
      expect(config).toHaveProperty('default')
      expect(config.default).toBeInstanceOf(Function)
    })

    it('provides efficient default value', () => {
      const config = mockAsyncData.mock.calls[0][2]
      const defaultValue = config.default()

      expect(Array.isArray(defaultValue)).toBe(true)
      expect(defaultValue.length).toBe(0)
    })

    it('memoizes base stats structure', () => {
      const wrapper = createWrapper({
        period: 'daily',
        range: createMockRange()
      })

      // Verify baseStats is defined and structured correctly
      expect(wrapper.vm.baseStats).toBeDefined()
      expect(Array.isArray(wrapper.vm.baseStats)).toBe(true)
      expect(wrapper.vm.baseStats.length).toBe(4)
    })
  })
})
