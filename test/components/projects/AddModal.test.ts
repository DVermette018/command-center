import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountComponent, mockFetchResponse, getByTestId } from '../../utils'
import { createMockProject, createMockUser } from '../../factories'
import AddModal from '~/components/projects/AddModal.vue'
import { CalendarDate } from '@internationalized/date'

// Mock the API composable
const mockCreateMutation = {
  mutate: vi.fn(),
  isPending: ref(false),
  isError: ref(false),
  error: ref(null)
}

// Mock project managers data
const mockProjectManagers = [
  createMockUser({
    id: 'manager1',
    firstName: 'John',
    lastName: 'Doe',
    roles: ['PROJECT_MANAGER']
  }),
  createMockUser({
    id: 'manager2',
    firstName: 'Jane',
    lastName: 'Smith',
    roles: ['DEVELOPER']
  })
]

vi.mock('~/api', () => ({
  useApi: () => ({
    projects: {
      create: () => mockCreateMutation
    },
    users: {
      getAllByRoles: () => ({
        data: ref({
          data: mockProjectManagers,
          pagination: { total: 2 }
        }),
        error: ref(null)
      })
    }
  })
}))

// Mock useToast
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

describe('ProjectAddModal', () => {
  const customerId = 'test-customer-id'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders trigger button correctly', () => {
    const wrapper = mountComponent(AddModal, {
      props: { customerId }
    })

    const button = wrapper.find('button')
    expect(button.exists()).toBe(true)
    expect(button.text()).toContain('Nuevo Proyecto')
  })

  it('opens modal when trigger button is clicked', async () => {
    const wrapper = mountComponent(AddModal, {
      props: { customerId }
    })

    const button = wrapper.find('button')
    await button.trigger('click')

    // Modal should be open
    const modal = wrapper.find('div[role="dialog"]')
    expect(modal.exists()).toBe(true)
    expect(wrapper.text()).toContain('Nuevo Proyecto')
  })

  it('displays form fields correctly', async () => {
    const wrapper = mountComponent(AddModal, {
      props: { customerId }
    })

    // Open modal
    await wrapper.find('button').trigger('click')

    // Check that key form fields exist
    expect(wrapper.find('input[placeholder="Ej: Rediseño de sitio web"]').exists()).toBe(true)
    expect(wrapper.find('select[placeholder="Seleccione el tipo"]').exists()).toBe(true)
    expect(wrapper.find('select[placeholder="Seleccione un gerente"]').exists()).toBe(true)
  })

  it('validates required fields', async () => {
    const wrapper = mountComponent(AddModal, {
      props: { customerId }
    })

    // Open modal
    await wrapper.find('button').trigger('click')

    // Try to submit without filling required fields
    const submitButton = wrapper.find('button[type="submit"]')
    await submitButton.trigger('click')

    // Should show validation errors and not call mutation
    expect(mockCreateMutation.mutate).not.toHaveBeenCalled()
    expect(mockToast.add).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Error de validación',
        color: 'error'
      })
    )
  })

  it('populates project managers dropdown', async () => {
    const wrapper = mountComponent(AddModal, {
      props: { customerId }
    })

    // Open modal
    await wrapper.find('button').trigger('click')

    // Check project managers dropdown
    const managerSelect = wrapper.find('select[placeholder="Seleccione un gerente"]')
    const options = managerSelect.findAll('option')

    expect(options.length).toBeGreaterThan(1)
    expect(options[1].text).toContain('John Doe')
    expect(options[2].text).toContain('Jane Smith')
  })

  it('submits form with valid data', async () => {
    const wrapper = mountComponent(AddModal, {
      props: { customerId }
    })

    const mockProject = createMockProject()

    // Mock successful API response
    mockCreateMutation.mutate.mockImplementation((data, callbacks) => {
      callbacks?.onSuccess?.(mockProject)
    })

    // Open modal
    await wrapper.find('button').trigger('click')

    // Fill form with valid data
    const nameInput = wrapper.find('input[placeholder="Ej: Rediseño de sitio web"]')
    await nameInput.setValue('Test Project')

    const typeSelect = wrapper.find('select[placeholder="Seleccione el tipo"]')
    await typeSelect.setValue('WEBSITE')

    const managerSelect = wrapper.find('select[placeholder="Seleccione un gerente"]')
    await managerSelect.setValue('manager1')

    // Add date picker interactions (these are more complex with DatePicker)
    const startDatePicker = wrapper.findComponent({ name: 'DatePicker' })
    const today = new CalendarDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate())
    await startDatePicker.vm.$emit('update:modelValue', today)

    // Submit form
    const form = wrapper.find('form')
    await form.trigger('submit')

    // Should call mutation with correct data
    expect(mockCreateMutation.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        customerId,
        name: 'Test Project',
        type: 'WEBSITE',
        projectManagerId: 'manager1',
        startDate: expect.any(Date)
      }),
      expect.any(Object)
    )
  })

  it('shows success toast on successful submission', async () => {
    const wrapper = mountComponent(AddModal, {
      props: { customerId }
    })

    const mockProject = createMockProject()

    // Mock successful API response
    mockCreateMutation.mutate.mockImplementation((data, callbacks) => {
      callbacks?.onSuccess?.(mockProject)
    })

    // Open modal and fill form
    await wrapper.find('button').trigger('click')
    await wrapper.find('input[placeholder="Ej: Rediseño de sitio web"]').setValue('Test Project')
    await wrapper.find('select[placeholder="Seleccione el tipo"]').setValue('WEBSITE')

    // Submit form
    const form = wrapper.find('form')
    await form.trigger('submit')

    // Should show success toast
    expect(mockToast.add).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Proyecto creado',
        color: 'success',
        icon: 'i-lucide-check'
      })
    )
  })

  it('shows error toast on submission failure', async () => {
    const wrapper = mountComponent(AddModal, {
      props: { customerId }
    })

    const error = new Error('API Error')

    // Mock API error
    mockCreateMutation.mutate.mockImplementation((data, callbacks) => {
      callbacks?.onError?.(error)
    })

    // Open modal and fill form
    await wrapper.find('button').trigger('click')
    await wrapper.find('input[placeholder="Ej: Rediseño de sitio web"]').setValue('Test Project')
    await wrapper.find('select[placeholder="Seleccione el tipo"]').setValue('WEBSITE')

    // Submit form
    const form = wrapper.find('form')
    await form.trigger('submit')

    // Should show error toast
    expect(mockToast.add).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Error',
        description: 'No se pudo crear el proyecto',
        color: 'error',
        icon: 'i-lucide-x'
      })
    )
  })

  it('resets form when modal closes', async () => {
    const wrapper = mountComponent(AddModal, {
      props: { customerId }
    })

    // Open modal and fill form
    await wrapper.find('button').trigger('click')
    await wrapper.find('input[placeholder="Ej: Rediseño de sitio web"]').setValue('Test Project')

    // Close modal
    const cancelButton = wrapper.find('button[label="Cancelar"]')
    await cancelButton.trigger('click')

    // Reopen modal
    await wrapper.find('button').trigger('click')

    // Form should be reset
    const nameInput = wrapper.find('input[placeholder="Ej: Rediseño de sitio web"]')
    expect(nameInput.element.value).toBe('')
  })

  it('handles date validation', async () => {
    const wrapper = mountComponent(AddModal, {
      props: { customerId }
    })

    // Open modal
    await wrapper.find('button').trigger('click')

    // Add target end date before start date
    const startDatePicker = wrapper.findAllComponents({ name: 'DatePicker' })[0]
    const endDatePicker = wrapper.findAllComponents({ name: 'DatePicker' })[1]

    const today = new CalendarDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate())
    const lastMonth = new CalendarDate(
      today.year,
      today.month - 1,
      today.day
    )

    await startDatePicker.vm.$emit('update:modelValue', today)
    await endDatePicker.vm.$emit('update:modelValue', lastMonth)

    // Submit form and check validation
    const submitButton = wrapper.find('button[type="submit"]')
    await submitButton.trigger('click')

    expect(wrapper.text()).toContain('La fecha objetivo debe ser posterior a la fecha de inicio')
    expect(mockCreateMutation.mutate).not.toHaveBeenCalled()
  })

  it('has proper accessibility attributes', async () => {
    const wrapper = mountComponent(AddModal, {
      props: { customerId }
    })

    // Open modal
    await wrapper.find('button').trigger('click')

    // Check form labels and accessibility
    const nameInput = wrapper.find('input[placeholder="Ej: Rediseño de sitio web"]')
    expect(nameInput.attributes('aria-label')).toBeDefined()

    // Check required field indicators
    const requiredFields = wrapper.findAll('[required]')
    expect(requiredFields.length).toBeGreaterThan(0)
  })
})
