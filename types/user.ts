export const USER_ROLES = ['ADMIN', 'PROJECT_MANAGER', 'DESIGNER', 'DEVELOPER', 'SALES', 'SUPPORT', 'CUSTOMER'] as const
export type UserRole = typeof USER_ROLES[number];

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}
