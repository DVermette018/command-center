import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockRouter, mockRoute, resetNuxtMocks } from '../mocks/nuxt'

// Import the composable directly without mocking #imports
import { useDashboard } from '../../app/composables/useDashboard'

describe('useDashboard', () => {
  beforeEach(() => {
    resetNuxtMocks()
    vi.clearAllMocks()
    
    // Reset the shared composable by clearing the createSharedComposable cache
    try {
      const dashboard = useDashboard()
      if (dashboard && dashboard.isNotificationsSlideoverOpen) {
        dashboard.isNotificationsSlideoverOpen.value = false
      }
    } catch (error) {
      // Ignore errors during reset - composable might not be initialized yet
    }
  })

  it('initializes with correct default state', () => {
    const dashboard = useDashboard()
    
    expect(dashboard).toBeDefined()
    expect(dashboard.isNotificationsSlideoverOpen).toBeDefined()
    expect(dashboard.isNotificationsSlideoverOpen.value).toBe(false)
  })

  it('returns the same instance when called multiple times (shared composable)', () => {
    const dashboard1 = useDashboard()
    const dashboard2 = useDashboard()
    
    expect(dashboard1).toBe(dashboard2)
  })

  it('maintains state across multiple calls', () => {
    const dashboard1 = useDashboard()
    dashboard1.isNotificationsSlideoverOpen.value = true
    
    const dashboard2 = useDashboard()
    expect(dashboard2.isNotificationsSlideoverOpen.value).toBe(true)
  })

  it('allows toggling notifications slideover state', () => {
    const dashboard = useDashboard()
    
    // Initially false
    expect(dashboard.isNotificationsSlideoverOpen.value).toBe(false)
    
    // Toggle to true
    dashboard.isNotificationsSlideoverOpen.value = true
    expect(dashboard.isNotificationsSlideoverOpen.value).toBe(true)
    
    // Toggle back to false
    dashboard.isNotificationsSlideoverOpen.value = false
    expect(dashboard.isNotificationsSlideoverOpen.value).toBe(false)
  })

  describe('Integration with Vue reactivity', () => {
    it('maintains reactivity when toggling notifications multiple times', () => {
      const dashboard = useDashboard()
      
      // Test rapid toggling
      for (let i = 0; i < 10; i++) {
        dashboard.isNotificationsSlideoverOpen.value = i % 2 === 0
        expect(dashboard.isNotificationsSlideoverOpen.value).toBe(i % 2 === 0)
      }
    })

    it('preserves reactivity across component instances', () => {
      const dashboard1 = useDashboard()
      const dashboard2 = useDashboard()
      
      // Change state through first instance
      dashboard1.isNotificationsSlideoverOpen.value = true
      
      // Verify it's reflected in second instance
      expect(dashboard2.isNotificationsSlideoverOpen.value).toBe(true)
      
      // Change state through second instance
      dashboard2.isNotificationsSlideoverOpen.value = false
      
      // Verify it's reflected in first instance
      expect(dashboard1.isNotificationsSlideoverOpen.value).toBe(false)
    })
  })

  describe('Performance and memory considerations', () => {
    it('creates a single shared instance', () => {
      const instances = []
      
      // Create multiple instances
      for (let i = 0; i < 5; i++) {
        instances.push(useDashboard())
      }
      
      // All should be the same reference
      instances.forEach(instance => {
        expect(instance).toBe(instances[0])
      })
    })

    it('maintains consistent state across all references', () => {
      const instances = Array(5).fill(null).map(() => useDashboard())
      
      // Change state in first instance
      instances[0].isNotificationsSlideoverOpen.value = true
      
      // All instances should reflect the change
      instances.forEach(instance => {
        expect(instance.isNotificationsSlideoverOpen.value).toBe(true)
      })
      
      // Change state in middle instance
      instances[2].isNotificationsSlideoverOpen.value = false
      
      // All instances should reflect the change
      instances.forEach(instance => {
        expect(instance.isNotificationsSlideoverOpen.value).toBe(false)
      })
    })
  })

  describe('Return value structure', () => {
    it('returns expected properties', () => {
      const dashboard = useDashboard()
      
      expect(dashboard).toHaveProperty('isNotificationsSlideoverOpen')
      expect(typeof dashboard.isNotificationsSlideoverOpen).toBe('object')
      expect(dashboard.isNotificationsSlideoverOpen).toHaveProperty('value')
    })

    it('only exposes expected public API', () => {
      const dashboard = useDashboard()
      const keys = Object.keys(dashboard)
      
      expect(keys).toEqual(['isNotificationsSlideoverOpen'])
    })
  })

  describe('Edge cases', () => {
    it('handles multiple rapid state changes', () => {
      const dashboard = useDashboard()
      
      // Rapid state changes
      for (let i = 0; i < 100; i++) {
        dashboard.isNotificationsSlideoverOpen.value = !dashboard.isNotificationsSlideoverOpen.value
      }
      
      // Should end up in false state (started false, 100 toggles)
      expect(dashboard.isNotificationsSlideoverOpen.value).toBe(false)
    })

    it('handles state changes during composable creation', () => {
      const dashboard1 = useDashboard()
      dashboard1.isNotificationsSlideoverOpen.value = true
      
      // Create new reference while state is true
      const dashboard2 = useDashboard()
      
      expect(dashboard2.isNotificationsSlideoverOpen.value).toBe(true)
      expect(dashboard1).toBe(dashboard2)
    })
  })

  describe('Type safety', () => {
    it('maintains proper TypeScript types', () => {
      const dashboard = useDashboard()
      
      // Should be a ref with boolean value
      expect(typeof dashboard.isNotificationsSlideoverOpen.value).toBe('boolean')
      
      // Should allow boolean assignment
      dashboard.isNotificationsSlideoverOpen.value = true
      expect(dashboard.isNotificationsSlideoverOpen.value).toBe(true)
      
      dashboard.isNotificationsSlideoverOpen.value = false
      expect(dashboard.isNotificationsSlideoverOpen.value).toBe(false)
    })
  })
})