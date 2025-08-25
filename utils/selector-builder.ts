import { z } from 'zod'

/**
 * Extracts the Prisma selector from a Zod schema
 * This is the magic that eliminates manual field listing!
 */
export const useSelectorFromZod = <T extends z.ZodTypeAny>(
  schema: T,
  options?: {
    exclude?: string[]
    includeRelations?: Record<string, any>
    maxDepth?: number
  }
) => {
  const { exclude = [], includeRelations = {}, maxDepth = 3 } = options || {}

  /**
   * Recursively build selector from Zod schema
   */
  const buildSelector = (
    zodSchema: z.ZodTypeAny,
    currentDepth = 0
  ): any => {
    // Prevent infinite recursion
    if (currentDepth >= maxDepth) {
      return true
    }

    // Handle different Zod types
    if (zodSchema instanceof z.ZodObject) {
      const shape = zodSchema.shape
      const selector: any = {}

      for (const [key, value] of Object.entries(shape)) {
        // Skip excluded fields
        if (exclude.includes(key)) continue

        // Check if this is a relation with custom config
        if (includeRelations[key]) {
          selector[key] = includeRelations[key]
        }
        // If it's an object or array, recurse
        else if (value instanceof z.ZodObject) {
          selector[key] = {
            select: buildSelector(value, currentDepth + 1)
          }
        }
        else if (value instanceof z.ZodArray) {
          const element = (value as any).element
          if (element instanceof z.ZodObject) {
            selector[key] = {
              select: buildSelector(element, currentDepth + 1)
            }
          } else {
            selector[key] = true
          }
        }
        else if (value instanceof z.ZodOptional || value instanceof z.ZodNullable) {
          // Unwrap optional/nullable and process the inner type
          const innerType = (value as any)._def.innerType
          if (innerType instanceof z.ZodObject) {
            selector[key] = {
              select: buildSelector(innerType, currentDepth + 1)
            }
          } else if (innerType instanceof z.ZodArray) {
            const element = (innerType as any).element
            if (element instanceof z.ZodObject) {
              selector[key] = {
                select: buildSelector(element, currentDepth + 1)
              }
            } else {
              selector[key] = true
            }
          } else {
            selector[key] = true
          }
        }
        // For primitive types, just include them
        else {
          selector[key] = true
        }
      }

      return selector
    }

    // For non-object types at root level
    return true
  }

  const selector = buildSelector(schema)

  const result = {
    selector,

    /**
     * Add or override specific relations
     */
    withRelation: (name: string, config: any) => {
      selector[name] = config
      return result
    },

    /**
     * Add where clause to a relation
     */
    whereRelation: (name: string, where: any) => {
      if (selector[name] && typeof selector[name] === 'object') {
        selector[name].where = where
      } else {
        selector[name] = { select: true, where }
      }
      return result
    }
  }

  return result
}

// ============================================
// SMART SELECTOR WITH SCHEMA INFERENCE
// ============================================

/**
 * Enhanced version that handles common Prisma patterns
 */
export const useSmartSelector = <T extends z.ZodTypeAny>(
  schema: T,
  config?: {
    // Fields to exclude from selection
    exclude?: string[]
    // Relations with specific where clauses
    relationFilters?: Record<string, any>
    // Relations to skip entirely
    skipRelations?: string[]
    // Override specific fields/relations
    overrides?: Record<string, any>
  }
) => {
  const {
    exclude = [],
    relationFilters = {},
    skipRelations = [],
    overrides = {}
  } = config || {}

  // Get schema shape for analysis
  const analyzeSchema = (zodSchema: z.ZodTypeAny): Set<string> => {
    const relations = new Set<string>()

    if (zodSchema instanceof z.ZodObject) {
      const shape = zodSchema.shape

      for (const [key, value] of Object.entries(shape)) {
        // Detect relations (arrays of objects or nested objects)
        if (value instanceof z.ZodArray) {
          const element = (value as any).element
          if (element instanceof z.ZodObject) {
            relations.add(key)
          }
        } else if (value instanceof z.ZodObject) {
          relations.add(key)
        } else if (value instanceof z.ZodOptional || value instanceof z.ZodNullable) {
          const innerType = (value as any)._def.innerType
          if (innerType instanceof z.ZodObject ||
            (innerType instanceof z.ZodArray && (innerType as any).element instanceof z.ZodObject)) {
            relations.add(key)
          }
        }
      }
    }

    return relations
  }

  const detectedRelations = analyzeSchema(schema)

  // Build the selector
  const buildSmartSelector = (zodSchema: z.ZodTypeAny, depth = 0): any => {
    if (depth >= 3) return true // Max depth to prevent circular refs

    if (!(zodSchema instanceof z.ZodObject)) return true

    const shape = zodSchema.shape
    const selector: any = {}

    for (const [key, value] of Object.entries(shape)) {
      // Apply exclusions
      if (exclude.includes(key) || skipRelations.includes(key)) continue

      // Apply overrides first
      if (overrides[key] !== undefined) {
        selector[key] = overrides[key]
        continue
      }

      // Handle relations
      if (detectedRelations.has(key)) {
        const relationSelect = buildSmartSelector(
          value instanceof z.ZodArray ? (value as any).element : value,
          depth + 1
        )

        selector[key] = {
          select: relationSelect,
          ...(relationFilters[key] && { where: relationFilters[key] })
        }
      } else {
        // Simple field
        selector[key] = true
      }
    }

    return selector
  }

  return buildSmartSelector(schema)
}
