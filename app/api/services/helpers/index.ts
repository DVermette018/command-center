// ~/api/services/helpers.ts
import { useMutation, type UseMutationReturnType, useQuery, useQueryClient } from '@tanstack/vue-query'

interface QueryConfig<TArgs, TResponse> {
  queryFn: (args: TArgs) => Promise<TResponse>
  queryKey: (args: TArgs) => string[]
}

interface MutationConfig<TPayload, TResponse> {
  request: (payload: TPayload) => Promise<TResponse>
  /** Return one or many queryKeys (or arrays) to invalidate */
  cacheKey?: (payload: TPayload, response: TResponse) => (string | string[])[]
}

type QueriesRecord = Record<string, QueryConfig<any, any>>
type MutationsRecord = Record<string, MutationConfig<any, any>>

/** ------- Return types ------- */
// Hooks for queries
type QueryHookFor<QC> =
  QC extends QueryConfig<void, infer R>
    ? () => ReturnType<typeof useQuery<R>>
    : QC extends QueryConfig<infer A, infer R>
      ? (args: A) => ReturnType<typeof useQuery<R>>
      : never

// Plain callable for queries (what you want: planService.getAll -> Promise<Plan[]>)
type QueryCallFor<QC> =
  QC extends QueryConfig<void, infer R>
    ? () => Promise<R>
    : QC extends QueryConfig<infer A, infer R>
      ? (args: A) => Promise<R>
      : never

// Build both for every query key
type ServiceFromQueries<Q extends QueriesRecord> =
  {
    [K in keyof Q as `use${Capitalize<string & K>}Query`]: QueryHookFor<Q[K]>
  } & {
  [K in keyof Q]: QueryCallFor<Q[K]>
}

// Mutations: keep callable wrappers, plus the hook if you want
type MutationHookFor<MC> =
  MC extends MutationConfig<infer P, infer R>
    ? () => UseMutationReturnType<R, Error, P, void>
    : never

type MutationCallFor<MC> =
  MC extends MutationConfig<infer P, infer R>
    ? () => (payload: P) => Promise<R>
    : never

type ServiceFromMutations<M extends MutationsRecord> =
  {
    [K in keyof M as `use${Capitalize<string & K>}Mutation`]: MutationHookFor<M[K]>
  } & {
  [K in keyof M as `call${Capitalize<string & K>}`]: MutationCallFor<M[K]>
}

/** ------- API ------- */
export const defineMutation = <
  TPayload = Record<string, unknown>,
  TResponse = Record<string, unknown>,
  TError = Error
> ({
     mutationFn,
     cacheKey,
     onSuccess
   }: {
  mutationFn: (variables: TPayload) => Promise<TResponse>
  cacheKey: string | string[]
  onSuccess?: (result: TResponse, payload: TPayload) => void
}): UseMutationReturnType<TResponse, TError, TPayload, void> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (result: any, payload: any) => {
      const key = Array.isArray(cacheKey) ? cacheKey : [cacheKey]
      queryClient.invalidateQueries({ queryKey: key })
      onSuccess?.(result, payload)
    }
  })
}

export const defineService = <Q extends QueriesRecord, M extends MutationsRecord> (config: {
  queries: Q
  mutations: M
}): ServiceFromQueries<Q> & ServiceFromMutations<M> => {
  const service: Record<string, unknown> = {}

  // Queries: build hook + plain callable
  Object.entries(config.queries).forEach(([name, { queryKey, queryFn }]) => {
    const hookName = `use${name.charAt(0).toUpperCase() + name.slice(1)}Query`
    ;(service as any)[hookName] = (args?: any) =>
      useQuery({
        queryKey: queryKey(args),
        queryFn: () => queryFn(args)
      })

    // plain callable (typed Promise<R>)
    ;(service as any)[name] = (args?: any) => queryFn(args)
  })

  // Mutations: return both a real useMutation hook and your callable wrapper
  Object.entries(config.mutations).forEach(([name, { request, cacheKey }]) => {
    const hookName = `use${name.charAt(0).toUpperCase() + name.slice(1)}Mutation`;

    (service as any)[hookName] = () => {
      const queryClient = useQueryClient()
      return useMutation({
        mutationFn: request,
        onSuccess: (response: any, payload: any) => {
          if (!cacheKey) return
          for (const key of cacheKey(payload, response) || []) {
            queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] })
          }
        }
      })
    }

    const callName = `call${name.charAt(0).toUpperCase() + name.slice(1)}`
    ;(service as any)[callName] = () => {
      const queryClient = useQueryClient()
      return async (payload: any) => {
        const response = await request(payload)
        if (cacheKey) {
          for (const key of cacheKey(payload, response) || []) {
            queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] })
          }
        }
        return response
      }
    }
  })

  return service as ServiceFromQueries<Q> & ServiceFromMutations<M>
}
