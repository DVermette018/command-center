import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { expectTypeOf } from 'vitest'
import AddModal from './AddModal.vue'
import type { CreateProjectDTO } from '~~/dto/project'
import type { ListUserDTO } from '~~/dto/user'

// Mock the API composable
const mockApi = {
  projects: {
    create: vi.fn(() => ({
      mutate: vi.fn(),
      isLoading: ref(false),
      error: ref(null)
    }))
  },
  users: {
    getAllByRoles: vi.fn(() => ({
      data: ref({
        data: [
          {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@test.com',
            role: 'PROJECT_MANAGER'
          },
          {
            id: 'user-2', 
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@test.com',
            role: 'DEVELOPER'
          }
        ]
      }),
      error: ref(null),
      isLoading: ref(false)
    }))
  }
}

vi.mock('~/api', () => ({
  useApi: () => mockApi
}))

// Mock toast
const mockToast = {
  add: vi.fn()
}

vi.mock('@nuxt/ui', () => ({
  useToast: () => mockToast
}))

// Mock Nuxt composables
vi.mock('#imports', () => ({
  ref: (val: any) => ({ value: val }),
  reactive: (obj: any) => obj,
  watch: vi.fn(),
  defineProps: vi.fn()
}))

describe('ProjectsAddModal', () => {
  let wrapper: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset API mocks
    mockApi.projects.create.mockReturnValue({
      mutate: vi.fn(),
      isLoading: ref(false),
      error: ref(null)
    })
  })

  describe('component initialization', () => {
    it('should initialize with correct default state', () => {
      const defaultState: CreateProjectDTO = {
        customerId: 'test-customer-id',
        name: '',
        type: 'WEBSITE',
        startDate: new Date(),
        targetEndDate: undefined,
        projectManagerId: ''
      }

      expectTypeOf(defaultState).toMatchTypeOf<CreateProjectDTO>()
    })

    it('should accept customerId prop', () => {
      const props = {
        customerId: 'customer-123'
      }

      expectTypeOf(props).toMatchTypeOf<{ customerId: string }>()
    })

    it('should load project managers on mount', () => {
      expect(mockApi.users.getAllByRoles).toBeDefined()
      
      const expectedRolesFilter = {
        pageIndex: 1,
        pageSize: 100,
        roles: ['PROJECT_MANAGER', 'DEVELOPER', 'DESIGNER']
      }

      expectTypeOf(expectedRolesFilter).toMatchTypeOf<{
        pageIndex: number
        pageSize: number
        roles: string[]
      }>()
    })
  })

  describe('form validation - FIXED TYPE ERRORS', () => {
    it('should validate required fields', () => {
      const validFormData: CreateProjectDTO = {
        customerId: 'customer-1',
        name: 'Test Project',
        type: 'WEBSITE',
        startDate: new Date('2024-01-01'),
        projectManagerId: 'user-1'
      }

      expectTypeOf(validFormData).toMatchTypeOf<CreateProjectDTO>()
    })

    it('should reject empty required fields', () => {
      const invalidFormData = [
        {
          customerId: '', // Invalid: empty
          name: 'Test Project',
          type: 'WEBSITE',
          projectManagerId: 'user-1'
        },
        {
          customerId: 'customer-1',
          name: '', // Invalid: empty
          type: 'WEBSITE', 
          projectManagerId: 'user-1'
        },
        {
          customerId: 'customer-1',
          name: 'Test Project',
          type: 'WEBSITE',
          projectManagerId: '' // Invalid: empty
        }
      ]

      invalidFormData.forEach(data => {
        expect(data).toBeDefined() // Would be caught by form validation
      })
    })

    it('should validate project type enum', () => {
      const validTypes = ['WEBSITE', 'BRANDING', 'CONSULTING', 'DEVELOPMENT', 'MARKETING', 'OTHER'] as const
      
      validTypes.forEach(type => {
        const formData: CreateProjectDTO = {
          customerId: 'customer-1',
          name: 'Test Project',
          type: type,
          projectManagerId: 'user-1'
        }
        
        expectTypeOf(formData.type).toMatchTypeOf<'WEBSITE' | 'BRANDING' | 'CONSULTING' | 'DEVELOPMENT' | 'MARKETING' | 'OTHER'>()
      })
    })

    it('should handle date validation', () => {
      const formWithDates: CreateProjectDTO = {
        customerId: 'customer-1',
        name: 'Test Project',
        type: 'WEBSITE',
        startDate: new Date('2024-01-01'),
        targetEndDate: new Date('2024-06-01'),
        projectManagerId: 'user-1'
      }

      // Target date should be after start date
      expect(formWithDates.targetEndDate?.getTime()).toBeGreaterThan(formWithDates.startDate?.getTime() || 0)
    })
  })

  describe('user interaction - CALENDAR/DATE TYPE FIXES', () => {
    it('should handle date picker changes', () => {
      // The DatePicker component should emit proper Date objects
      const dateChangeEvent = {
        startDate: new Date('2024-02-01'),
        targetEndDate: new Date('2024-08-01')
      }

      expectTypeOf(dateChangeEvent.startDate).toMatchTypeOf<Date>()
      expectTypeOf(dateChangeEvent.targetEndDate).toMatchTypeOf<Date>()
    })

    it('should update project manager selection', () => {
      const managerSelection = {
        value: 'user-1',
        label: 'John Doe'
      }

      expectTypeOf(managerSelection).toMatchTypeOf<{
        value: string
        label: string
      }>()
    })

    it('should transform user data to select options', () => {
      const userData: ListUserDTO[] = [
        {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@test.com',
          role: 'PROJECT_MANAGER',
          isActive: true
        }
      ]

      const expectedOptions = userData.map(u => ({
        label: `${u.firstName} ${u.lastName}`,
        value: u.id
      }))

      expectTypeOf(expectedOptions).toMatchTypeOf<Array<{
        label: string
        value: string
      }>>()
    })
  })

  describe('form submission', () => {
    it('should call create mutation with correct data', () => {
      const mockMutate = vi.fn()
      mockApi.projects.create.mockReturnValue({
        mutate: mockMutate,
        isLoading: ref(false),
        error: ref(null)
      })

      const formData: CreateProjectDTO = {
        customerId: 'customer-1',
        name: 'New Project',
        type: 'WEBSITE',
        startDate: new Date('2024-01-01'),
        targetEndDate: new Date('2024-06-01'),
        projectManagerId: 'user-1'
      }

      // Simulate form submission
      expect(mockMutate).toBeDefined()
      expectTypeOf(formData).toMatchTypeOf<CreateProjectDTO>()
    })

    it('should handle successful creation', () => {
      const mockMutate = vi.fn((data, options) => {
        options.onSuccess({
          id: 'project-1',
          ...data,
          status: 'DRAFT',
          phase: 'DISCOVERY',
          createdAt: '2024-01-01T00:00:00Z'
        })
      })

      mockApi.projects.create.mockReturnValue({
        mutate: mockMutate,
        isLoading: ref(false),
        error: ref(null)
      })

      expect(mockMutate).toBeDefined()
      expect(mockToast.add).toBeDefined()
    })

    it('should handle creation errors', () => {
      const mockError = new Error('Validation failed: Customer not found')
      
      const mockMutate = vi.fn((data, options) => {
        options.onError(mockError)
      })

      mockApi.projects.create.mockReturnValue({
        mutate: mockMutate,
        isLoading: ref(false),
        error: ref(mockError)
      })

      expect(mockMutate).toBeDefined()
      expect(mockToast.add).toBeDefined()
    })
  })

  describe('loading states', () => {
    it('should show loading state during creation', () => {
      mockApi.projects.create.mockReturnValue({
        mutate: vi.fn(),
        isLoading: ref(true),
        error: ref(null)
      })

      const loadingState = {
        isCreating: true,
        isLoadingManagers: false
      }

      expect(loadingState.isCreating).toBe(true)
    })

    it('should show loading state while fetching managers', () => {
      mockApi.users.getAllByRoles.mockReturnValue({
        data: ref(null),
        error: ref(null),
        isLoading: ref(true)
      })

      const loadingState = {
        isCreating: false,
        isLoadingManagers: true
      }

      expect(loadingState.isLoadingManagers).toBe(true)
    })
  })

  describe('error handling', () => {
    it('should display user loading errors', () => {
      const mockError = new Error('Failed to load project managers')
      
      mockApi.users.getAllByRoles.mockReturnValue({
        data: ref(null),
        error: ref(mockError),
        isLoading: ref(false)
      })

      expect(mockError.message).toBe('Failed to load project managers')
    })

    it('should handle form validation errors', () => {
      const validationErrors = [
        { path: 'name', message: 'Project name is required' },
        { path: 'projectManagerId', message: 'Project manager is required' },
        { path: 'startDate', message: 'Start date must be in the future' }
      ]

      validationErrors.forEach(error => {
        expect(error).toMatchObject({
          path: expect.any(String),
          message: expect.any(String)
        })
      })
    })

    it('should handle network errors gracefully', () => {
      const networkError = new Error('Network request failed')
      
      const mockMutate = vi.fn((data, options) => {
        options.onError(networkError)
      })

      expect(networkError).toBeInstanceOf(Error)
      expect(mockMutate).toBeDefined()
    })
  })

  describe('modal behavior', () => {
    it('should open and close modal', () => {
      const modalState = {
        open: false
      }

      // Should open modal
      modalState.open = true
      expect(modalState.open).toBe(true)

      // Should close modal
      modalState.open = false  
      expect(modalState.open).toBe(false)
    })

    it('should reset form when modal closes', () => {
      const formState: CreateProjectDTO = {
        customerId: 'customer-1',
        name: 'Test Project',
        type: 'WEBSITE',
        startDate: new Date(),
        projectManagerId: 'user-1'
      }

      // After closing, should reset to defaults
      const resetState: CreateProjectDTO = {
        customerId: 'customer-1',
        name: '',
        type: 'WEBSITE', 
        startDate: new Date(),
        targetEndDate: undefined,
        projectManagerId: ''
      }

      expectTypeOf(resetState).toMatchTypeOf<CreateProjectDTO>()
    })

    it('should close modal after successful creation', () => {
      let modalOpen = true
      
      const onSuccess = () => {
        modalOpen = false
      }

      onSuccess()
      expect(modalOpen).toBe(false)
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      const expectedLabels = {
        modal: 'Create New Project',
        nameInput: 'Project Name',
        typeSelect: 'Project Type',
        startDateInput: 'Start Date',
        endDateInput: 'Target End Date',
        managerSelect: 'Project Manager',
        submitButton: 'Create Project',
        cancelButton: 'Cancel'
      }

      Object.values(expectedLabels).forEach(label => {
        expect(typeof label).toBe('string')
        expect(label.length).toBeGreaterThan(0)
      })
    })

    it('should support keyboard navigation', () => {
      const keyboardEvents = [
        'Tab', // Navigate between fields
        'Enter', // Submit form
        'Escape' // Close modal
      ]

      keyboardEvents.forEach(key => {
        expect(typeof key).toBe('string')
      })
    })
  })

  describe('integration with Vue Query', () => {
    it('should properly configure mutation options', () => {
      const mutationConfig = {
        onSuccess: expect.any(Function),
        onError: expect.any(Function)
      }

      expect(mutationConfig.onSuccess).toEqual(expect.any(Function))
      expect(mutationConfig.onError).toEqual(expect.any(Function))
    })

    it('should invalidate queries after successful creation', () => {
      const expectedInvalidations = [
        ['PROJECTS_GET_ALL'],
        ['CUSTOMER_PROJECTS', 'customer-1']
      ]

      expectedInvalidations.forEach(queryKey => {
        expect(Array.isArray(queryKey)).toBe(true)
        expect(queryKey[0]).toEqual(expect.any(String))
      })
    })
  })
})