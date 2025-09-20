import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, nextTick } from 'vue'
import HomePeriodSelect from '~/components/home/HomePeriodSelect.vue'
import type { Period, Range } from '~/types'
import { eachDayOfInterval } from 'date-fns'

// Mock date-fns
vi.mock('date-fns', () => ({
  eachDayOfInterval: vi.fn()
}))

const mockEachDayOfInterval = eachDayOfInterval as vi.MockedFunction<typeof eachDayOfInterval>

const createMockRange = (days: number): Range => {
  const end = new Date('2024-01-31')
  const start = new Date('2024-01-01')
  start.setDate(end.getDate() - days)

  return { start, end }
}

const createWrapper = (props: { range: Range; modelValue?: Period } = { range: createMockRange(7) }) => {
  return mount(HomePeriodSelect, {
    props: {
      modelValue: props.modelValue || 'daily',
      range: props.range,
      'onUpdate:modelValue': (value: Period) => wrapper.setProps({ modelValue: value })
    },
    global: {
      stubs: {
        USelect: {
          template: `
            <select
              data-testid="select"
              :class="['select', variant, $attrs.class]"
              @change="$emit('update:modelValue', $event.target.value)"
            >
              <option
                v-for="item in items"
                :key="item"
                :value="item"
                :selected="modelValue === item"
              >
                {{ item }}
              </option>
            </select>
          `,
          props: ['modelValue', 'items', 'variant', 'class', 'ui'],
          emits: ['update:modelValue']
        }
      }
    }
  })
}

