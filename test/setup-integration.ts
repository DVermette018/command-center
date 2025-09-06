import { beforeAll, afterAll, afterEach } from 'vitest'
import { TestDatabase } from './helpers/test-database'
import { TestDataFactory } from './helpers/test-data-factory'

let testDatabase: TestDatabase
let testDataFactory: TestDataFactory

beforeAll(async () => {
  // Initialize test database before all tests
  testDatabase = await TestDatabase.getInstance()
  testDataFactory = new TestDataFactory(testDatabase.prisma)
})

afterEach(async () => {
  // Reset database after each test to ensure isolation
  await testDatabase.reset()
})

afterAll(async () => {
  // Teardown test database after all tests
  await testDatabase.teardown()
})

export { testDatabase, testDataFactory }