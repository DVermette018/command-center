import { ref, computed, onMounted, onUnmounted, nextTick, type Ref, type ComputedRef } from 'vue'

// ==================== MAIN ACCESSIBILITY COMPOSABLE ====================
export interface AriaRelationship {
  type: 'labelledby' | 'describedby' | 'controls' | 'owns' | 'flowto'
  source: string
  target: string | string[]
}

export interface AccessibilityOptions {
  announceOnRouteChange?: boolean
  focusOnRouteChange?: boolean
  skipLinks?: boolean
}

let idCounter = 0

export function useAccessibility(options: AccessibilityOptions = {}) {
  const {
    announceOnRouteChange = true,
    focusOnRouteChange = true,
    skipLinks = true
  } = options

  // Generate unique ARIA IDs
  const generateId = (prefix: string = 'aria'): string => {
    return `${prefix}-${++idCounter}`
  }

  // Create ARIA relationships
  const createAriaRelationship = (config: AriaRelationship): Record<string, any> => {
    const { type, source, target } = config
    const targetIds = Array.isArray(target) ? target.join(' ') : target
    
    const relationship: Record<string, any> = {
      [source]: {
        [`aria-${type}`]: targetIds
      }
    }
    
    if (!Array.isArray(target)) {
      relationship[target] = { id: target }
    } else {
      target.forEach(t => {
        relationship[t] = { id: t }
      })
    }
    
    return relationship
  }

  // Check if user prefers reduced motion
  const prefersReducedMotion = computed(() => {
    if (typeof window === 'undefined') return false
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    return mediaQuery.matches
  })

  // Check if user is using high contrast mode
  const isHighContrast = computed(() => {
    if (typeof window === 'undefined') return false
    const mediaQuery = window.matchMedia('(prefers-contrast: high)')
    return mediaQuery.matches
  })

  // Announce message to screen readers
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (typeof document === 'undefined') return
    
    const announcement = document.createElement('div')
    announcement.setAttribute('role', 'status')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.style.position = 'absolute'
    announcement.style.left = '-10000px'
    announcement.style.width = '1px'
    announcement.style.height = '1px'
    announcement.style.overflow = 'hidden'
    announcement.textContent = message
    
    document.body.appendChild(announcement)
    
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  return {
    generateId,
    createAriaRelationship,
    prefersReducedMotion,
    isHighContrast,
    announce
  }
}

// ==================== FOCUS MANAGEMENT ====================
export interface FocusManagementOptions {
  restoreFocus?: boolean
  trapFocus?: boolean
  autoFocus?: boolean
}

export function useFocusManagement(options: FocusManagementOptions = {}) {
  const {
    restoreFocus = true,
    trapFocus = false,
    autoFocus = false
  } = options

  const previousFocus = ref<HTMLElement | null>(null)
  const focusTrapContainer = ref<HTMLElement | null>(null)
  const focusableElements = ref<HTMLElement[]>([])

  // Get all focusable elements within a container
  const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
    const selector = [
      'a[href]:not([disabled])',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ')
    
    return Array.from(container.querySelectorAll(selector)) as HTMLElement[]
  }

  // Save current focus
  const saveFocus = () => {
    if (restoreFocus && typeof document !== 'undefined') {
      previousFocus.value = document.activeElement as HTMLElement
    }
  }

  // Restore previous focus
  const restoreFocusElement = () => {
    if (restoreFocus && previousFocus.value) {
      nextTick(() => {
        previousFocus.value?.focus()
        previousFocus.value = null
      })
    }
  }

  // Focus first focusable element
  const focusFirst = (container?: HTMLElement) => {
    const target = container || focusTrapContainer.value
    if (!target) return
    
    const elements = getFocusableElements(target)
    if (elements.length > 0) {
      elements[0].focus()
    }
  }

  // Focus last focusable element
  const focusLast = (container?: HTMLElement) => {
    const target = container || focusTrapContainer.value
    if (!target) return
    
    const elements = getFocusableElements(target)
    if (elements.length > 0) {
      elements[elements.length - 1].focus()
    }
  }

  // Setup focus trap
  const setupFocusTrap = (container: HTMLElement) => {
    if (!trapFocus) return
    
    focusTrapContainer.value = container
    focusableElements.value = getFocusableElements(container)
    
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      
      const focusable = getFocusableElements(container)
      if (focusable.length === 0) return
      
      const firstElement = focusable[0]
      const lastElement = focusable[focusable.length - 1]
      
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault()
        lastElement.focus()
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault()
        firstElement.focus()
      }
    }
    
    container.addEventListener('keydown', handleKeydown)
    
    // Cleanup
    onUnmounted(() => {
      container.removeEventListener('keydown', handleKeydown)
    })
  }

  // Clear focus trap
  const clearFocusTrap = () => {
    focusTrapContainer.value = null
    focusableElements.value = []
  }

  return {
    saveFocus,
    restoreFocusElement,
    focusFirst,
    focusLast,
    setupFocusTrap,
    clearFocusTrap,
    getFocusableElements
  }
}

