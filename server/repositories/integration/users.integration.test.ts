import { describe, it, expect } from 'vitest'
import { testDatabase, testDataFactory } from '~/test/setup-integration'

describe('User Repository Integration Tests', () => {
  it('should create a user', async () => {
    const prisma = testDatabase.prisma

    // Create a user using the test data factory
    const user = await testDataFactory.createUserInDb({
      email: 'test.integration@example.com',
      firstName: 'Integration',
      lastName: 'Tester'
    })

    // Check that the user was created successfully
    expect(user).toBeDefined()
    expect(user.email).toBe('test.integration@example.com')
    expect(user.firstName).toBe('Integration')
    expect(user.lastName).toBe('Tester')

    // Verify the user exists in the database
    const foundUser = await prisma.user.findUnique({
      where: { id: user.id }
    })

    expect(foundUser).toBeDefined()
    expect(foundUser?.email).toBe('test.integration@example.com')
  })

  it('should create a user with a specific role', async () => {
    const user = await testDataFactory.createUserInDb({
      role: 'ADMIN'
    })

    expect(user.role).toBe('ADMIN')
  })
})