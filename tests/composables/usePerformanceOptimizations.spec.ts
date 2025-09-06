import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useDebounce, useLazyLoad, useVirtualScroll, useImageOptimization } from '@/composables/usePerformanceOptimizations'
import { ref } from 'vue'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should debounce function calls', () => {
    const fn = vi.fn()
    const { debouncedFunction } = useDebounce(fn, 300)

    debouncedFunction('call1')
    debouncedFunction('call2')
    debouncedFunction('call3')

    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(300)

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('call3')
  })

  it('should provide cancel functionality', () => {
    const fn = vi.fn()
    const { debouncedFunction, cancel } = useDebounce(fn, 300)

    debouncedFunction('test')
    cancel()
    vi.advanceTimersByTime(300)

    expect(fn).not.toHaveBeenCalled()
  })

  it('should provide flush functionality', () => {
    const fn = vi.fn()
    const { debouncedFunction, flush } = useDebounce(fn, 300)

    debouncedFunction('test')
    flush()

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('test')
  })

  it('should handle immediate execution option', () => {
    const fn = vi.fn()
    const { debouncedFunction } = useDebounce(fn, 300, { immediate: true })

    debouncedFunction('immediate')
    
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('immediate')
  })
})

describe('useLazyLoad', () => {
  it('should initialize lazy loading', () => {
    const { isIntersecting, isLoaded, isLoading } = useLazyLoad()

    expect(isIntersecting.value).toBe(false)
    expect(isLoaded.value).toBe(false)
    expect(isLoading.value).toBe(false)
  })

  it('should observe element', () => {
    const { observe } = useLazyLoad()
    const element = document.createElement('div')

    // Should not throw
    expect(() => observe(element)).not.toThrow()
  })

  it('should handle fallback when IntersectionObserver is not available', () => {
    const originalObserver = global.IntersectionObserver
    delete (global as any).IntersectionObserver

    const onLoad = vi.fn()
    const { observe, isIntersecting, isLoaded } = useLazyLoad({ onLoad })
    const element = document.createElement('div')

    observe(element)

    expect(isIntersecting.value).toBe(true)
    expect(isLoaded.value).toBe(true)
    expect(onLoad).toHaveBeenCalled()

    global.IntersectionObserver = originalObserver
  })
})

describe('useVirtualScroll', () => {
  it('should initialize virtual scroll with array', () => {
    const items = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `Item ${i}` }))
    const { virtualItems, totalHeight } = useVirtualScroll(items, { itemHeight: 50 })

    expect(virtualItems.value).toBeDefined()
    expect(totalHeight.value).toBe(5000) // 100 items * 50px
  })

  it('should initialize virtual scroll with ref', () => {
    const itemsRef = ref(Array.from({ length: 50 }, (_, i) => ({ id: i, name: `Item ${i}` })))
    const { virtualItems, totalHeight } = useVirtualScroll(itemsRef, { itemHeight: 40 })

    expect(virtualItems.value).toBeDefined()
    expect(totalHeight.value).toBe(2000) // 50 items * 40px
  })

  it('should handle scroll events', () => {
    const items = Array.from({ length: 100 }, (_, i) => ({ id: i }))
    const { handleScroll } = useVirtualScroll(items, { itemHeight: 50 })

    const mockEvent = {
      target: { scrollTop: 250 }
    } as any

    // Should not throw
    expect(() => handleScroll(mockEvent)).not.toThrow()
  })
})

describe('useImageOptimization', () => {
  it('should initialize with string src', () => {
    const src = 'https://example.com/image.jpg'
    const { imageSrc, isLoading, isError } = useImageOptimization(src)

    expect(imageSrc.value).toBe(src)
    expect(isLoading.value).toBe(true)
    expect(isError.value).toBe(false)
  })

  it('should initialize with ref src', () => {
    const srcRef = ref('https://example.com/image.jpg')
    const { imageSrc, isLoading, isError } = useImageOptimization(srcRef)

    expect(imageSrc.value).toBe(srcRef.value)
    expect(isLoading.value).toBe(true)
    expect(isError.value).toBe(false)
  })

  it('should generate srcset', () => {
    const { srcset } = useImageOptimization('https://example.com/image.jpg')

    expect(srcset.value).toContain('320w')
    expect(srcset.value).toContain('640w')
    expect(srcset.value).toContain('1024w')
  })

  it('should handle placeholder', () => {
    const placeholder = 'https://example.com/placeholder.jpg'
    const { imageSrc } = useImageOptimization('https://example.com/image.jpg', { placeholder })

    expect(imageSrc.value).toBe(placeholder)
  })

  it('should provide retry functionality', () => {
    const { retry } = useImageOptimization('https://example.com/image.jpg')

    // Should not throw
    expect(() => retry()).not.toThrow()
  })
})