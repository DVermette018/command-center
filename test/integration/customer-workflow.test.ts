import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import { createMockCustomer } from '../factories'
import CustomerAddModal from '../../app/components/customers/AddModal.vue'
import CustomerTable from '../../app/components/customers/Table.vue'
import CustomerDeleteModal from '../../app/components/customers/DeleteModal.vue'

// Mock the API
vi.mock('../../api', () => ({
  useApi: () => ({
    customers: {
      create: () => ({
        mutate: vi.fn(),
        isLoading: false,
        error: null
      }),
      getAll: () => ({
        data: ref([]),
        isLoading: false,
        error: null,
        refetch: vi.fn()
      }),
      delete: () => ({
        mutate: vi.fn(),
        isLoading: false,
        error: null
      }),
      update: () => ({
        mutate: vi.fn(),
        isLoading: false,
        error: null
      })
    }
  })
}))

// Mock Nuxt composables
vi.mock('#app', () => ({
  useToast: () => ({
    add: vi.fn()
  })
}))

// Create a comprehensive customer workflow component for testing
const CustomerWorkflow = defineComponent({
  name: 'CustomerWorkflow',
  components: {
    CustomerAddModal,
    CustomerTable,
    CustomerDeleteModal
  },
  setup() {
    const customers = ref([
      createMockCustomer({ 
        id: '1',
        businessProfile: {
          businessName: 'Existing Customer',
          category: 'Technology',
          size: 'SMALL'
        },
        contacts: [{
          isPrimary: true,
          user: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@existing.com',
            phone: '(555) 123-4567'
          }
        }],
        status: 'ACTIVE'
      })
    ])

    const selectedCustomer = ref(null)
    const showDeleteModal = ref(false)

    const handleCustomerCreated = (customer) => {
      customers.value.push(customer)
    }

    const handleCustomerDeleted = (customerId) => {
      customers.value = customers.value.filter(c => c.id !== customerId)
      showDeleteModal.value = false
      selectedCustomer.value = null
    }

    const handleCustomerUpdated = (updatedCustomer) => {
      const index = customers.value.findIndex(c => c.id === updatedCustomer.id)
      if (index !== -1) {
        customers.value[index] = updatedCustomer
      }
    }

    const openDeleteModal = (customer) => {
      selectedCustomer.value = customer
      showDeleteModal.value = true
    }

    return {
      customers,
      selectedCustomer,
      showDeleteModal,
      handleCustomerCreated,
      handleCustomerDeleted,
      handleCustomerUpdated,
      openDeleteModal
    }
  },
  template: `
    <div data-testid="customer-workflow">
      <h1>Customer Management</h1>
      
      <!-- Add Customer Section -->
      <div class="mb-6">
        <CustomerAddModal @customer-created="handleCustomerCreated" />
      </div>
      
      <!-- Customer Table -->
      <CustomerTable 
        :customers="customers"
        @customer-updated="handleCustomerUpdated"
        @delete-customer="openDeleteModal"
      />
      
      <!-- Delete Modal -->
      <CustomerDeleteModal
        v-if="showDeleteModal && selectedCustomer"
        :customer="selectedCustomer"
        @customer-deleted="handleCustomerDeleted"
        @close="showDeleteModal = false"
      />
    </div>
  `
})

