import { z } from 'zod'

export const paginationInputSchema = z.object({
  pageIndex: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(200).default(10),
  search: z.string().optional().default('')
})

export const paginatedResponseSchema = <T extends z.ZodTypeAny> (item: T) => z.object({
  data: z.array(item),
  pagination: z.object({
    totalCount: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative()
  })
})
