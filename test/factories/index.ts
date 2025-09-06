import { faker } from '@faker-js/faker'

/**
 * Factory for creating mock user data
 */
export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    avatar: faker.image.avatar(),
    role: 'user',
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
    ...overrides
  }
}

/**
 * Factory for creating mock project data
 */
export function createMockProject(overrides: Partial<Project> = {}): Project {
  return {
    id: faker.string.uuid(),
    name: faker.company.name(),
    description: faker.lorem.paragraph(),
    status: faker.helpers.arrayElement(['active', 'inactive', 'archived']),
    ownerId: faker.string.uuid(),
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
    ...overrides
  }
}

/**
 * Factory for creating mock customer data
 */
export function createMockCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: faker.string.uuid(),
    name: faker.company.name(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zipCode: faker.location.zipCode(),
      country: faker.location.country()
    },
    status: faker.helpers.arrayElement(['active', 'inactive', 'prospect']),
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
    ...overrides
  }
}

/**
 * Factory for creating mock API responses
 */
export function createMockApiResponse<T>(
  data: T,
  overrides: Partial<ApiResponse<T>> = {}
): ApiResponse<T> {
  return {
    data,
    success: true,
    message: 'Success',
    timestamp: new Date().toISOString(),
    ...overrides
  }
}

/**
 * Factory for creating mock API error responses
 */
export function createMockApiError(
  overrides: Partial<ApiError> = {}
): ApiError {
  return {
    success: false,
    message: faker.lorem.sentence(),
    code: faker.helpers.arrayElement(['VALIDATION_ERROR', 'NOT_FOUND', 'UNAUTHORIZED', 'SERVER_ERROR']),
    timestamp: new Date().toISOString(),
    details: faker.lorem.paragraph(),
    ...overrides
  }
}

/**
 * Factory for creating mock form data
 */
export function createMockFormData(overrides: Record<string, any> = {}): Record<string, any> {
  return {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    message: faker.lorem.paragraph(),
    ...overrides
  }
}

/**
 * Factory for creating mock pagination data
 */
export function createMockPagination(overrides: Partial<Pagination> = {}): Pagination {
  const total = overrides.total || faker.number.int({ min: 50, max: 1000 })
  const limit = overrides.limit || 10
  const page = overrides.page || 1
  const totalPages = Math.ceil(total / limit)

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    ...overrides
  }
}

/**
 * Factory for creating lists of mock data
 */
export function createMockList<T>(
  factory: () => T,
  count: number = 5
): T[] {
  return Array.from({ length: count }, factory)
}

/**
 * Factory for creating mock table data with pagination
 */
export function createMockTableData<T>(
  itemFactory: () => T,
  options: {
    page?: number
    limit?: number
    total?: number
  } = {}
): {
  items: T[]
  pagination: Pagination
} {
  const pagination = createMockPagination(options)
  const itemCount = Math.min(pagination.limit, pagination.total - ((pagination.page - 1) * pagination.limit))
  const items = createMockList(itemFactory, itemCount)

  return {
    items,
    pagination
  }
}

// Type definitions (these would typically be imported from your actual types)
interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: string
  createdAt: Date
  updatedAt: Date
}

interface Project {
  id: string
  name: string
  description: string
  status: string
  ownerId: string
  createdAt: Date
  updatedAt: Date
}

interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  address?: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  status: string
  createdAt: Date
  updatedAt: Date
}

interface ApiResponse<T> {
  data: T
  success: boolean
  message: string
  timestamp: string
}

interface ApiError {
  success: false
  message: string
  code: string
  timestamp: string
  details?: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}