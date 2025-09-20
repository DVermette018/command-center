import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createMockCustomer } from '../../factories'
import { mockApiResponse } from '../../utils'
import CustomersTable from '~/components/customers/Table.vue'

// Mocks
const mockCustomers = [
  createMockCustomer({
    businessProfile: { businessName: 'Acme Corp' },
    status: 'ACTIVE'
  }),
  createMockCustomer({
    businessProfile: { businessName: 'Globex Inc' },
    status: 'LEAD'
  })
]

const mockApiClient = {
  customers: {
    getAll: vi.fn().mockImplementation(() => ({
      data: { data: mockCustomers, pagination: { total: 2 } },
      isLoading: ref(false),
      status: ref('success'),
      error: ref(null),
      refetch: vi.fn()
    }))
  }
}

vi.mock('~/api', () => ({
  useApi: () => mockApiClient
}))

const mockToast = {
  add: vi.fn()
}

vi.mock('@nuxt/ui', async () => {
  const actual = await vi.importActual('@nuxt/ui')
  return {
    ...actual,
    useToast: () => mockToast
  }
})

describe('CustomersTable', () => {
  let wrapper: ReturnType<typeof mount>

  beforeEach(() => {
    vi.clearAllMocks()
    wrapper = mount(CustomersTable, {
      global: {
        provide: {
          toast: mockToast
        },
        stubs: ['UTable', 'USelect', 'UDropdownMenu', 'UButton', 'UKbd']
      }
    })
  })

  afterEach(() => {
    wrapper.unmount()
  })

  // Data Rendering Tests
  it('renders customers from API', async () => {
    await flushPromises()
    expect(wrapper.text()).toContain('Acme Corp')
    expect(wrapper.text()).toContain('Globex Inc')
  })

  // Filtering Tests
  it('filters customers by name', async () => {
    const nameInput = wrapper.find('input[placeholder="Filter name..."]')
    await nameInput.setValue('Acme')
    await nextTick()

    expect(wrapper.text()).toContain('Acme Corp')
    expect(wrapper.text()).not.toContain('Globex Inc')
  })

  it('filters customers by status', async () => {
    const statusSelect = wrapper.find('select')
    await statusSelect.setValue('LEAD')
    await nextTick()

    expect(wrapper.text()).toContain('Globex Inc')
    expect(wrapper.text()).not.toContain('Acme Corp')
  })

  // Pagination Tests
  it('changes page and refetches data', async () => {
    const pagination = wrapper.find('button[aria-label="Next page"]')
    await pagination.trigger('click')

    expect(mockApiClient.customers.getAll).toHaveBeenCalledWith(
      expect.objectContaining({
        pageIndex: 2,
        pageSize: 10
      })
    )
  })

  // Row Selection Tests
  it('handles row selection', async () => {
    const selectAllCheckbox = wrapper.find('input[aria-label="Select all"]')
    await selectAllCheckbox.trigger('click')

    expect(wrapper.text()).toContain('2 of 2 row(s) selected')
  })

  // Error Handling Tests
  it('shows error toast when data fetching fails', async () => {
    mockApiClient.customers.getAll.mockImplementationOnce(() => ({
      data: null,
      isLoading: ref(false),
      status: ref('error'),
      error: ref(new Error('Fetch failed')),
      refetch: vi.fn()
    }))

    wrapper = mount(CustomersTable)
    await flushPromises()

    expect(mockToast.add).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Error',
        description: 'Failed to fetch customers',
        color: 'error'
      })
    )
  })

  // Column Visibility Tests
  it('allows toggling column visibility', async () => {
    const displayButton = wrapper.find('button[label="Display"]')
    await displayButton.trigger('click')

    // Simulate selecting a column to hide
    const columnToggle = wrapper.find('input[type="checkbox"]')
    await columnToggle.trigger('click')

    // Check that the column is toggled
    expect(wrapper.vm.$refs.table.tableApi.getColumn).toHaveBeenCalled()
  })

  // Batch Action Tests
  it('enables delete action when rows are selected', async () => {
    const selectAllCheckbox = wrapper.find('input[aria-label="Select all"]')
    await selectAllCheckbox.trigger('click')

    const deleteButton = wrapper.find('button[label="Delete"]')
    expect(deleteButton.exists()).toBe(true)
    expect(deleteButton.text()).toContain('2')
  })

  // Accessibility and Interaction Tests
  it('has proper keyboard navigation', async () => {
    const rows = wrapper.findAll('tr')
    expect(rows.length).toBeGreaterThan(0)

    // First row should be navigable
    await rows[0].trigger('keydown.enter')
    expect(wrapper.emitted('navigate')).toBeTruthy()
  })
})
