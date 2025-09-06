import { z } from 'zod'
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { faker } from '@faker-js/faker'

import { createCaller } from '~~/server/api/trpc/init'
import { TestDatabase } from '~~/test/helpers/test-database'
import { TestDataFactory } from '~~/test/helpers/test-data-factory'
import { CUSTOMER_STATUSES } from '~~/types/customers'
import { customerDTOSchema, createCustomerSchema } from '~~/dto/customer'

describe('Customers tRPC Router Integration Tests', () => {
  let testDatabase: TestDatabase
  let dataFactory: TestDataFactory
  let caller: ReturnType<typeof createCaller>

  beforeAll(async () => {
    testDatabase = await TestDatabase.getInstance()
    dataFactory = new TestDataFactory(testDatabase.prisma)
    caller = createCaller({ prisma: testDatabase.prisma })
  })

  afterEach(async () => {
    await testDatabase.reset()
  })

  afterAll(async () => {
    await testDatabase.teardown()
  })

  describe('Customers getAll', () => {
    it('should retrieve paginated customers', async () => {
      // Create multiple customers for pagination test
      const customers = await Promise.all([
        dataFactory.createCustomerInDb(),
        dataFactory.createCustomerInDb(),
        dataFactory.createCustomerInDb()
      ])

      const result = await caller.customers.getAll({ 
        pageIndex: 1, 
        pageSize: 2 
      })

      expect(result.data.length).toBe(2)
      expect(result.totalCount).toBe(3)
      expect(result.totalPages).toBe(2)

      const returnedCustomerIds = result.data.map(c => c.id)
      const expectedCustomerIds = customers.slice(0, 2).map(c => c.id)
      expect(returnedCustomerIds).toEqual(expect.arrayContaining(expectedCustomerIds))
    })

    it('should handle empty result', async () => {
      const result = await caller.customers.getAll({ 
        pageIndex: 1, 
        pageSize: 10 
      })

      expect(result.data.length).toBe(0)
      expect(result.totalCount).toBe(0)
      expect(result.totalPages).toBe(0)
    })
  })

  describe('Customers getById', () => {
    it('should retrieve a specific customer', async () => {
      const customer = await dataFactory.createCustomerInDb()

      const retrievedCustomer = await caller.customers.getById({ id: customer.id })

      expect(retrievedCustomer).toMatchObject({
        id: customer.id,
        status: customer.status
      })
    })

    it('should throw error for non-existent customer', async () => {
      const nonExistentId = faker.string.uuid()
      
      await expect(caller.customers.getById({ id: nonExistentId }))
        .rejects.toThrow()
    })
  })

  describe('Customers create', () => {
    it('should create a new customer', async () => {
      const newCustomerData = {
        status: 'LEAD',
        source: 'WEBSITE'
      }

      const createdCustomer = await caller.customers.create(newCustomerData)

      expect(createdCustomer).toBeDefined()
      expect(createdCustomer.status).toBe('LEAD')
      expect(createdCustomer.source).toBe('WEBSITE')
    })

    it('should validate input during customer creation', async () => {
      const invalidCustomerData = {
        status: 'INVALID_STATUS',
        source: 'UNKNOWN_SOURCE'
      }

      await expect(caller.customers.create(invalidCustomerData as any))
        .rejects.toThrow()
    })
  })

  describe('Customers update', () => {
    it('should update an existing customer', async () => {
      const customer = await dataFactory.createCustomerInDb()

      const updateData = {
        id: customer.id,
        status: 'ACTIVE'
      }

      const updatedCustomer = await caller.customers.update(updateData)

      expect(updatedCustomer.status).toBe('ACTIVE')
      expect(updatedCustomer.id).toBe(customer.id)
    })

    it('should throw error when updating non-existent customer', async () => {
      const nonExistentId = faker.string.uuid()
      
      const updateData = {
        id: nonExistentId,
        status: 'ACTIVE'
      }

      await expect(caller.customers.update(updateData))
        .rejects.toThrow()
    })
  })

  describe('Customers updateStatus', () => {
    it('should update customer status', async () => {
      const customer = await dataFactory.createCustomerInDb()

      const updatedCustomer = await caller.customers.updateStatus({
        id: customer.id,
        status: 'ACTIVE',
        reason: 'Test status update'
      })

      expect(updatedCustomer.status).toBe('ACTIVE')
    })

    it('should validate status update input', async () => {
      const customer = await dataFactory.createCustomerInDb()

      await expect(caller.customers.updateStatus({
        id: customer.id,
        status: 'INVALID_STATUS' as any
      })).rejects.toThrow()
    })
  })

  describe('Customers delete', () => {
    it('should soft delete a customer', async () => {
      const customer = await dataFactory.createCustomerInDb()

      const deleteResult = await caller.customers.delete({ id: customer.id })

      expect(deleteResult.success).toBe(true)
      
      // Verify the customer is not completely removed but marked as deleted
      const retrievedCustomer = await caller.customers.getById({ id: customer.id })
      expect(retrievedCustomer.deletedAt).toBeTruthy()
    })

    it('should handle deleting non-existent customer', async () => {
      const nonExistentId = faker.string.uuid()

      await expect(caller.customers.delete({ id: nonExistentId }))
        .rejects.toThrow()
    })
  })

  describe('Customers search', () => {
    it('should search customers by query', async () => {
      const customers = await Promise.all([
        dataFactory.createCustomerInDb({ source: 'REFERRAL' }),
        dataFactory.createCustomerInDb({ source: 'WEBSITE' }),
        dataFactory.createCustomerInDb({ source: 'REFERRAL' })
      ])

      const searchResult = await caller.customers.search({
        query: 'REFERRAL',
        pageIndex: 1,
        pageSize: 10
      })

      expect(searchResult.data.length).toBe(2)
      expect(searchResult.totalCount).toBe(2)
      
      const searchedCustomerIds = searchResult.data.map(c => c.id)
      const expectedCustomerIds = customers
        .filter(c => c.source === 'REFERRAL')
        .map(c => c.id)
      
      expect(searchedCustomerIds).toEqual(expect.arrayContaining(expectedCustomerIds))
    })

    it('should handle empty search results', async () => {
      const searchResult = await caller.customers.search({
        query: 'NONEXISTENT',
        pageIndex: 1,
        pageSize: 10
      })

      expect(searchResult.data.length).toBe(0)
      expect(searchResult.totalCount).toBe(0)
    })
  })
})