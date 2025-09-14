import { useMutation, type UseMutationReturnType, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { GenericObject } from '~/types/common'
import type {
  DefineMutationArgs,
  MutationsRecord,
  QueriesRecord,
  ServiceFromMutations,
  ServiceFromQueries,
  Types
} from '~/api/models/helpers/types'

export const defineMutation = <TPayload = Record<string, Types>, TResponse = Record<string, Types>, TError = Error> ({
                                                                                                                       mutationFn,
                                                                                                                       cacheKey,
                                                                                                                       onSuccess
                                                                                                                     }: DefineMutationArgs<TPayload, TResponse>): UseMutationReturnType<TResponse, TError, TPayload, void> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: (result, payload) => {
      const keys = (typeof cacheKey === 'function') ? cacheKey(payload, result) : cacheKey
      const resolvedKeys = Array.isArray(keys) ? keys : [keys]
      console.log('Invalidating cache for keys:', resolvedKeys)

      for (const key of resolvedKeys) {
        queryClient.invalidateQueries({ queryKey: key })
      }
      onSuccess?.(result, payload)
    }
  })
}

export const defineService = <Q extends QueriesRecord, M extends MutationsRecord> (
  config: {
    queries: Q
    mutations: M
  }
): ServiceFromQueries<Q> & ServiceFromMutations<M> => {
  const service: Record<string, Types> = {}

  // Generate hooks for queries, for example: useGetAllQuery, useGetByIdQuery, etc.
  Object.entries(config.queries).forEach(([name, { queryKey, queryFn, options }]) => {
    const hookName = `use${name.charAt(0).toUpperCase() + name.slice(1)}Query`
    service[hookName] = (args?: GenericObject) => {
      return useQuery({
        queryKey: queryKey(args),
        queryFn: () => queryFn(args),
        enabled: computed(
          () => options?.enabled?.(args ?? {}) ?? true
        ),
        staleTime: options?.staleTime?.(args ?? {}) ?? 60 * 60 * 1000, // 1 hour
        retry: options?.retry?.(args ?? {}) ?? 3,
        gcTime: options?.gcTime?.(args ?? {}) ?? 60 * 60 * 1000 // 1 hour
      })
    }
  })

  // Generate mutations we can call directly instead of `const create = useMutation(...); await create.mutateAsync(...)`
  Object.entries(config.mutations).forEach(([name, { request, cacheKey }]) => {
    const hookName = `use${name.charAt(0).toUpperCase() + name.slice(1)}Mutation`
    service[hookName] = () => defineMutation({
      mutationFn: request,
      cacheKey
    })
  })

  return service as ServiceFromQueries<Q> & ServiceFromMutations<M>
}
