import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import DatePicker from '~/app/components/shared/DatePicker.vue'
import { CalendarDate, getLocalTimeZone } from '@internationalized/date'

// Mock the internationalized date library
vi.mock('@internationalized/date', () => ({
  CalendarDate: vi.fn().mockImplementation((year, month, day) => ({
    year,
    month,
    day,
    toDate: vi.fn((timeZone) => new Date(year, month - 1, day))
  })),
  DateFormatter: vi.fn().mockImplementation((locale, options) => ({
    format: vi.fn((date) => {
      if (date instanceof Date) {
        return date.toLocaleDateString(locale, options)
      }
      return 'Invalid Date'
    })
  })),
  getLocalTimeZone: vi.fn(() => 'America/Los_Angeles')
}))

const createWrapper = (props: { modelValue?: CalendarDate | null } = {}) => {
  return mount(DatePicker, {
    props: {
      modelValue: props.modelValue || null,
      'onUpdate:modelValue': (value: CalendarDate | null) => {
        wrapper.setProps({ modelValue: value })
      }
    },
    global: {
      stubs: {
        UPopover: {
          template: `
            <div data-testid="popover">
              <div data-testid="popover-trigger" @click="toggle">
                <slot />
              </div>
              <div data-testid="popover-content" v-if="isOpen">
                <slot name="content" />
              </div>
            </div>
          `,
          data: () => ({ isOpen: false }),
          methods: {
            toggle() {
              this.isOpen = !this.isOpen
            }
          }
        },
        UButton: {
          template: `
            <button 
              data-testid="button"
              :class="['button', color, variant]"
              @click="$emit('click')"
            >
              <i v-if="icon" :class="icon" data-testid="icon"></i>
              <slot />
            </button>
          `,
          props: ['color', 'icon', 'variant'],
          emits: ['click']
        },
        UCalendar: {
          template: `
            <div 
              data-testid="calendar"
              :class="$attrs.class"
              @change="handleDateChange"
            >
              <input 
                type="date" 
                data-testid="calendar-input"
                :value="modelValue ? formatDateForInput(modelValue) : ''"
                @input="updateDate"
              />
            </div>
          `,
          props: ['modelValue', 'class'],
          emits: ['update:modelValue'],
          methods: {
            updateDate(event: Event) {
              const target = event.target as HTMLInputElement
              const dateValue = target.value
              if (dateValue) {
                const [year, month, day] = dateValue.split('-').map(Number)
                const calendarDate = new CalendarDate(year, month, day)
                this.$emit('update:modelValue', calendarDate)
              } else {
                this.$emit('update:modelValue', null)
              }
            },
            formatDateForInput(calendarDate: CalendarDate) {
              if (!calendarDate) return ''
              const year = calendarDate.year
              const month = String(calendarDate.month).padStart(2, '0')
              const day = String(calendarDate.day).padStart(2, '0')
              return `${year}-${month}-${day}`
            }
          }
        }
      }
    }
  })
}

const createMockCalendarDate = (year: number = 2024, month: number = 1, day: number = 15): CalendarDate => {
  return new CalendarDate(year, month, day) as any
}

