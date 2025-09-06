import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createMockProject, createMockUser } from '~/test/factories'
import { mockApiResponse } from '~/test/utils'
import ProjectsTable from '~/app/components/projects/Table.vue'

// Mocks
const mockProjects = [
  createMockProject({ 
    name: 'Marketing Website', 
    type: 'WEBSITE',
    status: 'ACTIVE',
    projectManager: createMockUser({ 
      firstName: 'John', 
      lastName: 'Doe' 
    })
  }),
  createMockProject({ 
    name: 'Branding Project', 
    type: 'BRANDING',
    status: 'DRAFT',
    projectManager: createMockUser({ 
      firstName: 'Jane', 
      lastName: 'Smith' 
    })
  })
]

const mockApiClient = {
  projects: {
    getAll: vi.fn().mockImplementation(() => ({
      data: { 
        data: mockProjects, 
        pagination: { total: 2 } 
      },
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

describe('ProjectsTable', () => {
  const customerId = 'test-customer-id'
  let wrapper: ReturnType<typeof mount>

  beforeEach(() => {
    vi.clearAllMocks()
    wrapper = mount(ProjectsTable, {
      props: { customerId },
      global: {
        provide: {
          toast: mockToast
        },
        stubs: ['UTable', 'USelect', 'UDropdownMenu', 'UButton', 'UPagination', 'UKbd']
      }
    })
  })

  afterEach(() => {
    wrapper.unmount()
  })

  // Data Rendering Tests
  it('renders projects from API', async () => {
    await flushPromises()
    expect(wrapper.text()).toContain('Marketing Website')
    expect(wrapper.text()).toContain('Branding Project')
  })

  // Filtering Tests
  it('filters projects by name', async () => {
    await flushPromises()

    const nameInput = wrapper.find('input[placeholder="Filter name..."]')
    await nameInput.setValue('Marketing')
    await nextTick()

    expect(wrapper.text()).toContain('Marketing Website')
    expect(wrapper.text()).not.toContain('Branding Project')
  })

  it('filters projects by status', async () => {
    await flushPromises()

    const statusSelect = wrapper.find('select[placeholder="Filter status"]')
    await statusSelect.setValue('ACTIVE')
    await nextTick()

    expect(wrapper.text()).toContain('Marketing Website')
    expect(wrapper.text()).not.toContain('Branding Project')
  })

  // Pagination Tests
  it('changes page and refetches data', async () => {
    await flushPromises()

    const pagination = wrapper.findComponent({ name: 'UPagination' })
    await pagination.vm.$emit('update:page', 2)

    expect(mockApiClient.projects.getAll).toHaveBeenCalledWith(
      expect.objectContaining({
        pageIndex: 2,
        pageSize: 10
      })
    )
  })

  // Row Selection Tests
  it('handles row selection', async () => {
    await flushPromises()

    const selectAllCheckbox = wrapper.find('input[aria-label="Select all"]')
    await selectAllCheckbox.trigger('click')

    expect(wrapper.text()).toContain('2 of 2 row(s) selected')
  })

  // Row Click Navigation
  it('navigates to project details on row click', async () => {
    await flushPromises()

    const rows = wrapper.findAll('tr')
    await rows[1].trigger('click')

    // We can't directly test navigation, but we can check it was triggered
    expect(wrapper.emitted('select')).toBeTruthy()
  })

  // Error Handling Tests
  it('shows error toast when data fetching fails', async () => {
    mockApiClient.projects.getAll.mockImplementationOnce(() => ({
      data: null,
      isLoading: ref(false),
      status: ref('error'),
      error: ref(new Error('Fetch failed')),
      refetch: vi.fn()
    }))

    wrapper = mount(ProjectsTable, {
      props: { customerId },
      global: {
        provide: {
          toast: mockToast
        },
        stubs: ['UTable', 'USelect', 'UDropdownMenu', 'UButton', 'UPagination', 'UKbd']
      }
    })
    await flushPromises()

    expect(mockToast.add).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Error',
        description: 'Failed to fetch projects',
        color: 'error'
      })
    )
  })

  // Column Visibility Tests
  it('allows toggling column visibility', async () => {
    await flushPromises()

    // Since we can't directly interact with column visibility in this test,
    // we check that the model is updated
    const table = wrapper.findComponent({ name: 'UTable' })
    await table.vm.$emit('update:column-visibility', { name: false })

    // The v-model should update the columnVisibility
    expect(wrapper.vm.columnVisibility).toEqual({ name: false })
  })

  // Batch Action Tests
  it('enables delete action when rows are selected', async () => {
    await flushPromises()

    const selectAllCheckbox = wrapper.find('input[aria-label="Select all"]')
    await selectAllCheckbox.trigger('click')

    const deleteButton = wrapper.find('button[label="Delete"]')
    expect(deleteButton.exists()).toBe(true)
    expect(deleteButton.text()).toContain('2')
  })

  // Accessibility and Interaction Tests
  it('has proper keyboard navigation', async () => {
    await flushPromises()

    const rows = wrapper.findAll('tr')
    expect(rows.length).toBeGreaterThan(0)
    
    // First row should be navigable
    await rows[0].trigger('keydown.enter')
    expect(wrapper.emitted('select')).toBeTruthy()
  })

  // Project Status Badge Tests
  it('displays correct status badges', async () => {
    await flushPromises()

    const statusBadges = wrapper.findAll('div[class*="badge"]')
    expect(statusBadges.length).toBeGreaterThan(0)
    
    const firstBadge = statusBadges[0]
    expect(firstBadge.text().toLowerCase()).toContain('active')
  })
})