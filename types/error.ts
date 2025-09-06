import type { TRPCError } from '@trpc/server'
import type { QueryClient } from '@tanstack/vue-query'

export interface ErrorClassification {
  type: 'client' | 'server' | 'network' | 'timeout' | 'unknown'
  code?: string
  isRetryable: boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface ErrorContext {
  context: 'form-submission' | 'form-validation' | 'data-fetch' | 'mutation' | 'background-sync' | 'critical-operation' | 'protected-route' | 'data-update' | 'bulk-operation' | 'api-call'
  queryKeys?: string[]
  removeStaleQueries?: boolean
  optimisticData?: any
  preserveOptimistic?: boolean
  silent?: boolean
  resourceType?: string
  suggestAlternatives?: boolean
  userId?: string
}

export interface RetryConfig {
  maxRetries: number
  baseDelay?: number
  maxDelay?: number
  exponentialBase?: number
}

export interface ErrorHandlerOptions {
  toast?: any
  queryClient?: QueryClient
}

export interface ErrorAnalytics {
  event: string
  errorCode?: string
  errorType: string
  context: string
  userId?: string
  isRetryable: boolean
  timestamp?: Date
}

export interface ErrorRecoveryAction {
  label: string
  click: () => void
  key?: string
  variant?: 'solid' | 'outline' | 'ghost'
  color?: string
}

export interface ErrorPattern {
  [key: string]: number
}