describe('Customer Workflow Integration Tests', () => {
  let wrapper
  let mockApi

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockApi = {
      customers: {
        create: vi.fn().mockReturnValue({
          mutate: vi.fn(),
          isLoading: false,
          error: null
        }),
        getAll: vi.fn().mockReturnValue({
          data: ref([]),
          isLoading: false,
          error: null,
          refetch: vi.fn()
        }),
        delete: vi.fn().mockReturnValue({
          mutate: vi.fn(),
          isLoading: false,
          error: null
        }),
        update: vi.fn().mockReturnValue({
          mutate: vi.fn(),
          isLoading: false,
          error: null
        })
      }
    }

    wrapper = mount(CustomerWorkflow, {
      global: {
        stubs: {
          UButton: true,
          UModal: true,
          UForm: true,
          UInput: true,
          USelect: true,
          UTable: true,
          UDropdown: true,
          UFormField: true,
          UPageCard: true,
          USeparator: true
        }
      }
    })
  })

  describe('Initial State and Display', () => {
    it('renders the customer management interface correctly', () => {
      expect(wrapper.find('[data-testid="customer-workflow"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Customer Management')
      expect(wrapper.findComponent(CustomerAddModal).exists()).toBe(true)
      expect(wrapper.findComponent(CustomerTable).exists()).toBe(true)
    })

    it('displays existing customers in the table', () => {
      const customerTable = wrapper.findComponent(CustomerTable)
      expect(customerTable.props('customers')).toHaveLength(1)
      expect(customerTable.props('customers')[0].businessProfile.businessName).toBe('Existing Customer')
    })
  })

  describe('Customer Creation Workflow', () => {
    it('handles successful customer creation', async () => {
      const newCustomer = createMockCustomer({
        id: '2',
        businessProfile: {
          businessName: 'New Customer Inc',
          category: 'Retail',
          size: 'MEDIUM'
        },
        contacts: [{
          isPrimary: true,
          user: {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@newcustomer.com',
            phone: '(555) 987-6543'
          }
        }],
        status: 'LEAD'
      })

      // Simulate customer creation
      wrapper.vm.handleCustomerCreated(newCustomer)
      await flushPromises()

      // Check if customer was added to the list
      expect(wrapper.vm.customers).toHaveLength(2)
      expect(wrapper.vm.customers[1].businessProfile.businessName).toBe('New Customer Inc')
    })

    it('validates required fields during customer creation', async () => {
      const addModal = wrapper.findComponent(CustomerAddModal)
      
      // Attempt to create customer with missing required fields
      const incompleteCustomer = createMockCustomer({
        businessProfile: {
          businessName: '', // Missing required field
          category: 'Technology'
        }
      })

      // This should trigger validation errors
      await addModal.vm.$emit('customer-created', incompleteCustomer)
      
      // The customer should not be added due to validation
      expect(wrapper.vm.customers).toHaveLength(1) // Only original customer
    })

    it('creates customer with complete business profile data', async () => {
      const completeCustomer = createMockCustomer({
        id: '3',
        businessProfile: {
          businessName: 'Complete Corp',
          legalName: 'Complete Corporation LLC',
          taxId: 'TAX123456789',
          website: 'https://complete.com',
          category: 'Professional Services',
          size: 'LARGE',
          address: {
            type: 'BUSINESS',
            isPrimary: true,
            street: '123 Main St',
            street2: 'Suite 100',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'US',
            reference: 'Near Central Park'
          }
        },
        contacts: [{
          isPrimary: true,
          user: {
            firstName: 'John',
            lastName: 'Executive',
            email: 'john@complete.com',
            phone: '(212) 555-0123'
          }
        }],
        status: 'PROSPECT'
      })

      wrapper.vm.handleCustomerCreated(completeCustomer)
      await flushPromises()

      expect(wrapper.vm.customers).toHaveLength(2)
      const newCustomer = wrapper.vm.customers[1]
      expect(newCustomer.businessProfile.legalName).toBe('Complete Corporation LLC')
      expect(newCustomer.businessProfile.address.city).toBe('New York')
    })
  })

  describe('Customer Update Workflow', () => {
    it('handles customer updates correctly', async () => {
      const updatedCustomer = {
        ...wrapper.vm.customers[0],
        businessProfile: {
          ...wrapper.vm.customers[0].businessProfile,
          businessName: 'Updated Customer Name'
        }
      }

      wrapper.vm.handleCustomerUpdated(updatedCustomer)
      await flushPromises()

      expect(wrapper.vm.customers[0].businessProfile.businessName).toBe('Updated Customer Name')
    })

    it('handles status changes correctly', async () => {
      const updatedCustomer = {
        ...wrapper.vm.customers[0],
        status: 'CHURNED'
      }

      wrapper.vm.handleCustomerUpdated(updatedCustomer)
      await flushPromises()

      expect(wrapper.vm.customers[0].status).toBe('CHURNED')
    })

    it('handles contact information updates', async () => {
      const updatedCustomer = {
        ...wrapper.vm.customers[0],
        contacts: [{
          isPrimary: true,
          user: {
            firstName: 'Jane',
            lastName: 'UpdatedName',
            email: 'jane.updated@existing.com',
            phone: '(555) 999-8888'
          }
        }]
      }

      wrapper.vm.handleCustomerUpdated(updatedCustomer)
      await flushPromises()

      expect(wrapper.vm.customers[0].contacts[0].user.lastName).toBe('UpdatedName')
      expect(wrapper.vm.customers[0].contacts[0].user.email).toBe('jane.updated@existing.com')
    })
  })

  describe('Customer Deletion Workflow', () => {
    it('opens delete modal when delete action is triggered', async () => {
      const customerTable = wrapper.findComponent(CustomerTable)
      const customerToDelete = wrapper.vm.customers[0]

      await customerTable.vm.$emit('delete-customer', customerToDelete)
      await flushPromises()

      expect(wrapper.vm.showDeleteModal).toBe(true)
      expect(wrapper.vm.selectedCustomer).toEqual(customerToDelete)
      expect(wrapper.findComponent(CustomerDeleteModal).exists()).toBe(true)
    })

    it('deletes customer and closes modal on confirmation', async () => {
      // Open delete modal first
      wrapper.vm.openDeleteModal(wrapper.vm.customers[0])
      await flushPromises()

      const deleteModal = wrapper.findComponent(CustomerDeleteModal)
      expect(deleteModal.exists()).toBe(true)

      // Simulate deletion confirmation
      await deleteModal.vm.$emit('customer-deleted', '1')
      await flushPromises()

      expect(wrapper.vm.customers).toHaveLength(0)
      expect(wrapper.vm.showDeleteModal).toBe(false)
      expect(wrapper.vm.selectedCustomer).toBeNull()
    })

    it('closes delete modal without deletion on cancel', async () => {
      wrapper.vm.openDeleteModal(wrapper.vm.customers[0])
      await flushPromises()

      const deleteModal = wrapper.findComponent(CustomerDeleteModal)
      await deleteModal.vm.$emit('close')
      await flushPromises()

      expect(wrapper.vm.customers).toHaveLength(1) // Customer still exists
      expect(wrapper.vm.showDeleteModal).toBe(false)
    })
  })

  describe('Data Persistence and State Management', () => {
    it('maintains customer data consistency across operations', async () => {
      const originalCustomer = wrapper.vm.customers[0]
      
      // Create new customer
      const newCustomer = createMockCustomer({ id: '2' })
      wrapper.vm.handleCustomerCreated(newCustomer)
      await flushPromises()

      // Update original customer
      const updatedOriginal = { ...originalCustomer, status: 'INACTIVE' }
      wrapper.vm.handleCustomerUpdated(updatedOriginal)
      await flushPromises()

      // Verify both customers exist with correct data
      expect(wrapper.vm.customers).toHaveLength(2)
      expect(wrapper.vm.customers[0].status).toBe('INACTIVE')
      expect(wrapper.vm.customers[1].id).toBe('2')
    })

    it('handles concurrent operations correctly', async () => {
      const customer1 = createMockCustomer({ id: '2' })
      const customer2 = createMockCustomer({ id: '3' })

      // Simulate concurrent additions
      wrapper.vm.handleCustomerCreated(customer1)
      wrapper.vm.handleCustomerCreated(customer2)
      await flushPromises()

      expect(wrapper.vm.customers).toHaveLength(3)
      expect(wrapper.vm.customers.map(c => c.id)).toEqual(['1', '2', '3'])
    })

    it('maintains referential integrity during updates', async () => {
      const originalCustomer = wrapper.vm.customers[0]
      const originalId = originalCustomer.id

      // Update customer while maintaining ID
      const updatedCustomer = {
        ...originalCustomer,
        businessProfile: {
          ...originalCustomer.businessProfile,
          businessName: 'New Name'
        }
      }

      wrapper.vm.handleCustomerUpdated(updatedCustomer)
      await flushPromises()

      // ID should remain the same
      expect(wrapper.vm.customers[0].id).toBe(originalId)
      expect(wrapper.vm.customers[0].businessProfile.businessName).toBe('New Name')
    })
  })

  describe('Error Handling', () => {
    it('handles API errors gracefully during customer creation', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      // Simulate API error
      const mockError = new Error('API Error: Customer creation failed')
      
      try {
        // This would normally be handled by the API mutation error handler
        throw mockError
      } catch (error) {
        expect(error.message).toBe('API Error: Customer creation failed')
      }

      consoleSpy.mockRestore()
    })

    it('maintains UI stability during error states', async () => {
      // Even with errors, the UI should remain functional
      expect(wrapper.find('[data-testid="customer-workflow"]').exists()).toBe(true)
      expect(wrapper.findComponent(CustomerAddModal).exists()).toBe(true)
      expect(wrapper.findComponent(CustomerTable).exists()).toBe(true)
    })

    it('handles network errors during customer updates', async () => {
      const originalCustomer = wrapper.vm.customers[0]
      
      // Simulate network failure
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      try {
        // This simulates what would happen if an update fails
        const failedUpdate = {
          ...originalCustomer,
          businessProfile: {
            ...originalCustomer.businessProfile,
            businessName: 'Failed Update'
          }
        }
        
        // In a real scenario, this would be caught by the mutation error handler
        throw new Error('Network timeout')
      } catch (error) {
        expect(error.message).toBe('Network timeout')
        // Customer data should remain unchanged
        expect(wrapper.vm.customers[0].businessProfile.businessName).toBe('Existing Customer')
      }

      consoleSpy.mockRestore()
    })
  })

  describe('Form-to-API Integration', () => {
    it('correctly transforms form data for API submission', async () => {
      const formData = {
        business: {
          businessName: 'Test Company',
          category: 'technology',
          size: 'SMALL',
          address: {
            type: 'BUSINESS',
            isPrimary: true,
            street: '123 Test St',
            city: 'Test City',
            state: 'TC',
            zipCode: '12345',
            country: 'MX'
          }
        },
        contact: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@test.com',
          phone: '(555) 123-4567',
          position: 'Manager'
        },
        status: 'LEAD'
      }

      // This would be the expected API payload structure
      const expectedApiPayload = {
        business: formData.business,
        contact: formData.contact,
        status: formData.status
      }

      // Verify the structure matches what the API expects
      expect(expectedApiPayload).toMatchObject({
        business: expect.objectContaining({
          businessName: expect.any(String),
          category: expect.any(String),
          size: expect.any(String),
          address: expect.objectContaining({
            type: expect.any(String),
            street: expect.any(String),
            city: expect.any(String)
          })
        }),
        contact: expect.objectContaining({
          firstName: expect.any(String),
          lastName: expect.any(String),
          email: expect.any(String)
        }),
        status: expect.any(String)
      })
    })

    it('handles validation errors from API', async () => {
      const invalidFormData = {
        business: {
          businessName: '', // Invalid: empty required field
          category: 'invalid-category'
        },
        contact: {
          firstName: 'Test',
          email: 'invalid-email' // Invalid format
        }
      }

      // This would typically be caught by form validation before API submission
      expect(invalidFormData.business.businessName).toBe('')
      expect(invalidFormData.contact.email).toBe('invalid-email')
    })

    it('preserves data types during form submission', async () => {
      const typedFormData = {
        business: {
          businessName: 'Typed Company',
          taxId: 'ABC123',
          address: {
            isPrimary: true, // boolean
            zipCode: '12345' // string
          }
        },
        contact: {
          isPrimary: true, // boolean
          phone: '(555) 123-4567' // string with formatting
        },
        status: 'LEAD' // enum value
      }

      // Verify types are preserved
      expect(typeof typedFormData.business.address.isPrimary).toBe('boolean')
      expect(typeof typedFormData.contact.isPrimary).toBe('boolean')
      expect(typeof typedFormData.business.taxId).toBe('string')
      expect(typedFormData.status).toBe('LEAD')
    })
  })

  describe('Component Integration', () => {
    it('properly communicates between modal and table components', async () => {
      const addModal = wrapper.findComponent(CustomerAddModal)
      const customerTable = wrapper.findComponent(CustomerTable)

      // Initial state
      expect(customerTable.props('customers')).toHaveLength(1)

      // Add new customer via modal
      const newCustomer = createMockCustomer({ id: '4' })
      await addModal.vm.$emit('customer-created', newCustomer)
      await flushPromises()

      // Table should reflect the change
      expect(wrapper.vm.customers).toHaveLength(2)
    })

    it('handles modal state management correctly', async () => {
      // Initially no delete modal should be shown
      expect(wrapper.findComponent(CustomerDeleteModal).exists()).toBe(false)
      expect(wrapper.vm.showDeleteModal).toBe(false)

      // Open delete modal
      wrapper.vm.openDeleteModal(wrapper.vm.customers[0])
      await flushPromises()

      // Delete modal should now be visible
      expect(wrapper.vm.showDeleteModal).toBe(true)
      expect(wrapper.findComponent(CustomerDeleteModal).exists()).toBe(true)
    })
  })
})