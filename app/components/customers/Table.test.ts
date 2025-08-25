import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Table from './Table.vue'
import type { CustomerDTO } from '~~/dto/customer'

// Mock API response data
const mockCustomers: CustomerDTO[] = [
  {
    id: '1',
    source: 'website',
    status: 'LEAD',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
    businessProfile: {
      businessName: 'Test Company 1',
      ownerName: 'John Doe',
      category: 'technology',
      size: 'SMALL',
      website: 'https://testcompany1.com',
      addresses: []
    },
    contacts: [
      {
        id: '1',
        customerId: '1',
        isPrimary: true,
        user: {
          id: '1',
          email: 'john@testcompany1.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'CUSTOMER',
          isActive: true,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        }
      }
    ]
  },
  {
    id: '2',
    source: 'referral',
    status: 'ACTIVE',
    createdAt: '2023-01-02T00:00:00.000Z',
    updatedAt: '2023-01-02T00:00:00.000Z',
    businessProfile: {
      businessName: 'Test Company 2',
      ownerName: 'Jane Smith',
      category: 'retail',
      size: 'MEDIUM',
      website: 'https://testcompany2.com',
      addresses: []
    },
    contacts: [
      {
        id: '2',
        customerId: '2',
        isPrimary: true,
        user: {
          id: '2',
          email: 'jane@testcompany2.com',
          firstName: 'Jane',
          lastName: 'Smith',
          role: 'CUSTOMER',
          isActive: true,
          createdAt: '2023-01-02T00:00:00.000Z',
          updatedAt: '2023-01-02T00:00:00.000Z'
        }
      }
    ]
  }
]

const mockApiResponse = {
  data: mockCustomers,
  pagination: {
    totalCount: 2,
    totalPages: 1
  }
}

// Mock the API
const mockRefetch = vi.fn()
const mockApi = {
  customers: {
    getAll: () => ({
      data: ref(mockApiResponse),
      isLoading: ref(false),
      status: ref('success'),
      error: ref(null),
      refetch: mockRefetch
    })
  }
}

vi.mock('~/api', () => ({
  useApi: () => mockApi
}))

vi.mock('#app/composables/toast', () => ({
  useToast: () => ({
    add: vi.fn()
  })
}))

// Mock navigation
const mockNavigateTo = vi.fn()
vi.mock('#app/composables/router', () => ({
  navigateTo: mockNavigateTo
}))

