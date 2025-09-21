import { vi } from 'vitest'
import type { Component } from 'vue'
import { mount } from '@vue/test-utils'

export function mountComponent<T extends Component>(component: T, options = {}) {
  return mount(component, {
    global: {
      stubs: ['UModal', 'UButton', 'UInput', 'UTable', 'USelect', 'UDropdownMenu'],
      ...options
    }
  })
}

export function mockFetchResponse(data: any) {
  const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data))
  })
  vi.mocked(global.fetch).mockResolvedValueOnce(mockFetch() as any)
  vi.mocked(global.$fetch).mockResolvedValueOnce(data)
  return mockFetch
}

export function mockFetchError(status: number, message: string) {
  const error = new Error(message)
  const mockFetch = vi.fn().mockRejectedValue(error)
  vi.mocked(global.fetch).mockRejectedValueOnce(error)
  vi.mocked(global.$fetch).mockRejectedValueOnce(error)
  return mockFetch
}

export function getByTestId(wrapper: any, testId: string) {
  return wrapper.find(`[data-testid="${testId}"]`)
}

export function createMockApiResponse<T>(data: T, status = 'success') {
  return {
    data,
    status,
    isLoading: false,
    error: null
  }
}

export function mockSuccessfulFetch(data: any) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(data)
  })
}

export function mockApiResponse(data: any, options = {}) {
  return {
    data,
    isLoading: false,
    error: null,
    status: 'success',
    ...options
  }
}