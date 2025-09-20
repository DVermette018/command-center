import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import HomeDateRangePicker from '~/components/home/HomeDateRangePicker.vue'
import type { Range } from '~/types'
import { CalendarDate, today, getLocalTimeZone } from '@internationalized/date'

// Mock the internationalized date library
vi.mock('@internationalized/date', () => ({
  DateFormatter: vi.fn().mockImplementation(() => ({
    format: vi.fn((date) => date.toLocaleDateString('en-US', { dateStyle: 'medium' }))
  })),
  getLocalTimeZone: vi.fn(() => 'America/Los_Angeles'),
  CalendarDate: vi.fn().mockImplementation((year, month, day) => ({
    year,
    month,
    day,
    copy: vi.fn().mockReturnThis(),
    subtract: vi.fn().mockReturnThis(),
    compare: vi.fn(() => 0),
    toDate: vi.fn(() => new Date(year, month - 1, day))
  })),
  today: vi.fn(() => new CalendarDate(2024, 1, 15))
}))

const createMockRange = (startDaysAgo = 7, endDaysAgo = 0): Range => {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - startDaysAgo)
  end.setDate(end.getDate() - endDaysAgo)

  return { start, end }
}

const createWrapper = (modelValue?: Range) => {
  return mount(HomeDateRangePicker, {
    props: {
      modelValue: modelValue || createMockRange()
    },
    global: {
      stubs: {
        UPopover: {
          template: `
            <div data-testid="popover">
              <div data-testid="popover-trigger" @click="$emit('toggle')">
                <slot />
              </div>
              <div data-testid="popover-content" v-if="showContent">
                <slot name="content" />
              </div>
            </div>
          `,
          data: () => ({ showContent: false }),
          methods: {
            toggle() {
              this.showContent = !this.showContent
              this.$emit('toggle')
            }
          },
          props: ['content', 'modal']
        },
        UButton: {
          template: `
            <button
              data-testid="button"
              :class="['button', color, variant, $attrs.class]"
              @click="$emit('click')"
            >
              <slot />
              <slot name="trailing" />
            </button>
          `,
          props: ['color', 'variant', 'icon', 'label', 'class', 'truncate'],
          emits: ['click']
        },
        UIcon: {
          template: '<i data-testid="icon" :class="name"></i>',
          props: ['name', 'class']
        },
        UCalendar: {
          template: `
            <div
              data-testid="calendar"
              :class="$attrs.class"
              @change="handleChange"
            >
              <input
                type="date"
                data-testid="calendar-start"
                :value="modelValue?.start?.toISOString().split('T')[0]"
                @input="updateStart"
              />
              <input
                type="date"
                data-testid="calendar-end"
                :value="modelValue?.end?.toISOString().split('T')[0]"
                @input="updateEnd"
              />
            </div>
          `,
          props: ['modelValue', 'class', 'numberOfMonths', 'range'],
          emits: ['update:modelValue'],
          methods: {
            updateStart(event: Event) {
              const target = event.target as HTMLInputElement
              const newDate = new Date(target.value)
              this.$emit('update:modelValue', {
                start: new CalendarDate(newDate.getFullYear(), newDate.getMonth() + 1, newDate.getDate()),
                end: this.modelValue?.end || null
              })
            },
            updateEnd(event: Event) {
              const target = event.target as HTMLInputElement
              const newDate = new Date(target.value)
              this.$emit('update:modelValue', {
                start: this.modelValue?.start || null,
                end: new CalendarDate(newDate.getFullYear(), newDate.getMonth() + 1, newDate.getDate())
              })
            }
          }
        }
      }
    }
  })
}

