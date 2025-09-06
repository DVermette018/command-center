import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useErrorToast } from '@/composables/useErrorToast'
import { mockNuxtComposables } from '../setup'

describe('useErrorToast', () => {
  let mockToast: ReturnType<typeof mockNuxtComposables>['useToast']

  beforeEach(() => {
    const { useToast } = mockNuxtComposables()
    mockToast = useToast()
    // Reset mock calls
    vi.clearAllMocks()
    // Set up the global useToast to return our mock
    global.useToast = vi.fn(() => mockToast)
  })

  describe('Error Toast Creation', () => {
    it('should create error toast with default configuration', () => {
      const { showError } = useErrorToast()
      
      showError('Something went wrong')

      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          description: 'Something went wrong',
          color: 'red',
          icon: 'i-lucide-alert-circle',
          timeout: 5000
        })
      )
    })

    it('should create error toast with custom title', () => {
      const { showError } = useErrorToast()
      
      showError('Validation failed', 'Form Error')

      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Form Error',
          description: 'Validation failed',
          color: 'red',
          icon: 'i-lucide-alert-circle',
          timeout: 5000
        })
      )
    })

    it('should create error toast with custom configuration', () => {
      const { showError } = useErrorToast()
      
      showError('Critical error', 'System Error', {
        timeout: 0, // Persistent
        color: 'orange',
        icon: 'i-lucide-alert-triangle'
      })

      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'System Error',
          description: 'Critical error',
          color: 'orange',
          icon: 'i-lucide-alert-triangle',
          timeout: 0
        })
      )
    })
  })

  describe('Success Toast Creation', () => {
    it('should create success toast with default configuration', () => {
      const { showSuccess } = useErrorToast()
      
      showSuccess('Operation completed')

      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Success',
          description: 'Operation completed',
          color: 'green',
          icon: 'i-lucide-check-circle',
          timeout: 3000
        })
      )
    })

    it('should create success toast with custom title', () => {
      const { showSuccess } = useErrorToast()
      
      showSuccess('Customer created', 'Data Saved')

      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Data Saved',
          description: 'Customer created',
          color: 'green',
          icon: 'i-lucide-check-circle',
          timeout: 3000
        })
      )
    })
  })

  describe('Warning Toast Creation', () => {
    it('should create warning toast with default configuration', () => {
      const { showWarning } = useErrorToast()
      
      showWarning('Connection unstable')

      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Warning',
          description: 'Connection unstable',
          color: 'yellow',
          icon: 'i-lucide-alert-triangle',
          timeout: 4000
        })
      )
    })
  })

  describe('Info Toast Creation', () => {
    it('should create info toast with default configuration', () => {
      const { showInfo } = useErrorToast()
      
      showInfo('New features available')

      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Info',
          description: 'New features available',
          color: 'blue',
          icon: 'i-lucide-info',
          timeout: 4000
        })
      )
    })
  })

  describe('Toast Actions', () => {
    it('should add retry action to error toast', () => {
      const { showError } = useErrorToast()
      const retryFn = vi.fn()
      
      showError('Operation failed', 'Error', { 
        actions: [{ label: 'Retry', click: retryFn }]
      })

      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          description: 'Operation failed',
          color: 'red',
          icon: 'i-lucide-alert-circle',
          timeout: 5000,
          'aria-live': 'assertive',
          role: 'alert',
          actions: [
            expect.objectContaining({
              label: 'Retry',
              click: retryFn,
              'aria-keyshortcuts': undefined
            })
          ]
        })
      )
    })

    it('should add multiple actions to toast', () => {
      const { showError } = useErrorToast()
      const retryFn = vi.fn()
      const dismissFn = vi.fn()
      
      showError('Sync failed', 'Sync Error', {
        actions: [
          { label: 'Retry', click: retryFn },
          { label: 'Dismiss', click: dismissFn }
        ]
      })

      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          actions: [
            { label: 'Retry', click: retryFn },
            { label: 'Dismiss', click: dismissFn }
          ]
        })
      )
    })
  })

  describe('Auto-dismiss Management', () => {
    it('should create persistent toast when timeout is 0', () => {
      const { showError } = useErrorToast()
      
      showError('Critical system error', 'System Error', { timeout: 0 })

      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 0
        })
      )
    })

    it('should use different timeouts for different severity levels', () => {
      const toast = useErrorToast()

      toast.showError('Error message') // 5000ms
      toast.showWarning('Warning message') // 4000ms  
      toast.showSuccess('Success message') // 3000ms
      toast.showInfo('Info message') // 4000ms

      expect(mockToast.add).toHaveBeenNthCalledWith(1, expect.objectContaining({ timeout: 5000 }))
      expect(mockToast.add).toHaveBeenNthCalledWith(2, expect.objectContaining({ timeout: 4000 }))
      expect(mockToast.add).toHaveBeenNthCalledWith(3, expect.objectContaining({ timeout: 3000 }))
      expect(mockToast.add).toHaveBeenNthCalledWith(4, expect.objectContaining({ timeout: 4000 }))
    })
  })

  describe('Toast Grouping', () => {
    it('should group similar error messages', () => {
      const { showError } = useErrorToast({ enableGrouping: true })
      
      // Show same error multiple times - the implementation groups on the 3rd call
      showError('Network error')
      showError('Network error')
      showError('Network error')

      // The implementation creates the final grouped toast only on the 3rd call
      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Network error (3)',
        })
      )
    })

    it('should update existing toast when grouped', () => {
      const { showError } = useErrorToast({ enableGrouping: true })
      
      showError('API timeout')
      const firstCallArgs = mockToast.add.mock.calls[0][0]
      
      showError('API timeout')
      
      expect(mockToast.remove).toHaveBeenCalledWith(firstCallArgs.id)
      expect(mockToast.add).toHaveBeenLastCalledWith(
        expect.objectContaining({
          description: 'API timeout (2)',
        })
      )
    })

    it('should not group different error messages', () => {
      const { showError } = useErrorToast({ enableGrouping: true })
      
      showError('Network error')
      showError('Validation error')

      expect(mockToast.add).toHaveBeenCalledTimes(2)
      expect(mockToast.add).toHaveBeenNthCalledWith(1, 
        expect.objectContaining({ description: 'Network error' })
      )
      expect(mockToast.add).toHaveBeenNthCalledWith(2, 
        expect.objectContaining({ description: 'Validation error' })
      )
    })
  })

  describe('Toast Queue Management', () => {
    it('should limit number of concurrent toasts', () => {
      const { showError } = useErrorToast({ maxConcurrentToasts: 3 })
      
      // Add 5 toasts
      showError('Error 1')
      showError('Error 2')
      showError('Error 3')
      showError('Error 4') // Should remove oldest
      showError('Error 5') // Should remove oldest

      expect(mockToast.add).toHaveBeenCalledTimes(5)
      expect(mockToast.remove).toHaveBeenCalledTimes(2) // Removed 2 oldest
    })

    it('should prioritize error severity in queue management', () => {
      const toast = useErrorToast({ maxConcurrentToasts: 2 })
      
      toast.showInfo('Info message')
      toast.showWarning('Warning message')
      toast.showError('Error message') // Should remove info toast

      expect(mockToast.remove).toHaveBeenCalledWith(
        expect.objectContaining({ color: 'blue' }) // Info toast
      )
    })
  })

  describe('Accessibility Features', () => {
    it('should add screen reader announcement for errors', () => {
      const { showError } = useErrorToast()
      
      showError('Form validation failed')

      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          'aria-live': 'assertive',
          role: 'alert'
        })
      )
    })

    it('should add screen reader announcement for success messages', () => {
      const { showSuccess } = useErrorToast()
      
      showSuccess('Data saved successfully')

      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          'aria-live': 'polite',
          role: 'status'
        })
      )
    })

    it('should support keyboard navigation for toast actions', () => {
      const { showError } = useErrorToast()
      const retryFn = vi.fn()
      
      showError('Operation failed', 'Error', {
        actions: [{ 
          label: 'Retry', 
          click: retryFn,
          key: 'r' // Keyboard shortcut
        }]
      })

      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          actions: [expect.objectContaining({
            key: 'r',
            'aria-keyshortcuts': 'r'
          })]
        })
      )
    })
  })

  describe('Error Context Integration', () => {
    it('should extract user-friendly message from TRPC errors', () => {
      const { showTRPCError } = useErrorToast()
      
      const trpcError = {
        data: {
          code: 'BAD_REQUEST',
          httpStatus: 400
        },
        message: 'Email is already in use'
      }

      showTRPCError(trpcError)

      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Validation Error',
          description: 'Email is already in use'
        })
      )
    })

    it('should handle network errors appropriately', () => {
      const { showNetworkError } = useErrorToast()
      
      showNetworkError()

      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Connection Error',
          description: 'Please check your internet connection',
          color: 'orange',
          timeout: 8000
        })
      )
    })

    it('should provide offline-specific messaging', () => {
      const { showOfflineError } = useErrorToast()
      
      showOfflineError('sync')

      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Offline Mode',
          description: 'Changes will sync when connection is restored',
          color: 'yellow',
          icon: 'i-lucide-wifi-off'
        })
      )
    })
  })

  describe('Performance Considerations', () => {
    it('should debounce rapid identical error messages', () => {
      const { showError } = useErrorToast({ debounceMs: 100 })
      
      // Rapid fire same error
      showError('Rate limit exceeded')
      showError('Rate limit exceeded')
      showError('Rate limit exceeded')

      expect(mockToast.add).toHaveBeenCalledTimes(1)
    })

    it('should cleanup toast references on unmount', () => {
      const { clearAllToasts } = useErrorToast()
      
      clearAllToasts()

      expect(mockToast.clear).toHaveBeenCalled()
    })
  })
})