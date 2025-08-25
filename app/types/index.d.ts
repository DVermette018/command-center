// Import types from the main types directory
export type { Period, Range } from '~~/types/common'
export type { UserRole } from '~~/types/user'
// We re-export User from main types but also create UI-specific User interface for components
export type { User as ApiUser } from '~~/types/user'

export type SaleStatus = 'paid' | 'failed' | 'refunded'

export interface Avatar {
  src: string
  alt: string
}

// UI-specific User interface for components that need avatar and display name
export interface User {
  id: number
  name: string
  email: string
  avatar: Avatar
}

export interface Mail {
  id: number
  unread?: boolean
  from: User
  subject: string
  body: string
  date: string
}

export interface Member {
  name: string
  username: string
  role: 'member' | 'owner'
  avatar: Avatar
}

export interface Stat {
  title: string
  key: string
  icon: string
  value: number | string
  variation: number
  formatter?: (value: number) => string
}

export interface Sale {
  id: string
  date: string
  status: SaleStatus
  email: string
  amount: number
}

export interface Notification {
  id: number
  unread?: boolean
  sender: User
  body: string
  date: string
}