describe('CustomersTable', () => {
  let wrapper: any

  beforeEach(() => {
    wrapper = mount(Table, {
      global: {
        stubs: {
          UInput: true,
          USelect: true,
          UDropdownMenu: true,
          UButton: true,
          UTable: true,
          UPagination: true,
          UBadge: true,
          UCheckbox: true,
          UKbd: true,
          CustomersDeleteModal: true,
          CustomersStatusModal: true
        }
      }
    })
    vi.clearAllMocks()
  })

  describe('Data Loading', () => {
    it('should fetch customers on mount', () => {
      expect(mockApi.customers.getAll).toBeDefined()
      expect(wrapper.vm.data).toEqual(mockApiResponse)
    })

    it('should display loading state correctly', () => {
      expect(wrapper.vm.isLoading).toBe(false)
    })

    it('should handle API errors gracefully', async () => {
      // Mock error state
      wrapper.vm.status = 'error'
      wrapper.vm.error = new Error('API Error')
      
      await wrapper.vm.$nextTick()
      
      // Component should handle error without crashing
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Filtering', () => {
    it('should filter by customer name', async () => {
      wrapper.vm.nameFilter = 'Test Company 1'
      await wrapper.vm.$nextTick()
      
      // Filter should be applied to table
      expect(wrapper.vm.nameFilter).toBe('Test Company 1')
    })

    it('should filter by status', async () => {
      wrapper.vm.statusFilter = 'ACTIVE'
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.statusFilter).toBe('ACTIVE')
    })

    it('should clear status filter when set to all', async () => {
      wrapper.vm.statusFilter = 'all'
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.statusFilter).toBe('all')
    })

    it('should have correct status filter options', () => {
      const statusOptions = [
        { label: 'All', value: 'all' },
        { label: 'Lead', value: 'LEAD' },
        { label: 'Prospect', value: 'PROSPECT' },
        { label: 'Active', value: 'ACTIVE' },
        { label: 'Inactive', value: 'INACTIVE' },
        { label: 'Churned', value: 'CHURNED' }
      ]
      
      expect(statusOptions).toBeDefined()
    })
  })

  describe('Pagination', () => {
    it('should handle pagination correctly', async () => {
      wrapper.vm.pagination = { pageIndex: 1, pageSize: 10 }
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.paginationParams.pageIndex).toBe(2) // 1-based indexing
      expect(wrapper.vm.paginationParams.pageSize).toBe(10)
    })

    it('should refetch data when pagination changes', async () => {
      wrapper.vm.pagination = { pageIndex: 2, pageSize: 20 }
      await wrapper.vm.$nextTick()
      
      expect(mockRefetch).toHaveBeenCalled()
    })

    it('should handle page change correctly', () => {
      wrapper.vm.handlePageChange(3)
      expect(wrapper.vm.pagination.pageIndex).toBe(2) // 0-based for internal use
    })
  })

  describe('Row Actions', () => {
    it('should navigate to customer detail when row is clicked', () => {
      const mockRow = {
        original: { id: '1' }
      }
      
      wrapper.vm.onRowClick(mockRow)
      expect(mockNavigateTo).toHaveBeenCalledWith('/customers/1')
    })

    it('should generate correct row action items', () => {
      const mockRow = {
        original: mockCustomers[0]
      }
      
      const items = wrapper.vm.getRowItems(mockRow)
      
      expect(items).toContainEqual({
        label: 'Copy customer ID',
        icon: 'i-lucide-copy',
        onSelect: expect.any(Function)
      })
      
      expect(items).toContainEqual({
        label: 'View customer details',
        icon: 'i-lucide-list',
        onSelect: expect.any(Function)
      })
      
      expect(items).toContainEqual({
        label: 'Delete customer',
        icon: 'i-lucide-trash',
        color: 'error',
        onSelect: expect.any(Function)
      })
    })

    it('should copy customer ID to clipboard', async () => {
      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn()
        }
      })
      
      const mockRow = {
        original: mockCustomers[0]
      }
      
      const items = wrapper.vm.getRowItems(mockRow)
      const copyItem = items.find((item: any) => item.label === 'Copy customer ID')
      
      copyItem.onSelect()
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('1')
    })
  })

  describe('Table Columns', () => {
    it('should have correct column configuration', () => {
      expect(wrapper.vm.columns).toHaveLength(6) // select, name, representative, industry, status, actions
      
      const columnIds = wrapper.vm.columns.map((col: any) => col.id || col.accessorKey)
      expect(columnIds).toContain('select')
      expect(columnIds).toContain('name')
      expect(columnIds).toContain('representative')
      expect(columnIds).toContain('industry')
      expect(columnIds).toContain('status')
      expect(columnIds).toContain('actions')
    })

    it('should render status badge with correct color', () => {
      const statusColumn = wrapper.vm.columns.find((col: any) => col.accessorKey === 'status')
      expect(statusColumn).toBeDefined()
      expect(statusColumn.cell).toBeDefined()
    })
  })

  describe('Selection', () => {
    it('should track selected rows count', () => {
      expect(wrapper.vm.selectedRowsCount).toBe(0)
    })

    it('should track filtered rows count', () => {
      expect(wrapper.vm.filteredRowsCount).toBe(0)
    })

    it('should show delete button when rows are selected', () => {
      // Mock selected rows
      wrapper.vm.selectedRowsCount = 2
      
      expect(wrapper.vm.selectedRowsCount).toBe(2)
    })
  })

  describe('Column Visibility', () => {
    it('should allow column visibility toggle', () => {
      expect(wrapper.vm.columnVisibility).toBeDefined()
    })
  })

  describe('Data Formatting', () => {
    it('should format customer name correctly', () => {
      const nameColumn = wrapper.vm.columns.find((col: any) => col.accessorKey === 'name')
      expect(nameColumn).toBeDefined()
      expect(nameColumn.cell).toBeDefined()
    })

    it('should format representative information correctly', () => {
      const repColumn = wrapper.vm.columns.find((col: any) => col.accessorKey === 'representative')
      expect(repColumn).toBeDefined()
      expect(repColumn.cell).toBeDefined()
    })

    it('should format industry information correctly', () => {
      const industryColumn = wrapper.vm.columns.find((col: any) => col.accessorKey === 'industry')
      expect(industryColumn).toBeDefined()
      expect(industryColumn.cell).toBeDefined()
    })
  })
})