// ==================== KEYBOARD NAVIGATION ====================
export interface KeyboardNavigationOptions {
  orientation?: 'horizontal' | 'vertical' | 'both'
  wrap?: boolean
  typeahead?: boolean
}

export interface KeyboardShortcut {
  key: string
  modifiers?: ('ctrl' | 'alt' | 'shift' | 'meta')[]
  handler: () => void
  description?: string
}

export function useKeyboardNavigation(options: KeyboardNavigationOptions = {}) {
  const {
    orientation = 'vertical',
    wrap = true,
    typeahead = false
  } = options

  const currentIndex = ref(0)
  const items = ref<HTMLElement[]>([])
  const typeaheadBuffer = ref('')
  const typeaheadTimeout = ref<NodeJS.Timeout | null>(null)
  const shortcuts = ref<KeyboardShortcut[]>([])

  // Navigate to item by index
  const navigateToIndex = (index: number) => {
    if (items.value.length === 0) return
    
    let targetIndex = index
    
    if (wrap) {
      targetIndex = ((index % items.value.length) + items.value.length) % items.value.length
    } else {
      targetIndex = Math.max(0, Math.min(index, items.value.length - 1))
    }
    
    currentIndex.value = targetIndex
    items.value[targetIndex]?.focus()
  }

  // Navigate by direction
  const navigate = (direction: 'up' | 'down' | 'left' | 'right') => {
    let nextIndex = currentIndex.value
    
    switch (direction) {
      case 'up':
        if (orientation === 'vertical' || orientation === 'both') {
          nextIndex--
        }
        break
      case 'down':
        if (orientation === 'vertical' || orientation === 'both') {
          nextIndex++
        }
        break
      case 'left':
        if (orientation === 'horizontal' || orientation === 'both') {
          nextIndex--
        }
        break
      case 'right':
        if (orientation === 'horizontal' || orientation === 'both') {
          nextIndex++
        }
        break
    }
    
    navigateToIndex(nextIndex)
  }

  // Handle keyboard events
  const handleKeydown = (e: KeyboardEvent) => {
    // Check shortcuts first
    for (const shortcut of shortcuts.value) {
      const modifiersMatch = 
        (!shortcut.modifiers || shortcut.modifiers.length === 0) ||
        (shortcut.modifiers.every(mod => {
          switch (mod) {
            case 'ctrl': return e.ctrlKey
            case 'alt': return e.altKey
            case 'shift': return e.shiftKey
            case 'meta': return e.metaKey
            default: return false
          }
        }))
      
      if (e.key === shortcut.key && modifiersMatch) {
        e.preventDefault()
        shortcut.handler()
        return
      }
    }

    // Handle navigation keys
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault()
        navigate('up')
        break
      case 'ArrowDown':
        e.preventDefault()
        navigate('down')
        break
      case 'ArrowLeft':
        e.preventDefault()
        navigate('left')
        break
      case 'ArrowRight':
        e.preventDefault()
        navigate('right')
        break
      case 'Home':
        e.preventDefault()
        navigateToIndex(0)
        break
      case 'End':
        e.preventDefault()
        navigateToIndex(items.value.length - 1)
        break
      case 'PageUp':
        e.preventDefault()
        navigateToIndex(Math.max(0, currentIndex.value - 10))
        break
      case 'PageDown':
        e.preventDefault()
        navigateToIndex(Math.min(items.value.length - 1, currentIndex.value + 10))
        break
    }

    // Handle typeahead
    if (typeahead && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
      handleTypeahead(e.key)
    }
  }

  // Handle typeahead search
  const handleTypeahead = (char: string) => {
    if (typeaheadTimeout.value) {
      clearTimeout(typeaheadTimeout.value)
    }
    
    typeaheadBuffer.value += char.toLowerCase()
    
    // Find matching item
    const matchIndex = items.value.findIndex(item => {
      const text = item.textContent?.toLowerCase() || ''
      return text.startsWith(typeaheadBuffer.value)
    })
    
    if (matchIndex !== -1) {
      navigateToIndex(matchIndex)
    }
    
    // Clear buffer after delay
    typeaheadTimeout.value = setTimeout(() => {
      typeaheadBuffer.value = ''
    }, 1000)
  }

  // Register keyboard shortcut
  const registerShortcut = (shortcut: KeyboardShortcut) => {
    shortcuts.value.push(shortcut)
  }

  // Unregister keyboard shortcut
  const unregisterShortcut = (key: string) => {
    shortcuts.value = shortcuts.value.filter(s => s.key !== key)
  }

  // Setup keyboard navigation
  const setupKeyboardNavigation = (container: HTMLElement, itemSelector: string) => {
    items.value = Array.from(container.querySelectorAll(itemSelector)) as HTMLElement[]
    
    container.addEventListener('keydown', handleKeydown)
    
    // Cleanup
    onUnmounted(() => {
      container.removeEventListener('keydown', handleKeydown)
      if (typeaheadTimeout.value) {
        clearTimeout(typeaheadTimeout.value)
      }
    })
  }

  return {
    currentIndex,
    navigate,
    navigateToIndex,
    registerShortcut,
    unregisterShortcut,
    setupKeyboardNavigation
  }
}

