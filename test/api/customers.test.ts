import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockFetchResponse, mockFetchError } from '../utils'
import { createMockCustomer, createMockApiResponse, createMockTableData } from '../factories'

// Mock API client
class CustomersAPI {
  async getAll(params?: { page?: number; limit?: number; search?: string }) {
    const queryString = params ? new URLSearchParams(params as any).toString() : ''
    const url = `/api/customers${queryString ? `?${queryString}` : ''}`
    return await $fetch(url)
  }

  async getById(id: string) {
    return await $fetch(`/api/customers/${id}`)
  }

  async create(data: CreateCustomerData) {
    return await $fetch('/api/customers', {
      method: 'POST',
      body: data
    })
  }

  async update(id: string, data: Partial<CreateCustomerData>) {
    return await $fetch(`/api/customers/${id}`, {
      method: 'PUT',
      body: data
    })
  }

  async delete(id: string) {
    return await $fetch(`/api/customers/${id}`, {
      method: 'DELETE'
    })
  }
}

interface CreateCustomerData {
  business: {
    businessName: string
    ownerName?: string
    legalName?: string
    taxId?: string
    category?: string
    size?: string
    address?: {
      street: string
      city: string
      state: string
      zipCode: string
      country: string
    }
  }
  contact: {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    position?: string
  }
  status: string
  source?: string
}

