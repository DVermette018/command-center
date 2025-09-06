import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { reactive } from 'vue'
import BusinessForm from '~/app/components/businesses/form.vue'
import type { CreateBusinessProfileDTO } from '~~/dto/business'

// Mock the API composable
const mockStoreMutation = vi.fn()
const mockApi = {
  business: {
    store: mockStoreMutation
  }
}

vi.mock('~/api', () => ({
  useApi: () => mockApi
}))

// Mock useRoute
const mockRoute = {
  params: { projectId: 'test-project-id' },
  query: {}
}
vi.mock('vue-router', () => ({
  useRoute: () => mockRoute
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

// Mock Nuxt composables
vi.mock('#app', () => ({
  useRoute: () => mockRoute,
  navigateTo: vi.fn()
}))

const createWrapper = (props = {}) => {
  return mount(BusinessForm, {
    props,
    global: {
      stubs: {
        UDashboardPanel: { template: '<div data-testid="dashboard-panel"><slot /></div>' },
        UForm: { 
          template: '<form data-testid="business-form" @submit="$emit(\'submit\', { data: $attrs.state })"><slot /></form>',
          props: ['schema', 'state']
        },
        UPageCard: { 
          template: '<div data-testid="page-card" :data-title="title"><slot /></div>',
          props: ['title', 'description', 'orientation', 'variant', 'class']
        },
        UButton: { 
          template: '<button data-testid="button" :type="type" :form="form" @click="$emit(\'click\')"><slot /></button>',
          props: ['color', 'icon', 'label', 'type', 'form', 'class', 'variant', 'size', 'square']
        },
        UFormField: { 
          template: '<div data-testid="form-field" :data-name="name" :data-required="required"><label>{{ label }}</label><slot /></div>',
          props: ['label', 'name', 'description', 'required', 'class']
        },
        UInput: { 
          template: '<input data-testid="input" :placeholder="placeholder" :type="type" :min="min" :max="max" :pattern="pattern" @input="$emit(\'update:modelValue\', $event.target.value)" />',
          props: ['placeholder', 'type', 'min', 'max', 'pattern', 'class'],
          emits: ['update:modelValue']
        },
        UTextarea: { 
          template: '<textarea data-testid="textarea" :placeholder="placeholder" :rows="rows" @input="$emit(\'update:modelValue\', $event.target.value)"></textarea>',
          props: ['placeholder', 'rows'],
          emits: ['update:modelValue']
        },
        USelect: { 
          template: '<select data-testid="select" @change="$emit(\'update:modelValue\', $event.target.value)"><option v-for="item in items" :key="item.value" :value="item.value">{{ item.label }}</option></select>',
          props: ['items', 'placeholder'],
          emits: ['update:modelValue']
        },
        UToggle: { 
          template: '<input type="checkbox" data-testid="toggle" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
          props: ['offLabel', 'onLabel'],
          emits: ['update:modelValue']
        },
        UColorPicker: { 
          template: '<div data-testid="color-picker" @click="$emit(\'update:modelValue\', \'#ff0000\')"></div>',
          emits: ['update:modelValue']
        },
        UPopover: { 
          template: '<div data-testid="popover"><slot /><div v-if="$slots.content"><slot name="content" /></div></div>'
        },
        USeparator: { template: '<hr data-testid="separator" />' }
      }
    }
  })
}

describe('BusinessForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStoreMutation.mockReset()
  })

  describe('Component Rendering', () => {
    it('renders the form with all main sections', () => {
      const wrapper = createWrapper()
      
      expect(wrapper.find('[data-testid="dashboard-panel"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="business-form"]').exists()).toBe(true)
      
      // Check main sections exist
      const pageCards = wrapper.findAll('[data-testid="page-card"]')
      expect(pageCards.length).toBeGreaterThan(4) // Header + multiple sections
    })

    it('renders header with create button', () => {
      const wrapper = createWrapper()
      
      const createButton = wrapper.find('[data-testid="button"]')
      expect(createButton.exists()).toBe(true)
      expect(createButton.attributes('form')).toBe('business-profile-form')
      expect(createButton.attributes('type')).toBe('submit')
    })

    it('renders business identity section with required fields', () => {
      const wrapper = createWrapper()
      
      // Check required fields exist
      const businessNameField = wrapper.find('[data-testid="form-field"][data-name="businessName"]')
      const ownerNameField = wrapper.find('[data-testid="form-field"][data-name="ownerName"]')
      const phoneField = wrapper.find('[data-testid="form-field"][data-name="phone"]')
      const emailField = wrapper.find('[data-testid="form-field"][data-name="email"]')
      
      expect(businessNameField.exists()).toBe(true)
      expect(businessNameField.attributes('data-required')).toBe('true')
      expect(ownerNameField.exists()).toBe(true)
      expect(ownerNameField.attributes('data-required')).toBe('true')
      expect(phoneField.exists()).toBe(true)
      expect(phoneField.attributes('data-required')).toBe('true')
      expect(emailField.exists()).toBe(true)
      expect(emailField.attributes('data-required')).toBe('true')
    })

    it('renders business details section', () => {
      const wrapper = createWrapper()
      
      const categoryField = wrapper.find('[data-testid="form-field"][data-name="category"]')
      const yearEstablishedField = wrapper.find('[data-testid="form-field"][data-name="yearEstablished"]')
      const descriptionField = wrapper.find('[data-testid="form-field"][data-name="description"]')
      
      expect(categoryField.exists()).toBe(true)
      expect(categoryField.attributes('data-required')).toBe('true')
      expect(yearEstablishedField.exists()).toBe(true)
      expect(descriptionField.exists()).toBe(true)
    })

    it('renders address section with required fields', () => {
      const wrapper = createWrapper()
      
      const streetField = wrapper.find('[data-testid="form-field"][data-name="addresses[0].street"]')
      const cityField = wrapper.find('[data-testid="form-field"][data-name="addresses[0].city"]')
      const stateField = wrapper.find('[data-testid="form-field"][data-name="addresses[0].state"]')
      const zipCodeField = wrapper.find('[data-testid="form-field"][data-name="addresses[0].zipCode"]')
      
      expect(streetField.exists()).toBe(true)
      expect(streetField.attributes('data-required')).toBe('true')
      expect(cityField.exists()).toBe(true)
      expect(cityField.attributes('data-required')).toBe('true')
      expect(stateField.exists()).toBe(true)
      expect(stateField.attributes('data-required')).toBe('true')
      expect(zipCodeField.exists()).toBe(true)
      expect(zipCodeField.attributes('data-required')).toBe('true')
    })
  })

  describe('Form Interactions', () => {
    it('shows custom category field when "other" is selected', async () => {
      const wrapper = createWrapper()
      
      // Select "other" category
      const categorySelect = wrapper.find('[data-testid="form-field"][data-name="category"] select')
      await categorySelect.setValue('other')
      
      await wrapper.vm.$nextTick()
      
      // Custom category field should be visible
      const customCategoryField = wrapper.find('[data-testid="form-field"][data-name="customCategory"]')
      expect(customCategoryField.exists()).toBe(true)
    })

    it('updates year established with number input', async () => {
      const wrapper = createWrapper()
      
      const yearInput = wrapper.find('[data-testid="form-field"][data-name="yearEstablished"] input')
      expect(yearInput.attributes('type')).toBe('number')
      expect(yearInput.attributes('min')).toBe('1900')
      expect(yearInput.attributes('max')).toBe(String(new Date().getFullYear() + 2))
    })

    it('handles color picker interactions', async () => {
      const wrapper = createWrapper()
      
      const colorPickerButton = wrapper.find('[data-testid="popover"] [data-testid="button"]')
      expect(colorPickerButton.exists()).toBe(true)
      
      const colorPicker = wrapper.find('[data-testid="color-picker"]')
      expect(colorPicker.exists()).toBe(true)
    })
  })

  describe('Schedule Management', () => {
    it('renders schedule configuration for all days', () => {
      const wrapper = createWrapper()
      
      // Should have 7 days of schedules
      const toggles = wrapper.findAll('[data-testid="toggle"]')
      expect(toggles.length).toBeGreaterThanOrEqual(7) // At least 7 for days, may have more for social media
    })

    it('shows time inputs when day is not closed', async () => {
      const wrapper = createWrapper()
      
      // Find a schedule toggle (first one should be Monday)
      const firstToggle = wrapper.find('[data-testid="toggle"]')
      expect(firstToggle.exists()).toBe(true)
      
      // By default, days are not closed, so time inputs should be visible
      const timeInputs = wrapper.findAll('input[pattern="[0-9]{2}:[0-9]{2}"]')
      expect(timeInputs.length).toBeGreaterThan(0)
    })

    it('handles break time inputs', () => {
      const wrapper = createWrapper()
      
      // Look for break time inputs (they have smaller size)
      const breakInputs = wrapper.findAll('input[placeholder="13:00"], input[placeholder="14:00"]')
      expect(breakInputs.length).toBeGreaterThan(0)
    })
  })

  describe('Social Media Management', () => {
    it('renders initial social media entry', () => {
      const wrapper = createWrapper()
      
      // Should have at least one social media platform selector
      const platformSelects = wrapper.findAll('[data-testid="select"]')
      expect(platformSelects.length).toBeGreaterThan(0)
    })

    it('adds new social media entry when button is clicked', async () => {
      const wrapper = createWrapper()
      
      // Find the add social media button
      const addButton = wrapper.findAll('[data-testid="button"]').find(button => 
        button.text().includes('Agregar Red Social') || button.text().includes('Agregar')
      )
      
      expect(addButton?.exists()).toBe(true)
      
      if (addButton) {
        await addButton.trigger('click')
        await wrapper.vm.$nextTick()
        
        // Should add new entry (component internal logic)
        expect(wrapper.vm.socialMedia.length).toBeGreaterThan(1)
      }
    })

    it('removes social media entry when remove button is clicked', async () => {
      const wrapper = createWrapper()
      
      // First add a second entry
      wrapper.vm.addSocialMedia()
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.socialMedia.length).toBe(2)
      
      // Find remove button and click it
      wrapper.vm.removeSocialMedia(1)
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.socialMedia.length).toBe(1)
    })
  })

  describe('Color Management', () => {
    it('adds additional color when button is clicked', async () => {
      const wrapper = createWrapper()
      
      expect(wrapper.vm.additionalColorsList.length).toBe(0)
      
      wrapper.vm.addAdditionalColor()
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.additionalColorsList.length).toBe(1)
      expect(wrapper.vm.additionalColorsList[0]).toBe('#000000')
    })

    it('removes additional color when remove button is clicked', async () => {
      const wrapper = createWrapper()
      
      // Add color first
      wrapper.vm.addAdditionalColor()
      wrapper.vm.addAdditionalColor()
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.additionalColorsList.length).toBe(2)
      
      // Remove one color
      wrapper.vm.removeAdditionalColor(0)
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.additionalColorsList.length).toBe(1)
    })
  })

  describe('Form Submission', () => {
    it('calls API store method on form submission', async () => {
      const wrapper = createWrapper()
      mockStoreMutation.mockResolvedValue({ success: true })
      
      // Fill in required fields
      wrapper.vm.businessForm.businessName = 'Test Business'
      wrapper.vm.businessForm.ownerName = 'Test Owner'
      wrapper.vm.businessForm.phone = '1234567890'
      wrapper.vm.businessForm.email = 'test@example.com'
      wrapper.vm.businessForm.category = 'technology'
      wrapper.vm.businessForm.addresses[0].street = 'Test Street'
      wrapper.vm.businessForm.addresses[0].city = 'Test City'
      wrapper.vm.businessForm.addresses[0].state = 'Test State'
      wrapper.vm.businessForm.addresses[0].zipCode = '12345'
      
      // Trigger form submission
      const form = wrapper.find('[data-testid="business-form"]')
      await form.trigger('submit')
      
      expect(mockStoreMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          businessName: 'Test Business',
          ownerName: 'Test Owner',
          phone: '1234567890',
          email: 'test@example.com',
          category: 'technology',
          addresses: expect.arrayContaining([
            expect.objectContaining({
              street: 'Test Street',
              city: 'Test City',
              state: 'Test State',
              zipCode: '12345'
            })
          ])
        })
      )
    })

    it('filters out empty schedules and social media on submission', async () => {
      const wrapper = createWrapper()
      mockStoreMutation.mockResolvedValue({ success: true })
      
      // Set up test data
      wrapper.vm.schedules[0].isClosed = true
      wrapper.vm.schedules[0].openTime = ''
      wrapper.vm.schedules[1].openTime = '09:00'
      wrapper.vm.schedules[1].closeTime = '17:00'
      
      wrapper.vm.socialMedia[0].url = 'https://facebook.com/test'
      wrapper.vm.socialMedia.push({ platform: 'INSTAGRAM', url: '', username: '', isActive: true })
      
      // Fill required fields
      wrapper.vm.businessForm.businessName = 'Test Business'
      wrapper.vm.businessForm.ownerName = 'Test Owner'
      wrapper.vm.businessForm.phone = '1234567890'
      wrapper.vm.businessForm.email = 'test@example.com'
      wrapper.vm.businessForm.category = 'technology'
      wrapper.vm.businessForm.addresses[0].street = 'Test Street'
      wrapper.vm.businessForm.addresses[0].city = 'Test City'
      wrapper.vm.businessForm.addresses[0].state = 'Test State'
      wrapper.vm.businessForm.addresses[0].zipCode = '12345'
      
      const form = wrapper.find('[data-testid="business-form"]')
      await form.trigger('submit')
      
      expect(mockStoreMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          schedules: expect.arrayContaining([
            expect.objectContaining({
              dayOfWeek: 'TUESDAY',
              openTime: '09:00',
              closeTime: '17:00'
            })
          ]),
          socialMedia: expect.arrayContaining([
            expect.objectContaining({
              platform: 'FACEBOOK',
              url: 'https://facebook.com/test'
            })
          ])
        })
      )
    })

    it('shows success toast on successful submission', async () => {
      const wrapper = createWrapper()
      mockStoreMutation.mockResolvedValue({ success: true })
      
      // Fill minimum required fields
      wrapper.vm.businessForm.businessName = 'Test Business'
      wrapper.vm.businessForm.ownerName = 'Test Owner'
      wrapper.vm.businessForm.phone = '1234567890'
      wrapper.vm.businessForm.email = 'test@example.com'
      wrapper.vm.businessForm.category = 'technology'
      wrapper.vm.businessForm.addresses[0].street = 'Test Street'
      wrapper.vm.businessForm.addresses[0].city = 'Test City'
      wrapper.vm.businessForm.addresses[0].state = 'Test State'
      wrapper.vm.businessForm.addresses[0].zipCode = '12345'
      
      const form = wrapper.find('[data-testid="business-form"]')
      await form.trigger('submit')
      
      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Registro exitoso',
          description: 'El perfil del negocio ha sido creado correctamente',
          icon: 'i-lucide-check',
          color: 'success'
        })
      )
    })

    it('shows error toast on submission failure', async () => {
      const wrapper = createWrapper()
      const error = new Error('API Error')
      mockStoreMutation.mockRejectedValue(error)
      
      // Fill minimum required fields
      wrapper.vm.businessForm.businessName = 'Test Business'
      wrapper.vm.businessForm.ownerName = 'Test Owner'
      wrapper.vm.businessForm.phone = '1234567890'
      wrapper.vm.businessForm.email = 'test@example.com'
      wrapper.vm.businessForm.category = 'technology'
      wrapper.vm.businessForm.addresses[0].street = 'Test Street'
      wrapper.vm.businessForm.addresses[0].city = 'Test City'
      wrapper.vm.businessForm.addresses[0].state = 'Test State'
      wrapper.vm.businessForm.addresses[0].zipCode = '12345'
      
      const form = wrapper.find('[data-testid="business-form"]')
      await form.trigger('submit')
      
      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          description: 'Hubo un problema al crear el perfil del negocio',
          icon: 'i-lucide-x',
          color: 'error'
        })
      )
    })
  })

  describe('Form Validation', () => {
    it('validates required fields', () => {
      const wrapper = createWrapper()
      
      const requiredFields = [
        'businessName',
        'ownerName',
        'phone',
        'email',
        'category',
        'addresses[0].street',
        'addresses[0].city',
        'addresses[0].state',
        'addresses[0].zipCode'
      ]
      
      requiredFields.forEach(fieldName => {
        const field = wrapper.find(`[data-testid="form-field"][data-name="${fieldName}"]`)
        expect(field.exists()).toBe(true)
        expect(field.attributes('data-required')).toBe('true')
      })
    })

    it('validates email format', () => {
      const wrapper = createWrapper()
      
      const emailInput = wrapper.find('[data-testid="form-field"][data-name="email"] input')
      expect(emailInput.attributes('type')).toBe('email')
    })

    it('validates year established range', () => {
      const wrapper = createWrapper()
      
      const yearInput = wrapper.find('[data-testid="form-field"][data-name="yearEstablished"] input')
      expect(yearInput.attributes('min')).toBe('1900')
      expect(yearInput.attributes('max')).toBe(String(new Date().getFullYear() + 2))
    })

    it('validates time format for schedules', () => {
      const wrapper = createWrapper()
      
      const timeInputs = wrapper.findAll('input[pattern="[0-9]{2}:[0-9]{2}"]')
      timeInputs.forEach(input => {
        expect(input.attributes('pattern')).toBe('[0-9]{2}:[0-9]{2}')
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper form structure with labels', () => {
      const wrapper = createWrapper()
      
      const formFields = wrapper.findAll('[data-testid="form-field"]')
      formFields.forEach(field => {
        const label = field.find('label')
        expect(label.exists()).toBe(true)
      })
    })

    it('associates form with submit button', () => {
      const wrapper = createWrapper()
      
      const form = wrapper.find('[data-testid="business-form"]')
      const submitButton = wrapper.find('[data-testid="button"][type="submit"]')
      
      expect(form.attributes('id')).toBe('business-profile-form')
      expect(submitButton.attributes('form')).toBe('business-profile-form')
    })

    it('provides placeholders for better UX', () => {
      const wrapper = createWrapper()
      
      const inputs = wrapper.findAll('[data-testid="input"]')
      inputs.forEach(input => {
        expect(input.attributes('placeholder')).toBeDefined()
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles missing projectId gracefully', () => {
      mockRoute.params.projectId = undefined
      mockRoute.query.projectId = undefined
      
      const wrapper = createWrapper()
      
      // Should still render without crashing
      expect(wrapper.find('[data-testid="business-form"]').exists()).toBe(true)
    })

    it('prevents removal of last social media entry', () => {
      const wrapper = createWrapper()
      
      // Should have one entry initially
      expect(wrapper.vm.socialMedia.length).toBe(1)
      
      // Try to remove the only entry
      wrapper.vm.removeSocialMedia(0)
      
      // Should still have one entry
      expect(wrapper.vm.socialMedia.length).toBe(1)
    })

    it('handles coordinates in address when provided', async () => {
      const wrapper = createWrapper()
      mockStoreMutation.mockResolvedValue({ success: true })
      
      // Set address with coordinates
      wrapper.vm.businessForm.addresses[0].coordinates = {
        lat: 20.6597,
        lng: -103.3496
      }
      
      wrapper.vm.businessForm.businessName = 'Test Business'
      wrapper.vm.businessForm.ownerName = 'Test Owner'
      wrapper.vm.businessForm.phone = '1234567890'
      wrapper.vm.businessForm.email = 'test@example.com'
      wrapper.vm.businessForm.category = 'technology'
      wrapper.vm.businessForm.addresses[0].street = 'Test Street'
      wrapper.vm.businessForm.addresses[0].city = 'Test City'
      wrapper.vm.businessForm.addresses[0].state = 'Test State'
      wrapper.vm.businessForm.addresses[0].zipCode = '12345'
      
      const form = wrapper.find('[data-testid="business-form"]')
      await form.trigger('submit')
      
      expect(mockStoreMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          addresses: expect.arrayContaining([
            expect.objectContaining({
              coordinates: {
                lat: 20.6597,
                lng: -103.3496
              }
            })
          ])
        })
      )
    })
  })
})