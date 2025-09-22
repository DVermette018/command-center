import type { useQuery } from '@tanstack/vue-query'
import type { AllowedAny, GenericObject } from '~/types/common'

export type Types = AllowedAny
type TArgs = AllowedAny

export interface DefineMutationArgs<TPayload, TResponse> {
  mutationFn: (variables: TPayload) => Promise<TResponse>
  cacheKey: string | string[]
  onSuccess?: (result: TResponse, payload: TPayload) => void
}

interface QueryOptions {
  retry?: (args: TArgs) => number
  gcTime?: (args: TArgs) => number
  staleTime?: (args: TArgs) => number

  enabled?: (args: TArgs) => boolean
  refetchOnWindowFocus?: (args: TArgs) => boolean
}

interface QueryConfig<TArgs, TResponse> {
  queryFn: (args: TArgs) => Promise<TResponse>
  queryKey: (args: TArgs) => string[] | (string | number)[] | GenericObject
  options?: QueryOptions
}

interface MutationConfig<TPayload, TResponse> {
  request: (payload: TPayload) => Promise<TResponse>
  cacheKey: (payload: TPayload, response: TResponse) => (string | string[])[]
}

export type QueriesRecord = Record<string, QueryConfig<Types, Types>>
export type MutationsRecord = Record<string, MutationConfig<Types, Types>>
export type ServiceFromQueries<Q extends QueriesRecord> = {
  [K in keyof Q as `use${Capitalize<string & K>}Query`]: Q[K] extends QueryConfig<void, infer TResponse>
    ? () => ReturnType<typeof useQuery<TResponse>>
    : (args: Parameters<Q[K]['queryFn']>[0]) => ReturnType<typeof useQuery<Awaited<ReturnType<Q[K]['queryFn']>>>>
}
export type ServiceFromMutations<M extends MutationsRecord> = {
  [K in keyof M as `use${Capitalize<string & K>}Mutation`]: () => (
    payload: Parameters<M[K]['request']>[0]
  ) => Promise<Awaited<ReturnType<M[K]['request']>>>
}
