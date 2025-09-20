import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountComponent, mockFetchResponse, getByTestId } from '../../utils'
import { createMockApiResponse, createMockCustomer } from '../../factories'
import AddModal from '~/components/customers/AddModal.vue'

// Mock the API composable
const mockCreateMutation = {
  mutate: vi.fn(),
  isPending: ref(false),
  isError: ref(false),
  error: ref(null)
}

vi.mock('~/api', () => ({
  useApi: () => ({
    customers: {
      create: () => mockCreateMutation
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

describe('CustomerAddModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders trigger button correctly', () => {
    const wrapper = mountComponent(AddModal)

    const button = wrapper.find('[data-testid="add-customer-button"]')
    expect(button.exists()).toBe(true)
    expect(button.text()).toContain('Nuevo Cliente')
  })

  it('opens modal when trigger button is clicked', async () => {
    const wrapper = mountComponent(AddModal)

    const button = wrapper.find('button')
    await button.trigger('click')

    // Modal should be open
    expect(wrapper.find('[data-testid="customer-modal"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Nuevo Cliente')
  })

  it('displays form fields correctly', async () => {
    const wrapper = mountComponent(AddModal)

    // Open modal
    await wrapper.find('button').trigger('click')

    // Check that key form fields exist
    expect(wrapper.find('input[placeholder="Empresa ABC"]').exists()).toBe(true)
    expect(wrapper.find('input[placeholder="contacto@empresa.com"]').exists()).toBe(true)
    expect(wrapper.find('input[placeholder="(33) 1234-5678"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="status-select"]').exists()).toBe(true)
  })

  it('validates required fields', async () => {
    const wrapper = mountComponent(AddModal)

    // Open modal
    await wrapper.find('button').trigger('click')

    // Try to submit without filling required fields
    const submitButton = wrapper.find('button[type="submit"]')
    await submitButton.trigger('click')

    // Should show validation errors
    await wrapper.vm.$nextTick()

    // Form should not call the mutation
    expect(mockCreateMutation.mutate).not.toHaveBeenCalled()
  })

  it('submits form with valid data', async () => {
    const wrapper = mountComponent(AddModal)
    const mockCustomer = createMockCustomer()

    // Mock successful API response
    mockCreateMutation.mutate.mockImplementation((data, callbacks) => {
      callbacks?.onSuccess?.(mockCustomer)
    })

    // Open modal
    await wrapper.find('button').trigger('click')

    // Fill form with valid data
    await wrapper.find('input[placeholder="Empresa ABC"]').setValue('Test Company')
    await wrapper.find('input[placeholder="contacto@empresa.com"]').setValue('test@example.com')
    await wrapper.find('input[placeholder="(33) 1234-5678"]').setValue('1234567890')

    // Submit form
    const form = wrapper.find('form')
    await form.trigger('submit')

    // Should call mutation with correct data
    expect(mockCreateMutation.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        business: expect.objectContaining({
          businessName: 'Test Company'
        }),
        contact: expect.objectContaining({
          email: 'test@example.com',
          phone: '1234567890'
        })
      }),
      expect.any(Object)
    )
  })

  it('shows success toast on successful submission', async () => {
    const wrapper = mountComponent(AddModal)
    const mockCustomer = createMockCustomer()

    // Mock successful API response
    mockCreateMutation.mutate.mockImplementation((data, callbacks) => {
      callbacks?.onSuccess?.(mockCustomer)
    })

    // Open modal and fill form
    await wrapper.find('button').trigger('click')
    await wrapper.find('input[placeholder="Empresa ABC"]').setValue('Test Company')

    // Submit form
    const form = wrapper.find('form')
    await form.trigger('submit')

    // Should show success toast
    expect(mockToast.add).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Cliente creado',
        color: 'success',
        icon: 'i-lucide-check'
      })
    )
  })

  it('shows error toast on submission failure', async () => {
    const wrapper = mountComponent(AddModal)
    const error = new Error('API Error')

    // Mock API error
    mockCreateMutation.mutate.mockImplementation((data, callbacks) => {
      callbacks?.onError?.(error)
    })

    // Open modal and fill form
    await wrapper.find('button').trigger('click')
    await wrapper.find('input[placeholder="Empresa ABC"]').setValue('Test Company')

    // Submit form
    const form = wrapper.find('form')
    await form.trigger('submit')

    // Should show error toast
    expect(mockToast.add).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Error',
        color: 'error',
        icon: 'i-lucide-x'
      })
    )
  })

  it('resets form when modal closes', async () => {
    const wrapper = mountComponent(AddModal)

    // Open modal and fill form
    await wrapper.find('button').trigger('click')
    await wrapper.find('input[placeholder="Empresa ABC"]').setValue('Test Company')

    // Close modal
    const cancelButton = wrapper.find('button[data-testid="cancel-button"]')
    await cancelButton.trigger('click')

    // Reopen modal
    await wrapper.find('button').trigger('click')

    // Form should be reset
    const businessNameInput = wrapper.find('input[placeholder="Empresa ABC"]')
    expect(businessNameInput.element.value).toBe('')
  })

  it('handles industry selection correctly', async () => {
    const wrapper = mountComponent(AddModal)

    // Open modal
    await wrapper.find('button').trigger('click')

    // Select industry
    const industrySelect = wrapper.find('[data-testid="industry-select"]')
    await industrySelect.setValue('technology')

    // Check that value is updated in component state
    expect(wrapper.vm.state.business.category).toBe('technology')
  })

  it('handles custom category input when "other" is selected', async () => {
    const wrapper = mountComponent(AddModal)

    // Open modal
    await wrapper.find('button').trigger('click')

    // Select "other" category
    const industrySelect = wrapper.find('[data-testid="industry-select"]')
    await industrySelect.setValue('other')

    // Custom category input should appear
    expect(wrapper.find('[data-testid="custom-category-input"]').exists()).toBe(true)
  })

  it('handles address information correctly', async () => {
    const wrapper = mountComponent(AddModal)

    // Open modal
    await wrapper.find('button').trigger('click')

    // Fill address fields
    await wrapper.find('input[placeholder="Av. Principal 123"]').setValue('Test Street 123')
    await wrapper.find('input[placeholder="Guadalajara"]').setValue('Test City')
    await wrapper.find('input[placeholder="Jalisco"]').setValue('Test State')
    await wrapper.find('input[placeholder="44100"]').setValue('12345')

    // Submit form
    const form = wrapper.find('form')
    await form.trigger('submit')

    // Should include address in submission
    expect(mockCreateMutation.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        business: expect.objectContaining({
          address: expect.objectContaining({
            street: 'Test Street 123',
            city: 'Test City',
            state: 'Test State',
            zipCode: '12345'
          })
        })
      }),
      expect.any(Object)
    )
  })

  it('has proper accessibility attributes', async () => {
    const wrapper = mountComponent(AddModal)

    // Open modal
    await wrapper.find('button').trigger('click')

    // Check form labels and accessibility
    const emailInput = wrapper.find('input[type="email"]')
    expect(emailInput.attributes('aria-label')).toBeDefined()

    // Check required field indicators
    const requiredFields = wrapper.findAll('[required]')
    expect(requiredFields.length).toBeGreaterThan(0)
  })
})
