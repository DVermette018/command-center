import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AddModal from './AddModal.vue'
import type { CreateCustomerSchema } from '~~/dto/customer'

// Mock the composables
const mockMutate = vi.fn()
const mockApi = {
  customers: {
    create: () => ({
      mutate: mockMutate,
      mutateAsync: vi.fn(),
      isLoading: false,
      error: null
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

describe('CustomersAddModal', () => {
  let wrapper: any

  beforeEach(() => {
    wrapper = mount(AddModal, {
      global: {
        stubs: {
          UButton: true,
          UModal: true,
          UForm: true,
          UPageCard: true,
          UFormField: true,
          UInput: true,
          USelect: true,
          USeparator: true,
          UTextarea: true
        }
      }
    })
    vi.clearAllMocks()
  })

  describe('Form Validation', () => {
    it('should initialize with correct default state', () => {
      expect(wrapper.vm.state.business.businessName).toBe('')
      expect(wrapper.vm.state.business.ownerName).toBe('')
      expect(wrapper.vm.state.status).toBe('LEAD')
      expect(wrapper.vm.state.business.address.country).toBe('MX')
      expect(wrapper.vm.state.contact.isPrimary).toBe(true)
    })

    it('should have required fields properly marked', () => {
      const formFields = wrapper.findAll('[required]')
      expect(formFields.length).toBeGreaterThan(0)
    })

    it('should validate business name is required', async () => {
      const invalidData: CreateCustomerSchema = {
        business: {
          businessName: '', // Required field empty
          ownerName: 'John Doe',
          category: 'technology',
          address: {
            type: 'BUSINESS',
            isPrimary: true,
            street: '123 Main St',
            street2: '',
            city: 'Test City',
            state: 'Test State',
            zipCode: '12345',
            country: 'MX',
            reference: ''
          }
        },
        status: 'LEAD',
        contact: {
          id: '',
          customerId: '',
          email: 'contact@test.com',
          firstName: 'John',
          lastName: 'Doe',
          isPrimary: true
        }
      }

      await wrapper.vm.onSubmit({ data: invalidData })
      expect(mockMutate).not.toHaveBeenCalled()
    })

    it('should validate owner name is required', async () => {
      const invalidData: CreateCustomerSchema = {
        business: {
          businessName: 'Test Company',
          ownerName: '', // Required field empty
          category: 'technology',
          address: {
            type: 'BUSINESS',
            isPrimary: true,
            street: '123 Main St',
            street2: '',
            city: 'Test City',
            state: 'Test State',
            zipCode: '12345',
            country: 'MX',
            reference: ''
          }
        },
        status: 'LEAD',
        contact: {
          id: '',
          customerId: '',
          email: 'contact@test.com',
          firstName: 'John',
          lastName: 'Doe',
          isPrimary: true
        }
      }

      await wrapper.vm.onSubmit({ data: invalidData })
      expect(mockMutate).not.toHaveBeenCalled()
    })
  })

  describe('Form Submission', () => {
    it('should submit valid customer data', async () => {
      const validData: CreateCustomerSchema = {
        business: {
          businessName: 'Test Company',
          ownerName: 'John Doe',
          category: 'technology',
          address: {
            type: 'BUSINESS',
            isPrimary: true,
            street: '123 Main St',
            street2: 'Suite 100',
            city: 'Test City',
            state: 'Test State',
            zipCode: '12345',
            country: 'MX',
            reference: 'Near the mall'
          }
        },
        status: 'LEAD',
        contact: {
          id: '',
          customerId: '',
          email: 'contact@test.com',
          firstName: 'John',
          lastName: 'Doe',
          isPrimary: true
        }
      }

      mockMutate.mockImplementation((data, options) => {
        options.onSuccess({ id: '1', ...data })
      })

      await wrapper.vm.onSubmit({ data: validData })

      expect(mockMutate).toHaveBeenCalledWith(validData, expect.any(Object))
    })

    it('should handle submission errors gracefully', async () => {
      const validData: CreateCustomerSchema = {
        business: {
          businessName: 'Test Company',
          ownerName: 'John Doe',
          category: 'technology',
          address: {
            type: 'BUSINESS',
            isPrimary: true,
            street: '123 Main St',
            street2: '',
            city: 'Test City',
            state: 'Test State',
            zipCode: '12345',
            country: 'MX',
            reference: ''
          }
        },
        status: 'LEAD',
        contact: {
          id: '',
          customerId: '',
          email: 'contact@test.com',
          firstName: 'John',
          lastName: 'Doe',
          isPrimary: true
        }
      }

      const error = new Error('Network error')
      mockMutate.mockImplementation((data, options) => {
        options.onError(error)
      })

      await wrapper.vm.onSubmit({ data: validData })

      expect(mockMutate).toHaveBeenCalledWith(validData, expect.any(Object))
    })
  })

  describe('Form Reset', () => {
    it('should reset form when modal closes', async () => {
      // Set some data
      wrapper.vm.state.business.businessName = 'Test Company'
      wrapper.vm.state.business.ownerName = 'John Doe'
      wrapper.vm.state.contact.email = 'test@example.com'

      // Close modal
      wrapper.vm.open = false
      await wrapper.vm.$nextTick()

      // Check form is reset
      expect(wrapper.vm.state.business.businessName).toBe('')
      expect(wrapper.vm.state.business.ownerName).toBe('')
      expect(wrapper.vm.state.contact.email).toBe('')
    })

    it('should reset form after successful submission', async () => {
      const validData: CreateCustomerSchema = {
        business: {
          businessName: 'Test Company',
          ownerName: 'John Doe',
          category: 'technology',
          address: {
            type: 'BUSINESS',
            isPrimary: true,
            street: '123 Main St',
            street2: '',
            city: 'Test City',
            state: 'Test State',
            zipCode: '12345',
            country: 'MX',
            reference: ''
          }
        },
        status: 'LEAD',
        contact: {
          id: '',
          customerId: '',
          email: 'contact@test.com',
          firstName: 'John',
          lastName: 'Doe',
          isPrimary: true
        }
      }

      mockMutate.mockImplementation((data, options) => {
        options.onSuccess({ id: '1', ...data })
      })

      await wrapper.vm.onSubmit({ data: validData })

      expect(wrapper.vm.state.business.businessName).toBe('')
      expect(wrapper.vm.state.business.ownerName).toBe('')
      expect(wrapper.vm.open).toBe(false)
    })
  })

  describe('Options Data', () => {
    it('should have correct status options', () => {
      expect(wrapper.vm.statusOptions).toEqual([
        { label: 'Prospecto', value: 'LEAD' },
        { label: 'Cliente Potencial', value: 'PROSPECT' },
        { label: 'Cliente Activo', value: 'ACTIVE' },
        { label: 'Inactivo', value: 'INACTIVE' },
        { label: 'Perdido', value: 'CHURNED' }
      ])
    })

    it('should have correct company size options', () => {
      expect(wrapper.vm.companySizeOptions).toContain(
        { label: 'Micro (1-10 empleados)', value: 'MICRO' }
      )
      expect(wrapper.vm.companySizeOptions).toContain(
        { label: 'Empresa (1000+ empleados)', value: 'ENTERPRISE' }
      )
    })

    it('should have comprehensive industry options', () => {
      expect(wrapper.vm.industryOptions.length).toBeGreaterThan(10)
      expect(wrapper.vm.industryOptions).toContain(
        { label: 'Tecnología', value: 'technology' }
      )
    })

    it('should have source options for lead tracking', () => {
      expect(wrapper.vm.sourceOptions).toContain(
        { label: 'Sitio Web', value: 'website' }
      )
      expect(wrapper.vm.sourceOptions).toContain(
        { label: 'Referencia', value: 'referral' }
      )
    })
  })
})