import { ref, computed, onMounted, onUnmounted, readonly, type Ref, type ComputedRef } from 'vue'

export interface NetworkStatus {
  isOnline: boolean
  isSlowConnection: boolean
  connectionType: string | undefined
  effectiveType: string | undefined
  downlink: number | undefined
  rtt: number | undefined
  saveData: boolean
}

export interface RetryOptions {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  onRetry?: (attempt: number, error: any) => void
}

export interface NetworkStatusComposable {
  status: Ref<NetworkStatus>
  isOnline: ComputedRef<boolean>
  isOffline: ComputedRef<boolean>
  isSlowConnection: ComputedRef<boolean>
  connectionQuality: ComputedRef<'good' | 'fair' | 'poor' | 'offline'>
  retry: <T>(fn: () => Promise<T>, options?: RetryOptions) => Promise<T>
  waitForConnection: (timeout?: number) => Promise<void>
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  onRetry: () => {}
}

export function useNetworkStatus(): NetworkStatusComposable {
  // Check if we have Nuxt app available (won't be available in tests)
  let nuxtApp: any = null
  try {
    if (typeof window !== 'undefined' && (window as any).$nuxt) {
      nuxtApp = (window as any).$nuxt
    }
  } catch (e) {
    // Ignore in test environment
  }
  
  // Network status state
  const status = ref<NetworkStatus>({
    isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
    isSlowConnection: false,
    connectionType: undefined,
    effectiveType: undefined,
    downlink: undefined,
    rtt: undefined,
    saveData: false
  })

  // Computed properties
  const isOnline = computed(() => status.value.isOnline)
  const isOffline = computed(() => !status.value.isOnline)
  const isSlowConnection = computed(() => status.value.isSlowConnection)
  
  const connectionQuality = computed(() => {
    if (!status.value.isOnline) return 'offline'
    if (status.value.isSlowConnection) return 'poor'
    
    const effectiveType = status.value.effectiveType
    if (effectiveType === '4g') return 'good'
    if (effectiveType === '3g') return 'fair'
    if (effectiveType === '2g' || effectiveType === 'slow-2g') return 'poor'
    
    // Fallback to RTT-based assessment
    const rtt = status.value.rtt
    if (rtt && rtt < 100) return 'good'
    if (rtt && rtt < 300) return 'fair'
    if (rtt && rtt >= 300) return 'poor'
    
    return 'fair' // Default when no metrics available
  })

  // Update network status
  const updateNetworkStatus = () => {
    if (typeof window === 'undefined') return
    
    status.value.isOnline = navigator.onLine
    
    // Get connection information if available
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection
    
    if (connection) {
      status.value.connectionType = connection.type
      status.value.effectiveType = connection.effectiveType
      status.value.downlink = connection.downlink
      status.value.rtt = connection.rtt
      status.value.saveData = connection.saveData || false
      
      // Determine if connection is slow
      status.value.isSlowConnection = 
        connection.effectiveType === 'slow-2g' ||
        connection.effectiveType === '2g' ||
        (connection.rtt && connection.rtt > 400) ||
        (connection.downlink && connection.downlink < 0.5)
    }
  }

  // Retry with exponential backoff
  const retry = async <T>(
    fn: () => Promise<T>, 
    options: RetryOptions = {}
  ): Promise<T> => {
    const opts = { ...DEFAULT_RETRY_OPTIONS, ...options }
    let lastError: any
    let delay = opts.initialDelay
    
    for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
      try {
        // Check if online before attempting
        if (!status.value.isOnline && attempt > 1) {
          await waitForConnection(5000)
        }
        
        return await fn()
      } catch (error) {
        lastError = error
        
        // Don't retry if it's not a network error
        if (!isNetworkError(error)) {
          throw error
        }
        
        // Last attempt, throw the error
        if (attempt === opts.maxRetries) {
          throw error
        }
        
        // Call retry callback
        opts.onRetry(attempt, error)
        
        // Wait with exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay))
        
        // Calculate next delay with jitter
        delay = Math.min(
          delay * opts.backoffMultiplier + Math.random() * 1000,
          opts.maxDelay
        )
      }
    }
    
    throw lastError
  }

  // Wait for connection to be restored
  const waitForConnection = (timeout = 30000): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (status.value.isOnline) {
        resolve()
        return
      }
      
      const startTime = Date.now()
      
      const checkConnection = () => {
        if (status.value.isOnline) {
          resolve()
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('Connection timeout'))
        } else {
          setTimeout(checkConnection, 500)
        }
      }
      
      checkConnection()
    })
  }

  // Check if error is network-related
  const isNetworkError = (error: any): boolean => {
    if (!error) return false
    
    // Check for common network error patterns
    const message = error.message?.toLowerCase() || ''
    const networkErrorPatterns = [
      'network',
      'fetch',
      'connection',
      'timeout',
      'offline',
      'unreachable',
      'econnrefused',
      'enotfound',
      'etimedout'
    ]
    
    if (networkErrorPatterns.some(pattern => message.includes(pattern))) {
      return true
    }
    
    // Check for specific error codes
    if (error.code === 'NETWORK_ERROR' || 
        error.code === 'ECONNREFUSED' ||
        error.code === 'ETIMEDOUT') {
      return true
    }
    
    // Check for fetch errors
    if (error.name === 'TypeError' && message.includes('fetch')) {
      return true
    }
    
    return false
  }

  // Event listeners
  const handleOnline = () => {
    updateNetworkStatus()
    if (nuxtApp && nuxtApp.$emit) {
      nuxtApp.$emit('network:online')
    }
  }
  
  const handleOffline = () => {
    updateNetworkStatus()
    if (nuxtApp && nuxtApp.$emit) {
      nuxtApp.$emit('network:offline')
    }
  }
  
  const handleConnectionChange = () => {
    updateNetworkStatus()
    if (nuxtApp && nuxtApp.$emit) {
      nuxtApp.$emit('network:change', status.value)
    }
  }

  // Lifecycle
  onMounted(() => {
    if (typeof window === 'undefined') return
    
    // Initial status update
    updateNetworkStatus()
    
    // Add event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Listen to connection changes if available
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection
    
    if (connection) {
      connection.addEventListener('change', handleConnectionChange)
    }
  })

  onUnmounted(() => {
    if (typeof window === 'undefined') return
    
    // Remove event listeners
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
    
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection
    
    if (connection) {
      connection.removeEventListener('change', handleConnectionChange)
    }
  })

  return {
    status: readonly(status),
    isOnline,
    isOffline,
    isSlowConnection,
    connectionQuality,
    retry,
    waitForConnection
  }
}

// Re-export for convenience
export const useConnectionStatus = useNetworkStatus
export const useNetworkMonitor = useNetworkStatus