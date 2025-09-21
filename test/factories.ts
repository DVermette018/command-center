import { faker } from '@faker-js/faker'
import type { Customer } from '~/types/customers'
import type { Project } from '~/types/project'

// Customer factory
export function createMockCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: faker.string.uuid(),
    status: faker.helpers.arrayElement(['LEAD', 'PROSPECT', 'ACTIVE', 'INACTIVE', 'CHURNED']),
    source: faker.helpers.arrayElement(['website', 'referral', 'social_media', 'cold_call', null]),
    createdAt: faker.date.recent().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    businessProfile: {
      businessName: faker.company.name(),
      legalName: faker.company.name() + ' LLC',
      taxId: faker.string.alphanumeric({ length: 10, casing: 'upper' }),
      category: faker.helpers.arrayElement(['technology', 'retail', 'healthcare', 'finance', 'education']),
      customCategory: null,
      website: faker.internet.url(),
      size: faker.helpers.arrayElement(['MICRO', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE']),
      address: {
        type: 'BUSINESS',
        isPrimary: true,
        street: faker.location.streetAddress(),
        street2: faker.location.secondaryAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zipCode: faker.location.zipCode(),
        country: faker.location.countryCode(),
        reference: faker.location.direction() + ' of ' + faker.location.city()
      }
    },
    contacts: [{
      id: faker.string.uuid(),
      customerId: faker.string.uuid(),
      position: faker.person.jobTitle(),
      department: faker.commerce.department(),
      isPrimary: true,
      user: {
        id: faker.string.uuid(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        avatar: faker.image.avatar(),
        createdAt: faker.date.recent(),
        updatedAt: faker.date.recent()
      }
    }],
    ...overrides
  }
}

// Project factory
export function createMockProject(overrides: Partial<Project> = {}): Project {
  // Create a mix of past, current, and future projects to simulate real scenarios
  const isCompletedProject = faker.datatype.boolean(0.3) // 30% chance of completed project
  const startDate = isCompletedProject 
    ? faker.date.past({ years: 1 }) // Past start date for completed projects
    : faker.date.recent({ days: 30 }) // Recent start date for ongoing projects
  
  const targetEndDate = new Date(startDate.getTime() + (faker.number.int({ min: 30, max: 180 }) * 24 * 60 * 60 * 1000))
  
  // Generate actualEndDate only for completed projects, between startDate and targetEndDate
  const actualEndDate = isCompletedProject 
    ? faker.date.between({ from: startDate, to: targetEndDate })
    : undefined
  
  return {
    id: faker.string.uuid(),
    customerId: faker.string.uuid(),
    name: faker.company.buzzPhrase(),
    description: faker.lorem.paragraph(),
    type: faker.helpers.arrayElement(['WEBSITE', 'BRANDING', 'MARKETING', 'CONSULTING', 'DEVELOPMENT', 'OTHER']),
    status: faker.helpers.arrayElement(['DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED', 'ARCHIVED']),
    phase: faker.helpers.arrayElement(['DISCOVERY', 'PLANNING', 'DESIGN', 'DEVELOPMENT', 'REVIEW', 'TESTING', 'LAUNCH', 'POST_LAUNCH', 'MAINTENANCE']),
    priority: faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    startDate: startDate,
    targetEndDate: targetEndDate,
    actualEndDate: actualEndDate,
    projectManager: {
      id: faker.string.uuid(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      role: 'PROJECT_MANAGER',
      avatar: faker.image.avatar(),
      createdAt: faker.date.recent(),
      updatedAt: faker.date.recent()
    },
    teamMembers: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => ({
      id: faker.string.uuid(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      role: faker.helpers.arrayElement(['DEVELOPER', 'DESIGNER', 'QA', 'PROJECT_MANAGER']),
      avatar: faker.image.avatar(),
      createdAt: faker.date.recent(),
      updatedAt: faker.date.recent()
    })),
    budget: faker.number.float({ min: 5000, max: 100000, fractionDigits: 2 }),
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
    ...overrides
  }
}

// User factory
export function createMockUser(overrides = {}) {
  return {
    id: faker.string.uuid(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    role: faker.helpers.arrayElement(['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER', 'DESIGNER', 'CLIENT']),
    avatar: faker.image.avatar(),
    isActive: faker.datatype.boolean(0.9),
    lastLoginAt: faker.date.recent(),
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
    ...overrides
  }
}

// API Response factory
export function createMockApiResponse<T>(data: T | T[], overrides = {}) {
  const isArray = Array.isArray(data)
  
  return {
    data: isArray ? data : data,
    success: true,
    message: 'Operation completed successfully',
    timestamp: new Date().toISOString(),
    pagination: isArray ? {
      page: 1,
      limit: 10,
      total: Array.isArray(data) ? data.length : 10,
      totalPages: Math.ceil((Array.isArray(data) ? data.length : 10) / 10)
    } : undefined,
    ...overrides
  }
}

// Error response factory
export function createMockErrorResponse(message = 'An error occurred', code = 'GENERIC_ERROR', overrides = {}) {
  return {
    success: false,
    error: {
      message,
      code,
      details: faker.lorem.sentence(),
      timestamp: new Date().toISOString()
    },
    ...overrides
  }
}

// Form data factory
export function createMockFormData(type: 'customer' | 'project' = 'customer', overrides = {}) {
  if (type === 'customer') {
    return {
      business: {
        businessName: faker.company.name(),
        legalName: faker.company.name() + ' Inc',
        taxId: faker.string.alphanumeric({ length: 10, casing: 'upper' }),
        category: faker.helpers.arrayElement(['technology', 'retail', 'healthcare']),
        size: faker.helpers.arrayElement(['MICRO', 'SMALL', 'MEDIUM', 'LARGE']),
        website: faker.internet.url(),
        address: {
          type: 'BUSINESS',
          isPrimary: true,
          street: faker.location.streetAddress(),
          street2: '',
          city: faker.location.city(),
          state: faker.location.state(),
          zipCode: faker.location.zipCode(),
          country: 'MX',
          reference: ''
        }
      },
      contact: {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        position: faker.person.jobTitle(),
        isPrimary: true
      },
      status: faker.helpers.arrayElement(['LEAD', 'PROSPECT', 'ACTIVE']),
      source: faker.helpers.arrayElement(['website', 'referral', 'social_media']),
      ...overrides
    }
  }
  
  // Project form data
  const startDate = faker.date.future()
  const targetEndDate = new Date(startDate.getTime() + (faker.number.int({ min: 30, max: 365 }) * 24 * 60 * 60 * 1000))
  
  return {
    customerId: faker.string.uuid(),
    name: faker.company.buzzPhrase(),
    description: faker.lorem.paragraph(),
    type: faker.helpers.arrayElement(['WEBSITE', 'BRANDING', 'DEVELOPMENT']),
    startDate: startDate,
    targetEndDate: targetEndDate,
    projectManagerId: faker.string.uuid(),
    budget: faker.number.float({ min: 5000, max: 50000, fractionDigits: 2 }),
    currency: faker.helpers.arrayElement(['USD', 'MXN', 'EUR']),
    ...overrides
  }
}

// Table data factory
export function createMockTableData<T>(factory: () => T, count = 5) {
  const items = Array.from({ length: count }, () => factory())
  return {
    items,
    pagination: {
      page: 1,
      limit: 10,
      total: count,
      totalPages: Math.ceil(count / 10)
    },
    success: true
  }
}

// Validation error factory
export function createMockValidationErrors(fields: string[] = []) {
  const errors = {}
  
  fields.forEach(field => {
    errors[field] = faker.helpers.arrayElement([
      `${field} is required`,
      `${field} must be a valid format`,
      `${field} is too short`,
      `${field} is too long`,
      `${field} contains invalid characters`
    ])
  })
  
  return errors
}

// Notification factory
export function createMockNotification(type: 'success' | 'error' | 'warning' | 'info' = 'info', overrides = {}) {
  return {
    id: faker.string.uuid(),
    type,
    title: faker.helpers.arrayElement([
      'Success!',
      'Error occurred',
      'Warning',
      'Information'
    ]),
    message: faker.lorem.sentence(),
    timestamp: new Date().toISOString(),
    read: faker.datatype.boolean(0.3),
    ...overrides
  }
}

// State factory for testing different application states
export function createMockAppState(overrides = {}) {
  return {
    customers: {
      data: Array.from({ length: 3 }, () => createMockCustomer()),
      loading: false,
      error: null,
      pagination: { page: 1, limit: 10, total: 3 }
    },
    projects: {
      data: Array.from({ length: 2 }, () => createMockProject()),
      loading: false,
      error: null,
      pagination: { page: 1, limit: 10, total: 2 }
    },
    users: {
      data: Array.from({ length: 5 }, () => createMockUser()),
      loading: false,
      error: null
    },
    ui: {
      modals: {
        customerAdd: false,
        customerEdit: false,
        customerDelete: false,
        projectAdd: false,
        projectEdit: false
      },
      selectedCustomer: null,
      selectedProject: null,
      notifications: []
    },
    ...overrides
  }
}

// Accessibility test data factory
export function createMockAccessibilityTestData() {
  return {
    customers: [
      createMockCustomer({
        id: 'accessible-customer-1',
        businessProfile: {
          businessName: 'Accessible Corp',
          category: 'Technology',
          size: 'MEDIUM'
        },
        status: 'ACTIVE'
      }),
      createMockCustomer({
        id: 'accessible-customer-2',
        businessProfile: {
          businessName: 'Inclusive Design LLC',
          category: 'Design',
          size: 'SMALL'
        },
        status: 'PROSPECT'
      })
    ],
    projects: [
      createMockProject({
        id: 'accessible-project-1',
        name: 'WCAG Compliance Project',
        type: 'WEBSITE',
        status: 'ACTIVE'
      })
    ],
    users: [
      createMockUser({
        id: 'accessible-user-1',
        firstName: 'Alice',
        lastName: 'Accessible',
        role: 'PROJECT_MANAGER'
      })
    ]
  }
}

// Performance test data factory
export function createLargeDataset(size: 'small' | 'medium' | 'large' = 'medium') {
  const sizes = {
    small: { customers: 10, projects: 20 },
    medium: { customers: 100, projects: 200 },
    large: { customers: 1000, projects: 2000 }
  }
  
  const config = sizes[size]
  
  return {
    customers: Array.from({ length: config.customers }, () => createMockCustomer()),
    projects: Array.from({ length: config.projects }, () => createMockProject())
  }
}

// Export utility function for creating overrides
export function createOverrides<T>(partialData: Partial<T>): Partial<T> {
  return { ...partialData }
}

// Deep merge utility for complex overrides
export function deepMerge<T>(target: T, source: Partial<T>): T {
  const result = { ...target }
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key])
    } else {
      result[key] = source[key]
    }
  }
  
  return result
}