describe('Customers API', () => {
  let customersAPI: CustomersAPI

  beforeEach(() => {
    customersAPI = new CustomersAPI()
    vi.clearAllMocks()
  })

  describe('getAll', () => {
    it('fetches all customers successfully', async () => {
      const mockCustomers = createMockTableData(() => createMockCustomer(), 5)
      mockFetchResponse(mockCustomers)

      const result = await customersAPI.getAll()

      expect(fetch).toHaveBeenCalledWith('/api/customers')
      expect(result.items).toHaveLength(5)
      expect(result.pagination).toBeDefined()
    })

    it('handles pagination parameters', async () => {
      const mockCustomers = createMockTableData(() => createMockCustomer(), 3)
      mockFetchResponse(mockCustomers)

      await customersAPI.getAll({ page: 2, limit: 10 })

      expect(fetch).toHaveBeenCalledWith('/api/customers?page=2&limit=10')
    })

    it('handles search parameters', async () => {
      const mockCustomers = createMockTableData(() => createMockCustomer(), 2)
      mockFetchResponse(mockCustomers)

      await customersAPI.getAll({ search: 'test company' })

      expect(fetch).toHaveBeenCalledWith('/api/customers?search=test+company')
    })

    it('handles API errors', async () => {
      mockFetchError(500, 'Internal Server Error')

      await expect(customersAPI.getAll()).rejects.toThrow('Internal Server Error')
    })

    it('handles network errors', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network Error'))

      await expect(customersAPI.getAll()).rejects.toThrow('Network Error')
    })
  })

  describe('getById', () => {
    it('fetches customer by ID successfully', async () => {
      const mockCustomer = createMockCustomer({ id: '123' })
      mockFetchResponse(createMockApiResponse(mockCustomer))

      const result = await customersAPI.getById('123')

      expect(fetch).toHaveBeenCalledWith('/api/customers/123')
      expect(result.data.id).toBe('123')
    })

    it('handles not found errors', async () => {
      mockFetchError(404, 'Customer not found')

      await expect(customersAPI.getById('nonexistent')).rejects.toThrow('Customer not found')
    })

    it('validates ID parameter', async () => {
      await expect(customersAPI.getById('')).rejects.toThrow()
    })
  })

  describe('create', () => {
    const validCustomerData: CreateCustomerData = {
      business: {
        businessName: 'Test Company',
        ownerName: 'John Doe',
        category: 'technology',
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'MX'
        }
      },
      contact: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@testcompany.com',
        phone: '1234567890',
        position: 'CEO'
      },
      status: 'LEAD'
    }

    it('creates customer successfully', async () => {
      const mockCustomer = createMockCustomer()
      mockFetchResponse(createMockApiResponse(mockCustomer))

      const result = await customersAPI.create(validCustomerData)

      expect(fetch).toHaveBeenCalledWith('/api/customers', {
        method: 'POST',
        body: validCustomerData
      })
      expect(result.data).toBeDefined()
      expect(result.success).toBe(true)
    })

    it('handles validation errors', async () => {
      const invalidData = { ...validCustomerData, business: { businessName: '' } }
      mockFetchError(400, 'Validation Error')

      await expect(customersAPI.create(invalidData)).rejects.toThrow('Validation Error')
    })

    it('handles duplicate customer errors', async () => {
      mockFetchError(409, 'Customer already exists')

      await expect(customersAPI.create(validCustomerData)).rejects.toThrow('Customer already exists')
    })

    it('creates customer with minimal data', async () => {
      const minimalData: CreateCustomerData = {
        business: { businessName: 'Minimal Company' },
        contact: {},
        status: 'LEAD'
      }
      const mockCustomer = createMockCustomer()
      mockFetchResponse(createMockApiResponse(mockCustomer))

      const result = await customersAPI.create(minimalData)

      expect(result.success).toBe(true)
    })
  })

  describe('update', () => {
    it('updates customer successfully', async () => {
      const updateData = {
        business: { businessName: 'Updated Company' },
        status: 'ACTIVE'
      }
      const mockCustomer = createMockCustomer({ id: '123' })
      mockFetchResponse(createMockApiResponse(mockCustomer))

      const result = await customersAPI.update('123', updateData)

      expect(fetch).toHaveBeenCalledWith('/api/customers/123', {
        method: 'PUT',
        body: updateData
      })
      expect(result.success).toBe(true)
    })

    it('handles not found errors during update', async () => {
      mockFetchError(404, 'Customer not found')

      await expect(customersAPI.update('nonexistent', {})).rejects.toThrow('Customer not found')
    })

    it('handles partial updates', async () => {
      const partialUpdate = { status: 'INACTIVE' }
      const mockCustomer = createMockCustomer()
      mockFetchResponse(createMockApiResponse(mockCustomer))

      const result = await customersAPI.update('123', partialUpdate)

      expect(result.success).toBe(true)
    })
  })

  describe('delete', () => {
    it('deletes customer successfully', async () => {
      mockFetchResponse(createMockApiResponse({ success: true }))

      const result = await customersAPI.delete('123')

      expect(fetch).toHaveBeenCalledWith('/api/customers/123', {
        method: 'DELETE'
      })
      expect(result.success).toBe(true)
    })

    it('handles not found errors during deletion', async () => {
      mockFetchError(404, 'Customer not found')

      await expect(customersAPI.delete('nonexistent')).rejects.toThrow('Customer not found')
    })

    it('handles deletion of customer with dependencies', async () => {
      mockFetchError(409, 'Cannot delete customer with active projects')

      await expect(customersAPI.delete('123')).rejects.toThrow('Cannot delete customer with active projects')
    })
  })

  describe('error handling', () => {
    it('handles 401 unauthorized errors', async () => {
      mockFetchError(401, 'Unauthorized')

      await expect(customersAPI.getAll()).rejects.toThrow('Unauthorized')
    })

    it('handles 403 forbidden errors', async () => {
      mockFetchError(403, 'Forbidden')

      await expect(customersAPI.getAll()).rejects.toThrow('Forbidden')
    })

    it('handles 500 server errors', async () => {
      mockFetchError(500, 'Internal Server Error')

      await expect(customersAPI.getAll()).rejects.toThrow('Internal Server Error')
    })

    it('handles network timeout errors', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Request timeout'))

      await expect(customersAPI.getAll()).rejects.toThrow('Request timeout')
    })
  })

  describe('response format validation', () => {
    it('validates response structure for getAll', async () => {
      const mockResponse = createMockTableData(() => createMockCustomer(), 3)
      mockFetchResponse(mockResponse)

      const result = await customersAPI.getAll()

      expect(result).toHaveProperty('items')
      expect(result).toHaveProperty('pagination')
      expect(Array.isArray(result.items)).toBe(true)
      expect(result.pagination).toHaveProperty('page')
      expect(result.pagination).toHaveProperty('limit')
      expect(result.pagination).toHaveProperty('total')
    })

    it('validates response structure for create', async () => {
      const mockCustomer = createMockCustomer()
      mockFetchResponse(createMockApiResponse(mockCustomer))

      const validData: CreateCustomerData = {
        business: { businessName: 'Test' },
        contact: {},
        status: 'LEAD'
      }

      const result = await customersAPI.create(validData)

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('data')
      expect(result.success).toBe(true)
    })
  })
})