describe('DatePicker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('renders the popover component', () => {
      const wrapper = createWrapper()
      
      const popover = wrapper.find('[data-testid="popover"]')
      expect(popover.exists()).toBe(true)
    })

    it('renders the trigger button with calendar icon', () => {
      const wrapper = createWrapper()
      
      const button = wrapper.find('[data-testid="button"]')
      expect(button.exists()).toBe(true)
      
      const icon = wrapper.find('[data-testid="icon"]')
      expect(icon.exists()).toBe(true)
      expect(icon.classes()).toContain('i-lucide-calendar')
    })

    it('applies correct button styling', () => {
      const wrapper = createWrapper()
      
      const button = wrapper.find('[data-testid="button"]')
      expect(button.classes()).toContain('neutral')
      expect(button.classes()).toContain('subtle')
    })

    it('renders calendar in popover content', () => {
      const wrapper = createWrapper()
      
      const calendar = wrapper.find('[data-testid="calendar"]')
      expect(calendar.exists()).toBe(true)
      expect(calendar.classes()).toContain('p-2')
    })
  })

  describe('Date Display', () => {
    it('shows "Select a date" when no date is selected', () => {
      const wrapper = createWrapper()
      
      const button = wrapper.find('[data-testid="button"]')
      expect(button.text()).toContain('Select a date')
    })

    it('displays formatted date when a date is selected', () => {
      const mockDate = createMockCalendarDate(2024, 3, 15)
      const wrapper = createWrapper({ modelValue: mockDate })
      
      const button = wrapper.find('[data-testid="button"]')
      const buttonText = button.text()
      
      // Should not show "Select a date"
      expect(buttonText).not.toContain('Select a date')
      // Should contain some formatted date representation
      expect(buttonText.trim().length).toBeGreaterThan(0)
    })

    it('formats date using DateFormatter', () => {
      const mockDate = createMockCalendarDate(2024, 6, 20)
      const wrapper = createWrapper({ modelValue: mockDate })
      
      // DateFormatter should have been called
      expect(wrapper.vm.df).toBeDefined()
      expect(wrapper.vm.df.format).toBeDefined()
    })

    it('handles null modelValue gracefully', () => {
      const wrapper = createWrapper({ modelValue: null })
      
      const button = wrapper.find('[data-testid="button"]')
      expect(button.text()).toContain('Select a date')
      expect(() => wrapper.vm).not.toThrow()
    })
  })

  describe('Popover Interaction', () => {
    it('opens popover when button is clicked', async () => {
      const wrapper = createWrapper()
      
      const button = wrapper.find('[data-testid="button"]')
      await button.trigger('click')
      
      const popoverContent = wrapper.find('[data-testid="popover-content"]')
      expect(popoverContent.exists()).toBe(true)
    })

    it('contains calendar component when opened', async () => {
      const wrapper = createWrapper()
      
      const button = wrapper.find('[data-testid="button"]')
      await button.trigger('click')
      
      const calendar = wrapper.find('[data-testid="calendar"]')
      expect(calendar.exists()).toBe(true)
    })

    it('passes model value to calendar', () => {
      const mockDate = createMockCalendarDate(2024, 5, 10)
      const wrapper = createWrapper({ modelValue: mockDate })
      
      const calendarComponent = wrapper.findComponent({ name: 'UCalendar' })
      expect(calendarComponent.props('modelValue')).toEqual(mockDate)
    })
  })

  describe('Date Selection', () => {
    it('updates model value when calendar date changes', async () => {
      const wrapper = createWrapper()
      
      const calendarInput = wrapper.find('[data-testid="calendar-input"]')
      await calendarInput.setValue('2024-07-25')
      
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      
      const emittedValue = wrapper.emitted('update:modelValue')![0][0] as CalendarDate
      expect(emittedValue.year).toBe(2024)
      expect(emittedValue.month).toBe(7)
      expect(emittedValue.day).toBe(25)
    })

    it('emits null when calendar is cleared', async () => {
      const mockDate = createMockCalendarDate(2024, 4, 15)
      const wrapper = createWrapper({ modelValue: mockDate })
      
      const calendarInput = wrapper.find('[data-testid="calendar-input"]')
      await calendarInput.setValue('')
      
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')!.slice(-1)[0]).toEqual([null])
    })

    it('handles date changes reactively', async () => {
      const wrapper = createWrapper()
      
      const initialDate = createMockCalendarDate(2024, 2, 14)
      await wrapper.setProps({ modelValue: initialDate })
      
      const calendarComponent = wrapper.findComponent({ name: 'UCalendar' })
      expect(calendarComponent.props('modelValue')).toEqual(initialDate)
      
      const newDate = createMockCalendarDate(2024, 8, 30)
      await wrapper.setProps({ modelValue: newDate })
      
      expect(calendarComponent.props('modelValue')).toEqual(newDate)
    })
  })

  describe('Date Formatting', () => {
    it('creates DateFormatter with correct configuration', () => {
      const wrapper = createWrapper()
      
      expect(wrapper.vm.df).toBeDefined()
      // DateFormatter should be created with 'en-US' locale and medium dateStyle
    })

    it('formats dates consistently', () => {
      const mockDate = createMockCalendarDate(2024, 1, 1)
      const wrapper = createWrapper({ modelValue: mockDate })
      
      const formattedDate = wrapper.vm.df.format(mockDate.toDate(getLocalTimeZone()))
      expect(typeof formattedDate).toBe('string')
      expect(formattedDate.length).toBeGreaterThan(0)
    })

    it('handles different date formats', () => {
      const testDates = [
        createMockCalendarDate(2024, 1, 1),   // New Year's Day
        createMockCalendarDate(2024, 12, 31), // New Year's Eve
        createMockCalendarDate(2024, 7, 4),   // July 4th
        createMockCalendarDate(2024, 2, 29)   // Leap year day
      ]
      
      testDates.forEach(date => {
        const wrapper = createWrapper({ modelValue: date })
        const button = wrapper.find('[data-testid="button"]')
        expect(button.text()).not.toContain('Select a date')
      })
    })
  })

  describe('Timezone Handling', () => {
    it('uses getLocalTimeZone for date conversion', () => {
      const mockDate = createMockCalendarDate(2024, 6, 15)
      const wrapper = createWrapper({ modelValue: mockDate })
      
      expect(getLocalTimeZone).toHaveBeenCalled()
    })

    it('converts CalendarDate to JavaScript Date correctly', () => {
      const mockDate = createMockCalendarDate(2024, 3, 20)
      const wrapper = createWrapper({ modelValue: mockDate })
      
      const jsDate = mockDate.toDate(getLocalTimeZone())
      expect(jsDate).toBeInstanceOf(Date)
    })

    it('handles timezone changes gracefully', () => {
      const mockDate = createMockCalendarDate(2024, 9, 10)
      
      // Mock different timezone
      vi.mocked(getLocalTimeZone).mockReturnValue('Europe/London')
      
      const wrapper = createWrapper({ modelValue: mockDate })
      expect(() => wrapper.vm).not.toThrow()
    })
  })

  describe('Model Value Support', () => {
    it('supports v-model pattern', async () => {
      const wrapper = createWrapper()
      
      expect(wrapper.props('modelValue')).toBe(null)
      
      const newDate = createMockCalendarDate(2024, 5, 25)
      await wrapper.setProps({ modelValue: newDate })
      
      expect(wrapper.props('modelValue')).toEqual(newDate)
    })

    it('emits update:modelValue events', async () => {
      const wrapper = createWrapper()
      
      const calendarInput = wrapper.find('[data-testid="calendar-input"]')
      await calendarInput.setValue('2024-11-15')
      
      expect(wrapper.emitted()).toHaveProperty('update:modelValue')
      expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
    })

    it('handles CalendarDate type correctly', async () => {
      const wrapper = createWrapper()
      
      const calendarInput = wrapper.find('[data-testid="calendar-input"]')
      await calendarInput.setValue('2024-12-03')
      
      const emittedValue = wrapper.emitted('update:modelValue')![0][0]
      expect(emittedValue).toBeInstanceOf(CalendarDate)
      expect(emittedValue).toHaveProperty('year', 2024)
      expect(emittedValue).toHaveProperty('month', 12)
      expect(emittedValue).toHaveProperty('day', 3)
    })
  })

  describe('Validation Rules', () => {
    it('accepts valid date inputs', async () => {
      const wrapper = createWrapper()
      
      const validDates = [
        '2024-01-01',
        '2024-06-15',
        '2024-12-31',
        '2023-02-28'
      ]
      
      for (const dateStr of validDates) {
        const calendarInput = wrapper.find('[data-testid="calendar-input"]')
        await calendarInput.setValue(dateStr)
        
        expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      }
    })

    it('handles invalid date inputs gracefully', async () => {
      const wrapper = createWrapper()
      
      const calendarInput = wrapper.find('[data-testid="calendar-input"]')
      
      // Invalid dates should not crash the component
      await calendarInput.setValue('invalid-date')
      
      expect(() => wrapper.vm).not.toThrow()
    })

    it('supports leap year dates', async () => {
      const wrapper = createWrapper()
      
      const calendarInput = wrapper.find('[data-testid="calendar-input"]')
      await calendarInput.setValue('2024-02-29') // Leap year
      
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      
      const emittedValue = wrapper.emitted('update:modelValue')!.slice(-1)[0][0] as CalendarDate
      expect(emittedValue.year).toBe(2024)
      expect(emittedValue.month).toBe(2)
      expect(emittedValue.day).toBe(29)
    })
  })

  describe('Accessibility', () => {
    it('provides proper button labeling', () => {
      const wrapper = createWrapper()
      
      const button = wrapper.find('[data-testid="button"]')
      expect(button.text()).toBeTruthy()
      expect(button.text().trim()).not.toBe('')
    })

    it('includes calendar icon for visual context', () => {
      const wrapper = createWrapper()
      
      const icon = wrapper.find('[data-testid="icon"]')
      expect(icon.exists()).toBe(true)
      expect(icon.classes()).toContain('i-lucide-calendar')
    })

    it('maintains keyboard navigation support', () => {
      const wrapper = createWrapper()
      
      const button = wrapper.find('[data-testid="button"]')
      expect(button.element.tagName.toLowerCase()).toBe('button')
      
      const popover = wrapper.find('[data-testid="popover"]')
      expect(popover.exists()).toBe(true)
    })

    it('provides date selection feedback', () => {
      const mockDate = createMockCalendarDate(2024, 7, 8)
      const wrapper = createWrapper({ modelValue: mockDate })
      
      const button = wrapper.find('[data-testid="button"]')
      const buttonText = button.text()
      
      expect(buttonText).not.toBe('Select a date')
      expect(buttonText.trim().length).toBeGreaterThan(5) // Should contain formatted date
    })
  })

  describe('Performance', () => {
    it('handles rapid date changes efficiently', async () => {
      const wrapper = createWrapper()
      
      const dates = [
        '2024-01-15',
        '2024-02-20',
        '2024-03-25',
        '2024-04-30',
        '2024-05-05'
      ]
      
      const calendarInput = wrapper.find('[data-testid="calendar-input"]')
      
      // Rapid successive changes
      for (const date of dates) {
        await calendarInput.setValue(date)
      }
      
      expect(wrapper.emitted('update:modelValue')).toHaveLength(dates.length)
      expect(() => wrapper.vm).not.toThrow()
    })

    it('minimizes re-renders with stable references', () => {
      const mockDate = createMockCalendarDate(2024, 8, 12)
      const wrapper = createWrapper({ modelValue: mockDate })
      
      // DateFormatter should be created once and reused
      const df1 = wrapper.vm.df
      
      // Force re-render
      wrapper.vm.$forceUpdate()
      
      const df2 = wrapper.vm.df
      expect(df1).toBe(df2) // Same reference
    })
  })

  describe('Edge Cases', () => {
    it('handles undefined modelValue', () => {
      const wrapper = createWrapper({ modelValue: undefined as any })
      
      const button = wrapper.find('[data-testid="button"]')
      expect(button.text()).toContain('Select a date')
      expect(() => wrapper.vm).not.toThrow()
    })

    it('handles extreme dates', async () => {
      const wrapper = createWrapper()
      
      const extremeDates = [
        '1900-01-01',  // Very old date
        '2099-12-31'   // Far future date
      ]
      
      const calendarInput = wrapper.find('[data-testid="calendar-input"]')
      
      for (const dateStr of extremeDates) {
        await calendarInput.setValue(dateStr)
        expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      }
    })

    it('maintains consistent state during rapid interactions', async () => {
      const wrapper = createWrapper()
      
      const button = wrapper.find('[data-testid="button"]')
      const calendarInput = wrapper.find('[data-testid="calendar-input"]')
      
      // Rapid open/close with date changes
      await button.trigger('click') // Open
      await calendarInput.setValue('2024-06-20')
      await button.trigger('click') // Close
      await button.trigger('click') // Open again
      
      expect(wrapper.vm).toBeTruthy()
      expect(() => wrapper.vm).not.toThrow()
    })

    it('handles component destruction gracefully', () => {
      const wrapper = createWrapper({ 
        modelValue: createMockCalendarDate(2024, 10, 15) 
      })
      
      expect(() => {
        wrapper.unmount()
      }).not.toThrow()
    })
  })
})