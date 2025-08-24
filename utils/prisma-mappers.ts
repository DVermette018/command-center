/**
 * Generic date transformer for Prisma objects
 */
export const transformDates = <T extends Record<string, any>> (obj: T): T => {
  const transformed = { ...obj }

  for (const key in transformed) {
    const value = transformed[key]
    if (value instanceof Date) {
      (transformed as any)[key] = value.toISOString()
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      (transformed as any)[key] = transformDates(value)
    } else if (Array.isArray(value)) {
      (transformed as any)[key] = value.map((item: any) =>
        item && typeof item === 'object' ? transformDates(item) : item
      )
    }
  }

  return transformed
}

/**
 * Transform null to undefined for cleaner DTOs
 */
export const nullToUndefined = <T extends Record<string, any>> (obj: T): T => {
  const transformed = { ...obj }

  for (const key in transformed) {
    const value = transformed[key]
    if (value === null) {
      (transformed as any)[key] = undefined
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      (transformed as any)[key] = nullToUndefined(value)
    } else if (Array.isArray(value)) {
      (transformed as any)[key] = value.map((item: any) =>
        item && typeof item === 'object' ? nullToUndefined(item) : item
      )
    }
  }

  return transformed
}

/**
 * Compose multiple transformers
 */
export const prismaToDTO = <T extends Record<string, any>> (data: T): T => {
  return nullToUndefined(transformDates(data))
}
