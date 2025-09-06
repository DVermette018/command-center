import { ref, computed, onMounted, onUnmounted, watch, type Ref, type ComputedRef } from 'vue'

// ==================== DEBOUNCE ====================
export interface DebounceOptions {
  immediate?: boolean
  maxWait?: number
}

export interface DebounceResult<T extends (...args: any[]) => any> {
  debouncedFunction: T
  cancel: () => void
  flush: () => void
  pending: Ref<boolean>
}

export function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
  options: DebounceOptions = {}
): DebounceResult<T> {
  const { immediate = false, maxWait } = options
  
  let timeoutId: NodeJS.Timeout | null = null
  let maxTimeoutId: NodeJS.Timeout | null = null
  let lastArgs: any[] | null = null
  let lastThis: any = null
  let lastCallTime: number | null = null
  let result: any
  
  const pending = ref(false)
  
  const reset = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    if (maxTimeoutId) {
      clearTimeout(maxTimeoutId)
      maxTimeoutId = null
    }
    pending.value = false
  }
  
  const flush = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      execute()
    }
  }
  
  const execute = () => {
    reset()
    if (lastArgs) {
      result = fn.apply(lastThis, lastArgs)
      lastArgs = null
      lastThis = null
    }
  }
  
  const debouncedFunction = function(this: any, ...args: any[]) {
    lastArgs = args
    lastThis = this
    lastCallTime = Date.now()
    
    const invokeFunc = () => {
      execute()
    }
    
    reset()
    pending.value = true
    
    if (immediate && !timeoutId) {
      execute()
    } else {
      timeoutId = setTimeout(invokeFunc, delay)
      
      if (maxWait && !maxTimeoutId) {
        maxTimeoutId = setTimeout(() => {
          execute()
        }, maxWait)
      }
    }
    
    return result
  } as T
  
  const cancel = () => {
    reset()
    lastArgs = null
    lastThis = null
    lastCallTime = null
  }
  
  // Cleanup on unmount
  onUnmounted(() => {
    cancel()
  })
  
  return {
    debouncedFunction,
    cancel,
    flush,
    pending
  }
}

// ==================== LAZY LOAD ====================
export interface LazyLoadOptions {
  rootMargin?: string
  threshold?: number | number[]
  onLoad?: () => void
  onError?: (error: Error) => void
}

export interface LazyLoadResult {
  isIntersecting: Ref<boolean>
  isLoaded: Ref<boolean>
  isLoading: Ref<boolean>
  error: Ref<Error | null>
  observe: (element: HTMLElement) => void
  unobserve: () => void
}

export function useLazyLoad(options: LazyLoadOptions = {}): LazyLoadResult {
  const {
    rootMargin = '50px',
    threshold = 0,
    onLoad,
    onError
  } = options
  
  const isIntersecting = ref(false)
  const isLoaded = ref(false)
  const isLoading = ref(false)
  const error = ref<Error | null>(null)
  
  let observer: IntersectionObserver | null = null
  let targetElement: HTMLElement | null = null
  
  const observe = (element: HTMLElement) => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      // Fallback for browsers without IntersectionObserver
      isIntersecting.value = true
      isLoaded.value = true
      if (onLoad) onLoad()
      return
    }
    
    targetElement = element
    
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isLoaded.value) {
            isIntersecting.value = true
            isLoading.value = true
            
            // Simulate async loading
            Promise.resolve()
              .then(() => {
                isLoaded.value = true
                isLoading.value = false
                if (onLoad) onLoad()
              })
              .catch((err) => {
                error.value = err
                isLoading.value = false
                if (onError) onError(err)
              })
            
            // Stop observing after loading
            if (observer && targetElement) {
              observer.unobserve(targetElement)
            }
          }
        })
      },
      {
        rootMargin,
        threshold
      }
    )
    
    observer.observe(element)
  }
  
  const unobserve = () => {
    if (observer && targetElement) {
      observer.unobserve(targetElement)
      observer.disconnect()
      observer = null
      targetElement = null
    }
  }
  
  onUnmounted(() => {
    unobserve()
  })
  
  return {
    isIntersecting,
    isLoaded,
    isLoading,
    error,
    observe,
    unobserve
  }
}

// ==================== VIRTUAL SCROLL ====================
export interface VirtualScrollOptions {
  itemHeight: number
  overscan?: number
  getItemHeight?: (index: number) => number
}

export interface VirtualScrollResult {
  virtualItems: ComputedRef<any[]>
  totalHeight: ComputedRef<number>
  offsetY: Ref<number>
  containerRef: Ref<HTMLElement | null>
  handleScroll: (event: Event) => void
}

