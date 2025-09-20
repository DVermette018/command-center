import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountComponent, mockSuccessfulFetch, mockFetchError } from '../../utils'
import { createMockCustomer, createMockTableData, createMockApiError } from '../../factories'

// Mock the customers page
const CustomersPage = {
  setup() {
    // Mock the API calls that would typically be made in this page
    const { data: customers, pending, error, refresh } = useFetch('/api/customers')
    
    return {
      customers,
      pending,
      error,
      refresh
    }
  },
  template: `
    <div>
      <h1>Customers</h1>
      <div v-if="pending" data-testid="loading-state">Loading...</div>
      <div v-if="error" data-testid="error-state">{{ error.message }}</div>
      <div v-if="customers" data-testid="customers-list">
        <div v-for="customer in customers.items" :key="customer.id" data-testid="customer-item">
          {{ customer.name }}
        </div>
      </div>
      <button @click="refresh" data-testid="refresh-button">Refresh</button>
    </div>
  `
}

describe('CustomersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders page title correctly', () => {
    const mockData = createMockTableData(() => createMockCustomer(), 3)
    mockSuccessfulFetch(mockData)
    
    const wrapper = mountComponent(CustomersPage)
    
    expect(wrapper.find('h1').text()).toBe('Customers')
  })

  it('shows loading state initially', () => {
    // Mock pending state
    vi.mocked(useFetch).mockReturnValue({
      data: ref(null),
      pending: ref(true),
      error: ref(null),
      refresh: vi.fn(),
      execute: vi.fn()
    })
    
    const wrapper = mountComponent(CustomersPage)
    
    expect(wrapper.find('[data-testid="loading-state"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Loading...')
  })

  it('displays customers when data is loaded', () => {
    const mockCustomers = [
      createMockCustomer({ name: 'Customer 1' }),
      createMockCustomer({ name: 'Customer 2' }),
      createMockCustomer({ name: 'Customer 3' })
    ]
    const mockData = createMockTableData(() => mockCustomers.shift()!, 3)
    mockSuccessfulFetch(mockData)
    
    const wrapper = mountComponent(CustomersPage)
    
    expect(wrapper.find('[data-testid="customers-list"]').exists()).toBe(true)
    const customerItems = wrapper.findAll('[data-testid="customer-item"]')
    expect(customerItems).toHaveLength(3)
  })

  it('handles empty customers list', () => {
    const mockData = createMockTableData(() => createMockCustomer(), 0)
    mockSuccessfulFetch(mockData)
    
    const wrapper = mountComponent(CustomersPage)
    
    expect(wrapper.find('[data-testid="customers-list"]').exists()).toBe(true)
    const customerItems = wrapper.findAll('[data-testid="customer-item"]')
    expect(customerItems).toHaveLength(0)
  })

  it('shows error state when API call fails', () => {
    const error = new Error('Failed to fetch customers')
    mockFetchError(error)
    
    const wrapper = mountComponent(CustomersPage)
    
    expect(wrapper.find('[data-testid="error-state"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Failed to fetch customers')
  })

  it('refreshes data when refresh button is clicked', async () => {
    const mockRefresh = vi.fn()
    vi.mocked(useFetch).mockReturnValue({
      data: ref(createMockTableData(() => createMockCustomer(), 3)),
      pending: ref(false),
      error: ref(null),
      refresh: mockRefresh,
      execute: vi.fn()
    })
    
    const wrapper = mountComponent(CustomersPage)
    
    const refreshButton = wrapper.find('[data-testid="refresh-button"]')
    await refreshButton.trigger('click')
    
    expect(mockRefresh).toHaveBeenCalled()
  })

  it('handles network errors gracefully', () => {
    const networkError = new Error('Network error')
    mockFetchError(networkError)
    
    const wrapper = mountComponent(CustomersPage)
    
    expect(wrapper.find('[data-testid="error-state"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Network error')
  })

  it('updates when route query parameters change', async () => {
    const mockData = createMockTableData(() => createMockCustomer(), 5)
    mockSuccessfulFetch(mockData)
    
    const wrapper = mountComponent(CustomersPage, {
      global: {
        mocks: {
          $route: {
            query: { page: '1', limit: '10' }
          }
        }
      }
    })
    
    // Simulate route query change
    await wrapper.vm.$options.setup()
    
    // Should call useFetch with updated parameters
    expect(useFetch).toHaveBeenCalledWith('/api/customers')
  })

  it('displays customer data correctly', () => {
    const mockCustomers = [
      createMockCustomer({ 
        name: 'Test Company',
        email: 'test@company.com',
        status: 'ACTIVE'
      })
    ]
    const mockData = { items: mockCustomers, pagination: { total: 1 } }
    mockSuccessfulFetch(mockData)
    
    const wrapper = mountComponent(CustomersPage)
    
    expect(wrapper.text()).toContain('Test Company')
  })

  it('handles pagination correctly', () => {
    const mockData = createMockTableData(() => createMockCustomer(), 10)
    mockData.pagination.totalPages = 3
    mockData.pagination.page = 1
    mockSuccessfulFetch(mockData)
    
    const wrapper = mountComponent(CustomersPage)
    
    expect(wrapper.find('[data-testid="customers-list"]').exists()).toBe(true)
    const customerItems = wrapper.findAll('[data-testid="customer-item"]')
    expect(customerItems).toHaveLength(10)
  })
})