import { mount, type VueWrapper } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { vi, type MockInstance } from 'vitest'
import type { Component, ComponentPublicInstance } from 'vue'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

/**
 * Enhanced mount function with common testing setup
 */
export function mountComponent<T extends Component>(
  component: T,
  options: {
    props?: Record<string, any>
    slots?: Record<string, any>
    global?: {
      plugins?: any[]
      provide?: Record<string | symbol, any>
      stubs?: Record<string, any>
      mocks?: Record<string, any>
    }
    attachTo?: Element | string
  } = {}
): VueWrapper<ComponentPublicInstance> {
  // Create a fresh QueryClient for each component mount with test-friendly settings
  const testQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        staleTime: Infinity,
        gcTime: Infinity
      },
      mutations: {
        retry: false
      }
    }
  })

  const defaultGlobal = {
    plugins: [
      createTestingPinia({
        createSpy: vi.fn,
        stubActions: false
      }),
      [VueQueryPlugin, { queryClient: testQueryClient }]
    ],
    stubs: {
      // Common Nuxt components to stub
      NuxtLink: {
        template: '<a><slot /></a>',
        props: ['to', 'href', 'target', 'rel']
      },
      NuxtImg: {
        template: '<img />',
        props: ['src', 'alt', 'width', 'height']
      },
      Icon: {
        template: '<span class="icon"></span>',
        props: ['name', 'size']
      },
      ClientOnly: {
        template: '<div><slot /></div>'
      },
      ...options.global?.stubs
    },
    mocks: {
      $route: {
        path: '/',
        params: {},
        query: {},
        hash: '',
        name: null,
        meta: {},
        matched: []
      },
      $router: {
        push: vi.fn(),
        replace: vi.fn(),
        go: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        resolve: vi.fn(),
        currentRoute: {
          value: {
            path: '/',
            params: {},
            query: {},
            hash: '',
            name: null,
            meta: {},
            matched: []
          }
        }
      },
      ...options.global?.mocks
    },
    provide: {
      ...options.global?.provide
    }
  }

  return mount(component, {
    ...options,
    global: {
      ...defaultGlobal,
      ...options.global,
      plugins: [...(defaultGlobal.plugins || []), ...(options.global?.plugins || [])],
      stubs: { ...defaultGlobal.stubs, ...options.global?.stubs },
      mocks: { ...defaultGlobal.mocks, ...options.global?.mocks },
      provide: { ...defaultGlobal.provide, ...options.global?.provide }
    }
  })
}

/**
 * Wait for next tick and DOM updates
 */
export async function flushPromises(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0))
}

/**
 * Mock fetch response helper
 */
export function mockFetchResponse(data: any, status = 200): MockInstance {
  return vi.mocked(fetch).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: vi.fn().mockResolvedValueOnce(data),
    text: vi.fn().mockResolvedValueOnce(JSON.stringify(data)),
    headers: new Headers(),
    redirected: false,
    type: 'basic',
    url: '',
    clone: vi.fn(),
    body: null,
    bodyUsed: false,
    arrayBuffer: vi.fn(),
    blob: vi.fn(),
    formData: vi.fn()
  } as Response)
}

/**
 * Mock API error response
 */
export function mockFetchError(status = 500, message = 'Internal Server Error'): MockInstance {
  return vi.mocked(fetch).mockRejectedValueOnce(
    new Response(JSON.stringify({ message }), {
      status,
      statusText: message,
      headers: new Headers({
        'content-type': 'application/json'
      })
    })
  )
}

/**
 * Helper to trigger custom events
 */
export async function triggerEvent(
  wrapper: VueWrapper<any>,
  selector: string,
  event: string,
  eventData: any = {}
): Promise<void> {
  const element = wrapper.find(selector)
  await element.trigger(event, eventData)
  await wrapper.vm.$nextTick()
}

/**
 * Wait for component to emit specific event
 */
export function waitForEvent(
  wrapper: VueWrapper<any>,
  eventName: string,
  timeout = 1000
): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Event ${eventName} was not emitted within ${timeout}ms`))
    }, timeout)

    const unwatch = wrapper.vm.$watch(
      () => wrapper.emitted(eventName),
      (events) => {
        if (events && events.length > 0) {
          clearTimeout(timer)
          unwatch()
          resolve(events[events.length - 1])
        }
      },
      { immediate: true }
    )
  })
}

/**
 * Create a mock composable
 */
export function createMockComposable<T>(
  name: string,
  implementation: T
): T {
  vi.doMock(name, () => ({
    [name]: implementation
  }))
  return implementation
}

/**
 * Accessibility testing helper
 */
export function getByRole(wrapper: VueWrapper<any>, role: string): any {
  return wrapper.find(`[role="${role}"]`)
}

export function getByLabelText(wrapper: VueWrapper<any>, labelText: string): any {
  const label = wrapper.find(`label:contains("${labelText}")`)
  if (label.exists()) {
    const forId = label.attributes('for')
    if (forId) {
      return wrapper.find(`#${forId}`)
    }
    return label.find('input, select, textarea')
  }
  return wrapper.find(`[aria-label="${labelText}"]`)
}

export function getByTestId(wrapper: VueWrapper<any>, testId: string): any {
  return wrapper.find(`[data-testid="${testId}"]`)
}