export function useVirtualScroll<T = any>(
  items: Ref<T[]> | T[],
  options: VirtualScrollOptions
): VirtualScrollResult {
  const {
    itemHeight,
    overscan = 3,
    getItemHeight
  } = options
  
  const containerRef = ref<HTMLElement | null>(null)
  const scrollTop = ref(0)
  const containerHeight = ref(0)
  const offsetY = ref(0)
  
  const itemsArray = computed(() => {
    return Array.isArray(items) ? items : items.value
  })
  
  const getHeight = (index: number): number => {
    return getItemHeight ? getItemHeight(index) : itemHeight
  }
  
  const totalHeight = computed(() => {
    let height = 0
    for (let i = 0; i < itemsArray.value.length; i++) {
      height += getHeight(i)
    }
    return height
  })
  
  const visibleRange = computed(() => {
    const start = Math.max(0, Math.floor(scrollTop.value / itemHeight) - overscan)
    const end = Math.min(
      itemsArray.value.length,
      Math.ceil((scrollTop.value + containerHeight.value) / itemHeight) + overscan
    )
    return { start, end }
  })
  
  const virtualItems = computed(() => {
    const { start, end } = visibleRange.value
    const items = []
    
    let offset = 0
    for (let i = 0; i < start; i++) {
      offset += getHeight(i)
    }
    offsetY.value = offset
    
    for (let i = start; i < end; i++) {
      items.push({
        index: i,
        data: itemsArray.value[i],
        height: getHeight(i),
        offset
      })
      offset += getHeight(i)
    }
    
    return items
  })
  
  const handleScroll = (event: Event) => {
    const target = event.target as HTMLElement
    scrollTop.value = target.scrollTop
  }
  
  onMounted(() => {
    if (containerRef.value) {
      containerHeight.value = containerRef.value.clientHeight
      
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          containerHeight.value = entry.contentRect.height
        }
      })
      
      resizeObserver.observe(containerRef.value)
      
      onUnmounted(() => {
        resizeObserver.disconnect()
      })
    }
  })
  
  return {
    virtualItems,
    totalHeight,
    offsetY,
    containerRef,
    handleScroll
  }
}

// ==================== IMAGE OPTIMIZATION ====================
export interface ImageOptimizationOptions {
  sizes?: string
  loading?: 'lazy' | 'eager'
  placeholder?: string
  errorImage?: string
  quality?: number
  formats?: string[]
}

export interface ImageOptimizationResult {
  imageSrc: Ref<string>
  isLoading: Ref<boolean>
  isError: Ref<boolean>
  retry: () => void
  srcset: ComputedRef<string>
  sizes: ComputedRef<string>
}

export function useImageOptimization(
  src: string | Ref<string>,
  options: ImageOptimizationOptions = {}
): ImageOptimizationResult {
  const {
    sizes = '100vw',
    loading = 'lazy',
    placeholder = '',
    errorImage = '',
    quality = 85,
    formats = ['webp', 'jpeg']
  } = options
  
  const srcString = computed(() => {
    return typeof src === 'string' ? src : src.value
  })
  
  const imageSrc = ref(placeholder || srcString.value)
  const isLoading = ref(true)
  const isError = ref(false)
  
  const generateSrcset = (baseUrl: string): string => {
    const widths = [320, 640, 768, 1024, 1280, 1536, 1920]
    const srcsetParts: string[] = []
    
    widths.forEach(width => {
      // In a real implementation, this would generate actual resized image URLs
      // For testing, we'll just append width parameters
      const url = `${baseUrl}?w=${width}&q=${quality}`
      srcsetParts.push(`${url} ${width}w`)
    })
    
    return srcsetParts.join(', ')
  }
  
  const srcset = computed(() => {
    if (isError.value && errorImage) {
      return generateSrcset(errorImage)
    }
    return generateSrcset(srcString.value)
  })
  
  const sizesComputed = computed(() => sizes)
  
  const loadImage = () => {
    isLoading.value = true
    isError.value = false
    
    const img = new Image()
    
    img.onload = () => {
      imageSrc.value = srcString.value
      isLoading.value = false
    }
    
    img.onerror = () => {
      isError.value = true
      isLoading.value = false
      if (errorImage) {
        imageSrc.value = errorImage
      }
    }
    
    // Set loading attribute
    if ('loading' in img) {
      (img as any).loading = loading
    }
    
    img.src = srcString.value
  }
  
  const retry = () => {
    loadImage()
  }
  
  // Watch for src changes
  watch(srcString, () => {
    loadImage()
  })
  
  // Initial load
  onMounted(() => {
    if (loading === 'eager') {
      loadImage()
    }
  })
  
  return {
    imageSrc,
    isLoading,
    isError,
    retry,
    srcset,
    sizes: sizesComputed
  }
}

// ==================== THROTTLE ====================
export interface ThrottleOptions {
  leading?: boolean
  trailing?: boolean
}

export function useThrottle<T extends (...args: any[]) => any>(
  fn: T,
  wait: number,
  options: ThrottleOptions = {}
): T {
  const { leading = true, trailing = true } = options
  
  let lastCallTime: number | null = null
  let timeoutId: NodeJS.Timeout | null = null
  let lastArgs: any[] | null = null
  let lastThis: any = null
  
  const throttled = function(this: any, ...args: any[]) {
    const now = Date.now()
    
    if (!lastCallTime && !leading) {
      lastCallTime = now
    }
    
    const remaining = wait - (now - (lastCallTime || 0))
    
    lastArgs = args
    lastThis = this
    
    if (remaining <= 0 || remaining > wait) {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      lastCallTime = now
      fn.apply(this, args)
    } else if (!timeoutId && trailing) {
      timeoutId = setTimeout(() => {
        lastCallTime = leading ? Date.now() : null
        timeoutId = null
        if (lastArgs) {
          fn.apply(lastThis, lastArgs)
        }
      }, remaining)
    }
  } as T
  
  return throttled
}