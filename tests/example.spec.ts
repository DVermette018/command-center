import { describe, it, expect, vi } from 'vitest'
import { createTestCustomer, createTestProject, createTRPCError } from './setup'

// Simple test to verify test setup is working
describe('Test Setup Verification', () => {
  it('should verify testing environment is configured correctly', () => {
    expect(true).toBe(true)
  })

  it('should have access to Vue testing utilities', () => {
    expect(typeof describe).toBe('function')
    expect(typeof it).toBe('function')
    expect(typeof expect).toBe('function')
  })

  it('should support async testing', async () => {
    const promise = Promise.resolve('test')
    const result = await promise
    expect(result).toBe('test')
  })

  it('should support mocking', () => {
    const mockFn = vi.fn()
    mockFn('test')
    expect(mockFn).toHaveBeenCalledWith('test')
  })
})

// Test factory verification
describe('Test Factories', () => {
  it('should create test customer data', () => {
    const customer = createTestCustomer({ name: 'Custom Name' })
    
    expect(customer).toMatchObject({
      id: expect.any(String),
      name: 'Custom Name',
      email: expect.stringContaining('@'),
      phone: expect.any(String),
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date)
    })
  })

  it('should create test project data', () => {
    const project = createTestProject()
    
    expect(project).toMatchObject({
      id: expect.any(String),
      title: expect.any(String),
      description: expect.any(String),
      status: 'active',
      customerId: expect.any(String)
    })
  })

  it('should create TRPC errors', () => {
    const error = createTRPCError('BAD_REQUEST', 'Test error')
    
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe('Test error')
    expect(error.data.code).toBe('BAD_REQUEST')
  })
})