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
  return vi.fn().mockResolvedValue({ data })
}

export function mockFetchError(error: Error) {
  return vi.fn().mockRejectedValue(error)
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