describe('HomePeriodSelect', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock implementation
    mockEachDayOfInterval.mockImplementation((range: Range) => {
      const days: Date[] = []
      const current = new Date(range.start)

      while (current <= range.end) {
        days.push(new Date(current))
        current.setDate(current.getDate() + 1)
      }

      return days
    })
  })

  describe('Component Rendering', () => {
    it('renders a select element', () => {
      const wrapper = createWrapper()

      const select = wrapper.find('[data-testid="select"]')
      expect(select.exists()).toBe(true)
    })

    it('applies correct styling classes', () => {
      const wrapper = createWrapper()

      const select = wrapper.find('[data-testid="select"]')
      expect(select.classes()).toContain('ghost')
      expect(select.attributes('class')).toContain('data-[state=open]:bg-elevated')
    })

    it('configures UI properties correctly', () => {
      const wrapper = createWrapper()

      const selectComponent = wrapper.findComponent({ name: 'USelect' })
      const ui = selectComponent.props('ui')

      expect(ui).toEqual({
        value: 'capitalize',
        itemLabel: 'capitalize',
        trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200'
      })
    })
  })

  describe('Period Options Logic', () => {
    it('shows only daily for ranges <= 8 days', () => {
      mockEachDayOfInterval.mockReturnValue(Array(7).fill(0).map((_, i) => new Date()))

      const wrapper = createWrapper({
        range: createMockRange(7)
      })

      expect(wrapper.vm.periods).toEqual(['daily'])
    })

    it('shows daily and weekly for ranges <= 31 days', () => {
      mockEachDayOfInterval.mockReturnValue(Array(20).fill(0).map((_, i) => new Date()))

      const wrapper = createWrapper({
        range: createMockRange(20)
      })

      expect(wrapper.vm.periods).toEqual(['daily', 'weekly'])
    })

    it('shows weekly and monthly for ranges > 31 days', () => {
      mockEachDayOfInterval.mockReturnValue(Array(60).fill(0).map((_, i) => new Date()))

      const wrapper = createWrapper({
        range: createMockRange(60)
      })

      expect(wrapper.vm.periods).toEqual(['weekly', 'monthly'])
    })

    it('updates periods when range changes', async () => {
      mockEachDayOfInterval.mockReturnValue(Array(7).fill(0).map((_, i) => new Date()))

      const wrapper = createWrapper({
        range: createMockRange(7)
      })

      expect(wrapper.vm.periods).toEqual(['daily'])

      // Change range to larger
      mockEachDayOfInterval.mockReturnValue(Array(45).fill(0).map((_, i) => new Date()))

      await wrapper.setProps({ range: createMockRange(45) })
      await nextTick()

      expect(wrapper.vm.periods).toEqual(['weekly', 'monthly'])
    })
  })

  describe('Model Value Management', () => {
    it('uses provided model value', () => {
      const wrapper = createWrapper({
        range: createMockRange(20),
        modelValue: 'weekly'
      })

      const select = wrapper.find('[data-testid="select"]')
      const selectedOption = select.find('option[selected]')
      expect(selectedOption.text()).toBe('weekly')
    })

    it('emits update when selection changes', async () => {
      const wrapper = createWrapper({
        range: createMockRange(20)
      })

      const select = wrapper.find('[data-testid="select"]')
      await select.setValue('weekly')

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')![0]).toEqual(['weekly'])
    })

    it('automatically adjusts model value when periods change', async () => {
      mockEachDayOfInterval.mockReturnValue(Array(20).fill(0).map((_, i) => new Date()))

      const wrapper = createWrapper({
        range: createMockRange(20),
        modelValue: 'weekly'
      })

      expect(wrapper.vm.periods).toEqual(['daily', 'weekly'])
      expect(wrapper.props('modelValue')).toBe('weekly')

      // Change to a range that doesn't support weekly
      mockEachDayOfInterval.mockReturnValue(Array(5).fill(0).map((_, i) => new Date()))

      await wrapper.setProps({ range: createMockRange(5) })
      await nextTick()

      expect(wrapper.vm.periods).toEqual(['daily'])

      // Should auto-adjust to the first available period
      await nextTick()
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    })

    it('maintains valid model value when current value is still available', async () => {
      mockEachDayOfInterval.mockReturnValue(Array(20).fill(0).map((_, i) => new Date()))

      const wrapper = createWrapper({
        range: createMockRange(20),
        modelValue: 'daily'
      })

      expect(wrapper.vm.periods).toEqual(['daily', 'weekly'])

      // Change to a range that still supports daily
      mockEachDayOfInterval.mockReturnValue(Array(25).fill(0).map((_, i) => new Date()))

      await wrapper.setProps({ range: createMockRange(25) })
      await nextTick()

      expect(wrapper.vm.periods).toEqual(['daily', 'weekly'])

      // Should not emit update if current value is still valid
      const initialEmitCount = wrapper.emitted('update:modelValue')?.length || 0

      await nextTick()

      const finalEmitCount = wrapper.emitted('update:modelValue')?.length || 0
      expect(finalEmitCount).toBe(initialEmitCount)
    })
  })

  describe('Computed Properties', () => {
    it('calculates periods based on day count', () => {
      // Test different day counts
      const testCases = [
        { days: 5, expected: ['daily'] },
        { days: 8, expected: ['daily'] },
        { days: 15, expected: ['daily', 'weekly'] },
        { days: 31, expected: ['daily', 'weekly'] },
        { days: 60, expected: ['weekly', 'monthly'] },
        { days: 365, expected: ['weekly', 'monthly'] }
      ]

      testCases.forEach(({ days, expected }) => {
        mockEachDayOfInterval.mockReturnValue(Array(days).fill(0).map((_, i) => new Date()))

        const wrapper = createWrapper({
          range: createMockRange(days)
        })

        expect(wrapper.vm.periods).toEqual(expected)
      })
    })

    it('reacts to changes in computed days', async () => {
      mockEachDayOfInterval.mockReturnValue(Array(10).fill(0).map((_, i) => new Date()))

      const wrapper = createWrapper()

      expect(wrapper.vm.days).toHaveLength(10)
      expect(wrapper.vm.periods).toEqual(['daily', 'weekly'])

      // Simulate range change
      mockEachDayOfInterval.mockReturnValue(Array(50).fill(0).map((_, i) => new Date()))

      await wrapper.setProps({ range: createMockRange(50) })
      await nextTick()

      expect(wrapper.vm.days).toHaveLength(50)
      expect(wrapper.vm.periods).toEqual(['weekly', 'monthly'])
    })
  })

  describe('Watchers', () => {
    it('watches periods array for changes', async () => {
      mockEachDayOfInterval.mockReturnValue(Array(15).fill(0).map((_, i) => new Date()))

      const wrapper = createWrapper({
        range: createMockRange(15),
        modelValue: 'daily'
      })

      expect(wrapper.vm.periods).toEqual(['daily', 'weekly'])

      // Change to range that only supports weekly/monthly
      mockEachDayOfInterval.mockReturnValue(Array(45).fill(0).map((_, i) => new Date()))

      await wrapper.setProps({ range: createMockRange(45) })
      await nextTick()

      // Should automatically update to first valid period
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      const lastEmit = wrapper.emitted('update:modelValue')!.slice(-1)[0]
      expect(lastEmit).toEqual(['weekly'])
    })

    it('does not trigger unnecessary updates when model value is valid', async () => {
      mockEachDayOfInterval.mockReturnValue(Array(20).fill(0).map((_, i) => new Date()))

      const wrapper = createWrapper({
        range: createMockRange(20),
        modelValue: 'daily'
      })

      const initialEmitCount = wrapper.emitted('update:modelValue')?.length || 0

      // Change range but keep daily as valid option
      mockEachDayOfInterval.mockReturnValue(Array(25).fill(0).map((_, i) => new Date()))

      await wrapper.setProps({ range: createMockRange(25) })
      await nextTick()

      const finalEmitCount = wrapper.emitted('update:modelValue')?.length || 0
      expect(finalEmitCount).toBe(initialEmitCount)
    })
  })

  describe('Integration with date-fns', () => {
    it('calls eachDayOfInterval with correct range', () => {
      const range = createMockRange(15)
      createWrapper({ range })

      expect(mockEachDayOfInterval).toHaveBeenCalledWith(range)
    })

    it('handles date-fns errors gracefully', () => {
      mockEachDayOfInterval.mockImplementation(() => {
        throw new Error('Invalid date range')
      })

      expect(() => createWrapper()).not.toThrow()
    })

    it('uses date-fns result to determine period options', () => {
      const mockDays = Array(12).fill(0).map((_, i) => new Date(2024, 0, i + 1))
      mockEachDayOfInterval.mockReturnValue(mockDays)

      const wrapper = createWrapper()

      expect(wrapper.vm.days).toEqual(mockDays)
      expect(wrapper.vm.periods).toEqual(['daily', 'weekly'])
    })
  })

  describe('User Interaction', () => {
    it('responds to user selection', async () => {
      mockEachDayOfInterval.mockReturnValue(Array(30).fill(0).map((_, i) => new Date()))

      const wrapper = createWrapper({
        range: createMockRange(30)
      })

      const select = wrapper.find('[data-testid="select"]')
      await select.setValue('weekly')

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')![0]).toEqual(['weekly'])
    })

    it('shows available options in select', () => {
      mockEachDayOfInterval.mockReturnValue(Array(25).fill(0).map((_, i) => new Date()))

      const wrapper = createWrapper({
        range: createMockRange(25)
      })

      const options = wrapper.findAll('option')
      const optionTexts = options.map(opt => opt.text())

      expect(optionTexts).toEqual(['daily', 'weekly'])
    })

    it('capitalizes option labels', () => {
      const wrapper = createWrapper()

      const selectComponent = wrapper.findComponent({ name: 'USelect' })
      const ui = selectComponent.props('ui')

      expect(ui.itemLabel).toBe('capitalize')
      expect(ui.value).toBe('capitalize')
    })
  })

  describe('Accessibility', () => {
    it('provides proper form control structure', () => {
      const wrapper = createWrapper()

      const select = wrapper.find('[data-testid="select"]')
      expect(select.exists()).toBe(true)
      expect(select.element.tagName.toLowerCase()).toBe('select')
    })

    it('includes proper options for screen readers', () => {
      mockEachDayOfInterval.mockReturnValue(Array(20).fill(0).map((_, i) => new Date()))

      const wrapper = createWrapper({
        range: createMockRange(20)
      })

      const options = wrapper.findAll('option')
      expect(options.length).toBe(2) // daily, weekly

      options.forEach(option => {
        expect(option.text()).toBeTruthy()
        expect(option.attributes('value')).toBeTruthy()
      })
    })

    it('maintains focus management', () => {
      const wrapper = createWrapper()

      const select = wrapper.find('[data-testid="select"]')
      expect(select.element.tagName.toLowerCase()).toBe('select')
      // Native select elements handle focus automatically
    })
  })

  describe('Visual Design', () => {
    it('applies ghost variant styling', () => {
      const wrapper = createWrapper()

      const select = wrapper.find('[data-testid="select"]')
      expect(select.classes()).toContain('ghost')
    })

    it('includes hover and focus states', () => {
      const wrapper = createWrapper()

      const select = wrapper.find('[data-testid="select"]')
      expect(select.attributes('class')).toContain('data-[state=open]:bg-elevated')
    })

    it('includes transition animation for trailing icon', () => {
      const wrapper = createWrapper()

      const selectComponent = wrapper.findComponent({ name: 'USelect' })
      const ui = selectComponent.props('ui')

      expect(ui.trailingIcon).toContain('rotate-180')
      expect(ui.trailingIcon).toContain('transition-transform')
      expect(ui.trailingIcon).toContain('duration-200')
    })
  })

  describe('Edge Cases', () => {
    it('handles empty date ranges', () => {
      mockEachDayOfInterval.mockReturnValue([])

      const wrapper = createWrapper()

      expect(wrapper.vm.days).toEqual([])
      expect(wrapper.vm.periods).toEqual(['daily']) // Fallback to daily for empty ranges
    })

    it('handles single day ranges', () => {
      mockEachDayOfInterval.mockReturnValue([new Date()])

      const wrapper = createWrapper()

      expect(wrapper.vm.days).toHaveLength(1)
      expect(wrapper.vm.periods).toEqual(['daily'])
    })

    it('handles very large date ranges', () => {
      const largeDayArray = Array(1000).fill(0).map((_, i) => new Date())
      mockEachDayOfInterval.mockReturnValue(largeDayArray)

      const wrapper = createWrapper()

      expect(wrapper.vm.days).toHaveLength(1000)
      expect(wrapper.vm.periods).toEqual(['weekly', 'monthly'])
    })

    it('handles invalid model values gracefully', async () => {
      mockEachDayOfInterval.mockReturnValue(Array(10).fill(0).map((_, i) => new Date()))

      const wrapper = createWrapper({
        range: createMockRange(10),
        modelValue: 'yearly' as Period // Invalid period
      })

      expect(wrapper.vm.periods).toEqual(['daily', 'weekly'])

      // Should auto-correct to valid period
      await nextTick()
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    })

    it('handles rapid range changes', async () => {
      const wrapper = createWrapper()

      // Rapid successive changes
      for (let i = 5; i <= 50; i += 5) {
        mockEachDayOfInterval.mockReturnValue(Array(i).fill(0).map(() => new Date()))
        await wrapper.setProps({ range: createMockRange(i) })
      }

      await nextTick()

      // Should handle all changes without crashing
      expect(wrapper.vm).toBeTruthy()
      expect(wrapper.vm.periods).toEqual(['weekly', 'monthly']) // Final state
    })
  })
})