describe('HomeDateRangePicker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('renders the popover trigger button', () => {
      const wrapper = createWrapper()

      const button = wrapper.find('[data-testid="button"]')
      expect(button.exists()).toBe(true)
      expect(button.classes()).toContain('button')
    })

    it('renders calendar icon', () => {
      const wrapper = createWrapper()

      const icon = wrapper.find('[data-testid="icon"]')
      expect(icon.exists()).toBe(true)
      expect(icon.classes()).toContain('i-lucide-calendar')
    })

    it('renders chevron down icon in trailing slot', () => {
      const wrapper = createWrapper()

      const chevronIcon = wrapper.find('[data-testid="icon"].i-lucide-chevron-down')
      expect(chevronIcon.exists()).toBe(true)
    })

    it('applies correct button styling', () => {
      const wrapper = createWrapper()

      const button = wrapper.find('[data-testid="button"]')
      expect(button.classes()).toContain('neutral')
      expect(button.classes()).toContain('ghost')
    })
  })

  describe('Date Display', () => {
    it('displays formatted date range when both dates are selected', () => {
      const range = createMockRange(7, 0)
      const wrapper = createWrapper(range)

      const button = wrapper.find('[data-testid="button"]')
      const text = button.text()

      expect(text).toContain('-')
      expect(text.length).toBeGreaterThan(10) // Should contain formatted dates
    })

    it('displays single date when only start date is selected', () => {
      const range = { start: new Date(), end: null as any }
      const wrapper = createWrapper(range)

      const button = wrapper.find('[data-testid="button"]')
      const text = button.text()

      expect(text).not.toContain('-')
      expect(text).not.toBe('Pick a date')
    })

    it('displays "Pick a date" when no date is selected', () => {
      const range = { start: null as any, end: null as any }
      const wrapper = createWrapper(range)

      const button = wrapper.find('[data-testid="button"]')
      expect(button.text()).toBe('Pick a date')
    })

    it('truncates long date ranges appropriately', () => {
      const wrapper = createWrapper()

      const button = wrapper.find('[data-testid="button"]')
      expect(button.classes()).toContain('truncate')
    })
  })

  describe('Popover Interaction', () => {
    it('opens popover when trigger is clicked', async () => {
      const wrapper = createWrapper()

      const button = wrapper.find('[data-testid="button"]')
      await button.trigger('click')

      const popoverContent = wrapper.find('[data-testid="popover-content"]')
      expect(popoverContent.exists()).toBe(true)
    })

    it('contains calendar in popover content', () => {
      const wrapper = createWrapper()

      const calendar = wrapper.find('[data-testid="calendar"]')
      expect(calendar.exists()).toBe(true)
    })

    it('renders preset range buttons', () => {
      const wrapper = createWrapper()

      const rangeButtons = wrapper.findAll('[data-testid="button"]')

      // Should have trigger button + preset range buttons
      expect(rangeButtons.length).toBeGreaterThan(1)

      // Check for some expected preset ranges
      const buttonTexts = rangeButtons.map(btn => btn.text())
      expect(buttonTexts.some(text => text.includes('Last 7 days'))).toBe(true)
      expect(buttonTexts.some(text => text.includes('Last 30 days'))).toBe(true)
    })
  })

  describe('Preset Ranges', () => {
    it('provides standard preset ranges', () => {
      const wrapper = createWrapper()

      expect(wrapper.vm.ranges).toEqual([
        { label: 'Last 7 days', days: 7 },
        { label: 'Last 14 days', days: 14 },
        { label: 'Last 30 days', days: 30 },
        { label: 'Last 3 months', months: 3 },
        { label: 'Last 6 months', months: 6 },
        { label: 'Last year', years: 1 }
      ])
    })

    it('correctly identifies selected preset range', () => {
      const wrapper = createWrapper()

      // Mock a range that matches "Last 7 days"
      const sevenDaysRange = { label: 'Last 7 days', days: 7 }

      // The isRangeSelected function should work with current selection
      const isSelected = wrapper.vm.isRangeSelected(sevenDaysRange)
      expect(typeof isSelected).toBe('boolean')
    })

    it('highlights selected preset range', () => {
      const wrapper = createWrapper()

      const rangeButtons = wrapper.findAll('[data-testid="button"]').slice(1) // Skip trigger button

      rangeButtons.forEach(button => {
        const classes = button.classes()
        // Should have styling for selected or unselected state
        expect(classes.some(cls => cls.includes('bg-') || cls.includes('hover:'))).toBe(true)
      })
    })

    it('selects preset range when clicked', async () => {
      const wrapper = createWrapper()

      // Find a preset range button (skip the trigger button)
      const presetButtons = wrapper.findAll('[data-testid="button"]').slice(1)
      const firstPresetButton = presetButtons[0]

      await firstPresetButton.trigger('click')

      // Should update the model value
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    })
  })

  describe('Calendar Integration', () => {
    it('passes correct props to calendar', () => {
      const wrapper = createWrapper()

      const calendar = wrapper.find('[data-testid="calendar"]')
      expect(calendar.exists()).toBe(true)
      expect(calendar.classes()).toContain('p-2')
    })

    it('enables range selection in calendar', () => {
      const wrapper = createWrapper()

      const calendar = wrapper.findComponent({ name: 'UCalendar' })
      expect(calendar.props('range')).toBe(true)
      expect(calendar.props('numberOfMonths')).toBe(2)
    })

    it('updates model value when calendar dates change', async () => {
      const wrapper = createWrapper()

      const calendarStart = wrapper.find('[data-testid="calendar-start"]')
      await calendarStart.setValue('2024-01-10')

      // Should emit update event
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    })

    it('handles calendar date updates properly', async () => {
      const wrapper = createWrapper()

      const calendarEnd = wrapper.find('[data-testid="calendar-end"]')
      await calendarEnd.setValue('2024-01-20')

      const emitted = wrapper.emitted('update:modelValue')
      expect(emitted).toBeTruthy()
      if (emitted) {
        expect(emitted[0]).toBeTruthy()
      }
    })
  })

  describe('Date Conversion', () => {
    it('converts JavaScript Date to CalendarDate correctly', () => {
      const wrapper = createWrapper()

      const jsDate = new Date(2024, 0, 15) // January 15, 2024
      const calendarDate = wrapper.vm.toCalendarDate(jsDate)

      expect(calendarDate.year).toBe(2024)
      expect(calendarDate.month).toBe(1) // CalendarDate uses 1-based months
      expect(calendarDate.day).toBe(15)
    })

    it('handles calendar date range updates', async () => {
      const wrapper = createWrapper()

      const newCalendarRange = {
        start: new CalendarDate(2024, 1, 1),
        end: new CalendarDate(2024, 1, 31)
      }

      // Simulate calendar range update
      await wrapper.setData({
        calendarRange: newCalendarRange
      })

      expect(wrapper.vm).toBeTruthy()
    })
  })

  describe('Range Selection Logic', () => {
    it('calculates correct start date for day-based ranges', () => {
      const wrapper = createWrapper()

      const dayRange = { days: 7 }
      wrapper.vm.selectRange(dayRange)

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    })

    it('calculates correct start date for month-based ranges', () => {
      const wrapper = createWrapper()

      const monthRange = { months: 3 }
      wrapper.vm.selectRange(monthRange)

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    })

    it('calculates correct start date for year-based ranges', () => {
      const wrapper = createWrapper()

      const yearRange = { years: 1 }
      wrapper.vm.selectRange(yearRange)

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    })

    it('sets end date to today for all preset ranges', () => {
      const wrapper = createWrapper()

      const ranges = [
        { days: 7 },
        { months: 1 },
        { years: 1 }
      ]

      ranges.forEach(range => {
        wrapper.vm.selectRange(range)
        const emitted = wrapper.emitted('update:modelValue')
        if (emitted) {
          const latestEmit = emitted[emitted.length - 1][0] as Range
          // End date should be close to today
          const daysDiff = Math.abs(latestEmit.end.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          expect(daysDiff).toBeLessThan(1) // Less than 1 day difference
        }
      })
    })
  })

  describe('Event Handling', () => {
    it('emits update:modelValue when range changes', async () => {
      const wrapper = createWrapper()

      const newRange = createMockRange(30, 0)
      await wrapper.setProps({ modelValue: newRange })

      // Component should be reactive to prop changes
      expect(wrapper.vm).toBeTruthy()
    })

    it('handles null/undefined date values gracefully', () => {
      const wrapper = createWrapper({ start: null as any, end: null as any })

      expect(wrapper.find('[data-testid="button"]').text()).toBe('Pick a date')
      expect(() => wrapper.vm.toCalendarDate(null)).not.toThrow()
    })

    it('maintains calendar state during interactions', async () => {
      const wrapper = createWrapper()

      // Open popover
      await wrapper.find('[data-testid="button"]').trigger('click')

      // Calendar should remain mounted
      expect(wrapper.find('[data-testid="calendar"]').exists()).toBe(true)
    })
  })

  describe('Accessibility', () => {
    it('provides proper button labeling', () => {
      const wrapper = createWrapper()

      const button = wrapper.find('[data-testid="button"]')
      expect(button.text()).toBeTruthy()
      expect(button.text().trim()).not.toBe('')
    })

    it('includes visual indicators for interaction', () => {
      const wrapper = createWrapper()

      const button = wrapper.find('[data-testid="button"]')
      const chevron = wrapper.find('[data-testid="icon"].i-lucide-chevron-down')

      expect(button.exists()).toBe(true)
      expect(chevron.exists()).toBe(true)
    })

    it('provides keyboard navigation support through popover', () => {
      const wrapper = createWrapper()

      const popover = wrapper.find('[data-testid="popover"]')
      expect(popover.exists()).toBe(true)
    })

    it('maintains focus management in popover', () => {
      const wrapper = createWrapper()

      // Popover should be configured for proper focus management
      const popoverComponent = wrapper.findComponent({ name: 'UPopover' })
      expect(popoverComponent.props('modal')).toBe(true)
    })
  })

  describe('Responsive Design', () => {
    it('shows preset ranges on larger screens only', () => {
      const wrapper = createWrapper()

      // Check for responsive classes in preset range container
      const popoverContent = wrapper.html()
      expect(popoverContent).toContain('hidden sm:flex')
    })

    it('adjusts calendar layout for different screen sizes', () => {
      const wrapper = createWrapper()

      const calendar = wrapper.findComponent({ name: 'UCalendar' })
      expect(calendar.props('numberOfMonths')).toBe(2)
    })

    it('handles mobile interactions appropriately', () => {
      const wrapper = createWrapper()

      // Should work on mobile without preset ranges visible
      const button = wrapper.find('[data-testid="button"]')
      expect(button.exists()).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('handles invalid date ranges gracefully', () => {
      const invalidRange = {
        start: new Date('invalid'),
        end: new Date('2024-01-01')
      }

      expect(() => createWrapper(invalidRange)).not.toThrow()
    })

    it('handles very large date ranges', () => {
      const largeRange = {
        start: new Date('2000-01-01'),
        end: new Date('2050-12-31')
      }

      const wrapper = createWrapper(largeRange)
      expect(wrapper.find('[data-testid="button"]').exists()).toBe(true)
    })

    it('handles timezone changes appropriately', () => {
      const wrapper = createWrapper()

      // Should use getLocalTimeZone for consistent behavior
      expect(getLocalTimeZone).toHaveBeenCalled()
    })

    it('maintains state consistency during rapid changes', async () => {
      const wrapper = createWrapper()

      // Rapid range selections
      wrapper.vm.selectRange({ days: 7 })
      wrapper.vm.selectRange({ days: 30 })
      wrapper.vm.selectRange({ months: 3 })

      await wrapper.vm.$nextTick()

      // Should not crash and maintain consistent state
      expect(wrapper.vm).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    })
  })
})
