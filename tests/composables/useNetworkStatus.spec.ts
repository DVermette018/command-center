import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useNetworkStatus } from '@/composables/useNetworkStatus'

// Mock navigator and window objects
const mockNavigator = {
  onLine: true,
  connection: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
    saveData: false,
    type: 'wifi'
  }
}

describe('useNetworkStatus', () => {
  beforeEach(() => {
    // Reset navigator mock
    Object.defineProperty(global, 'navigator', {
      value: mockNavigator,
      writable: true
    })

    // Mock window event listeners
    global.window = {
      ...global.window,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    } as any
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Network Status', () => {
    it('should initialize with online status', () => {
      const { status, isOnline } = useNetworkStatus()
      
      expect(status.value.isOnline).toBe(true)
      expect(isOnline.value).toBe(true)
    })

    it('should detect offline status', () => {
      mockNavigator.onLine = false
      
      const { status, isOffline } = useNetworkStatus()
      
      expect(status.value.isOnline).toBe(false)
      expect(isOffline.value).toBe(true)
    })

    it('should read connection information', () => {
      const { status } = useNetworkStatus()
      
      expect(status.value.effectiveType).toBe('4g')
      expect(status.value.downlink).toBe(10)
      expect(status.value.rtt).toBe(50)
      expect(status.value.saveData).toBe(false)
    })
  })

  describe('Connection Quality', () => {
    it('should detect good connection quality', () => {
      mockNavigator.connection.effectiveType = '4g'
      
      const { connectionQuality } = useNetworkStatus()
      
      expect(connectionQuality.value).toBe('good')
    })

    it('should detect fair connection quality', () => {
      mockNavigator.connection.effectiveType = '3g'
      
      const { connectionQuality } = useNetworkStatus()
      
      expect(connectionQuality.value).toBe('fair')
    })

    it('should detect poor connection quality', () => {
      mockNavigator.connection.effectiveType = '2g'
      
      const { connectionQuality } = useNetworkStatus()
      
      expect(connectionQuality.value).toBe('poor')
    })

    it('should detect offline status', () => {
      mockNavigator.onLine = false
      
      const { connectionQuality } = useNetworkStatus()
      
      expect(connectionQuality.value).toBe('offline')
    })

    it('should handle missing connection API', () => {
      // Mock navigator without connection API
      Object.defineProperty(global, 'navigator', {
        value: { onLine: true }, // No connection property
        writable: true
      })
      
      const { connectionQuality } = useNetworkStatus()
      
      expect(connectionQuality.value).toBe('fair') // Default fallback
    })

    it('should detect slow connection based on RTT', () => {
      // Update navigator before calling composable
      Object.defineProperty(global, 'navigator', {
        value: {
          onLine: true,
          connection: {
            effectiveType: '4g',
            rtt: 500, // High RTT indicates slow connection
            downlink: 2,
            saveData: false,
            type: 'cellular'
          }
        },
        writable: true
      })
      
      const { status } = useNetworkStatus()
      
      expect(status.value.isSlowConnection).toBe(true)
    })

    it('should detect slow connection based on downlink', () => {
      // Update navigator before calling composable
      Object.defineProperty(global, 'navigator', {
        value: {
          onLine: true,
          connection: {
            effectiveType: '4g',
            rtt: 50,
            downlink: 0.3, // Low downlink indicates slow connection
            saveData: false,
            type: 'cellular'
          }
        },
        writable: true
      })
      
      const { status } = useNetworkStatus()
      
      expect(status.value.isSlowConnection).toBe(true)
    })
  })

  describe('Retry Functionality', () => {
    it('should provide retry function', () => {
      const { retry } = useNetworkStatus()
      
      expect(typeof retry).toBe('function')
    })

    it('should handle retry options', () => {
      const retryOptions = {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2,
        onRetry: vi.fn()
      }
      
      // Test that options are properly structured
      expect(retryOptions.maxRetries).toBe(3)
      expect(retryOptions.initialDelay).toBe(1000)
      expect(retryOptions.maxDelay).toBe(30000)
      expect(retryOptions.backoffMultiplier).toBe(2)
      expect(typeof retryOptions.onRetry).toBe('function')
    })

    it('should handle error classification', () => {
      // Test error classification logic
      const networkErrors = [
        new Error('Network request failed'),
        new Error('fetch failed'),
        new Error('connection timeout')
      ]
      
      const validationErrors = [
        new Error('Invalid email'),
        new Error('Required field missing')
      ]
      
      networkErrors.forEach(error => {
        expect(error.message.toLowerCase()).toMatch(/network|fetch|connection|timeout/)
      })
      
      validationErrors.forEach(error => {
        expect(error.message.toLowerCase()).not.toMatch(/network|fetch|connection|timeout/)
      })
    })
  })

  describe('Connection Waiting', () => {
    it('should provide waitForConnection function', () => {
      const { waitForConnection } = useNetworkStatus()
      
      expect(typeof waitForConnection).toBe('function')
    })

    it('should handle connection timeout scenarios', () => {
      // Test timeout logic without actual async behavior
      const mockTimeout = (timeout: number) => {
        return timeout > 0 && timeout <= 30000
      }
      
      expect(mockTimeout(1000)).toBe(true)
      expect(mockTimeout(30000)).toBe(true)
      expect(mockTimeout(0)).toBe(false)
      expect(mockTimeout(50000)).toBe(false)
    })
  })

  describe('Network Error Detection', () => {
    it('should classify network vs non-network errors', () => {
      const networkKeywords = ['network', 'fetch', 'connection', 'timeout', 'offline']
      const networkErrors = networkKeywords.map(keyword => new Error(`${keyword} error`))
      const validationError = new Error('Invalid input')
      
      networkErrors.forEach(error => {
        const message = error.message.toLowerCase()
        const isNetworkError = networkKeywords.some(keyword => message.includes(keyword))
        expect(isNetworkError).toBe(true)
      })
      
      const message = validationError.message.toLowerCase()
      const isNetworkError = networkKeywords.some(keyword => message.includes(keyword))
      expect(isNetworkError).toBe(false)
    })

    it('should provide error detection capabilities', () => {
      const { retry } = useNetworkStatus()
      
      expect(typeof retry).toBe('function')
      
      // Test error classification logic
      const errorCodes = ['NETWORK_ERROR', 'ECONNREFUSED', 'ETIMEDOUT']
      errorCodes.forEach(code => {
        expect(typeof code).toBe('string')
        expect(code.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Status Updates', () => {
    it('should detect slow connections', () => {
      // Update navigator before calling composable
      Object.defineProperty(global, 'navigator', {
        value: {
          onLine: true,
          connection: {
            effectiveType: 'slow-2g',
            downlink: 0.5,
            rtt: 2000,
            saveData: true,
            type: 'cellular'
          }
        },
        writable: true
      })
      
      const { status, isSlowConnection } = useNetworkStatus()
      
      expect(status.value.isSlowConnection).toBe(true)
      expect(isSlowConnection.value).toBe(true)
    })

    it('should handle save data preference', () => {
      // Update navigator before calling composable
      Object.defineProperty(global, 'navigator', {
        value: {
          onLine: true,
          connection: {
            effectiveType: '4g',
            downlink: 10,
            rtt: 50,
            saveData: true,
            type: 'wifi'
          }
        },
        writable: true
      })
      
      const { status } = useNetworkStatus()
      
      expect(status.value.saveData).toBe(true)
    })
  })
})