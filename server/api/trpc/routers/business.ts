import { baseProcedure } from '../init'
import { repositories } from '~~/server/repositories'
import { businessSchema, createBusinessProfileSchema } from '~~/dto/business'

export const registerRoutes = () => ({
  store: baseProcedure
    .input(createBusinessProfileSchema)
    .output(businessSchema)
    .mutation(async ({ input }) => {
      const business = await repositories.business.create(input)
      return businessSchema.parse(business)
    }),

  // // Update existing business
  // update: baseProcedure
  //   .input(updateBusinessProfileSchema)
  //   .mutation(async (opts) => {
  //     const { id, ...updateData } = opts.input
  //     return await repositories.business.updateBusiness(id, {
  //       ...updateData,
  //       updatedAt: new Date()
  //     })
  //   }),
  //
  // // Delete business
  // delete: baseProcedure
  //   .input(
  //     z.object({
  //       id: z.string().min(1, 'ID is required')
  //     })
  //   )
  //   .mutation(async (opts) => {
  //     return await repositories.business.deleteBusiness(opts.input.id)
  //   })

})