// ==================== SCREEN READER ====================
export interface ScreenReaderOptions {
  ariaLive?: 'polite' | 'assertive' | 'off'
  ariaRelevant?: 'additions' | 'removals' | 'text' | 'all'
}

export function useScreenReader(options: ScreenReaderOptions = {}) {
  const {
    ariaLive = 'polite',
    ariaRelevant = 'additions text'
  } = options

  const liveRegion = ref<HTMLElement | null>(null)
  const announcements = ref<string[]>([])

  // Create live region
  const createLiveRegion = () => {
    if (typeof document === 'undefined') return
    
    const region = document.createElement('div')
    region.setAttribute('role', 'status')
    region.setAttribute('aria-live', ariaLive)
    region.setAttribute('aria-relevant', ariaRelevant)
    region.setAttribute('aria-atomic', 'true')
    region.className = 'sr-only'
    region.style.position = 'absolute'
    region.style.width = '1px'
    region.style.height = '1px'
    region.style.padding = '0'
    region.style.margin = '-1px'
    region.style.overflow = 'hidden'
    region.style.clip = 'rect(0, 0, 0, 0)'
    region.style.whiteSpace = 'nowrap'
    region.style.border = '0'
    
    document.body.appendChild(region)
    liveRegion.value = region
  }

  // Announce message
  const announce = (message: string, priority?: 'polite' | 'assertive') => {
    if (!liveRegion.value) {
      createLiveRegion()
    }
    
    if (liveRegion.value) {
      if (priority) {
        liveRegion.value.setAttribute('aria-live', priority)
      }
      
      // Clear and set new message
      liveRegion.value.textContent = ''
      setTimeout(() => {
        if (liveRegion.value) {
          liveRegion.value.textContent = message
          announcements.value.push(message)
        }
      }, 100)
      
      // Restore original priority
      if (priority) {
        setTimeout(() => {
          if (liveRegion.value) {
            liveRegion.value.setAttribute('aria-live', ariaLive)
          }
        }, 200)
      }
    }
  }

  // Clear announcements
  const clearAnnouncements = () => {
    if (liveRegion.value) {
      liveRegion.value.textContent = ''
    }
    announcements.value = []
  }

  // Cleanup
  onUnmounted(() => {
    if (liveRegion.value && liveRegion.value.parentNode) {
      liveRegion.value.parentNode.removeChild(liveRegion.value)
    }
  })

  return {
    announce,
    clearAnnouncements,
    announcements
  }
}