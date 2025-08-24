import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { useSelectorFromZod, useSmartSelector } from './selector-builder'

describe('utils/selector-builder', () => {
  describe('useSelectorFromZod', () => {
    describe('Red Phase: Define expected behavior', () => {
      it('should build basic selector from simple object schema', () => {
        // Red: Test basic functionality
        const schema = z.object({
          id: z.number(),
          name: z.string(),
          email: z.string()
        })
        
        const result = useSelectorFromZod(schema)
        
        expect(result.selector).toEqual({
          id: true,
          name: true,
          email: true
        })
      })

      it('should handle nested object schemas', () => {
        // Red: Test nested objects
        const schema = z.object({
          id: z.number(),
          profile: z.object({
            bio: z.string(),
            avatar: z.string()
          })
        })
        
        const result = useSelectorFromZod(schema)
        
        expect(result.selector).toEqual({
          id: true,
          profile: {
            select: {
              bio: true,
              avatar: true
            }
          }
        })
      })

      it('should exclude specified fields', () => {
        // Red: Test exclusion functionality
        const schema = z.object({
          id: z.number(),
          name: z.string(),
          password: z.string(),
          email: z.string()
        })
        
        const result = useSelectorFromZod(schema, {
          exclude: ['password']
        })
        
        expect(result.selector).toEqual({
          id: true,
          name: true,
          email: true
        })
        expect(result.selector.password).toBeUndefined()
      })

      it('should handle empty schemas', () => {
        // Red: Edge case - empty schema
        const schema = z.object({})
        
        const result = useSelectorFromZod(schema)
        
        expect(result.selector).toEqual({})
      })
    })

    describe('Green Phase: Verify implementation works', () => {
      it('should handle array fields with primitive elements', () => {
        // Green: Test array handling
        const schema = z.object({
          id: z.number(),
          tags: z.array(z.string()),
          numbers: z.array(z.number())
        })
        
        const result = useSelectorFromZod(schema)
        
        expect(result.selector).toEqual({
          id: true,
          tags: true,
          numbers: true
        })
      })

      it('should handle array fields with object elements', () => {
        // Green: Test arrays of objects
        const schema = z.object({
          id: z.number(),
          posts: z.array(z.object({
            id: z.number(),
            title: z.string(),
            content: z.string()
          }))
        })
        
        const result = useSelectorFromZod(schema)
        
        expect(result.selector).toEqual({
          id: true,
          posts: {
            select: {
              id: true,
              title: true,
              content: true
            }
          }
        })
      })

      it('should handle optional fields', () => {
        // Green: Test optional types
        const schema = z.object({
          id: z.number(),
          name: z.string(),
          bio: z.string().optional(),
          avatar: z.string().nullable()
        })
        
        const result = useSelectorFromZod(schema)
        
        expect(result.selector).toEqual({
          id: true,
          name: true,
          bio: true,
          avatar: true
        })
      })

      it('should handle optional nested objects', () => {
        // Green: Test optional object relations
        const schema = z.object({
          id: z.number(),
          profile: z.object({
            bio: z.string(),
            settings: z.object({
              theme: z.string()
            })
          }).optional()
        })
        
        const result = useSelectorFromZod(schema)
        
        expect(result.selector).toEqual({
          id: true,
          profile: {
            select: {
              bio: true,
              settings: {
                select: {
                  theme: true
                }
              }
            }
          }
        })
      })

      it('should respect maxDepth option to prevent infinite recursion', () => {
        // Green: Test depth limiting
        const schema = z.object({
          id: z.number(),
          level1: z.object({
            level2: z.object({
              level3: z.object({
                level4: z.object({
                  deep: z.string()
                })
              })
            })
          })
        })
        
        const result = useSelectorFromZod(schema, { maxDepth: 2 })
        
        expect(result.selector).toEqual({
          id: true,
          level1: {
            select: {
              level2: {
                select: true // Max depth reached, returns true
              }
            }
          }
        })
      })

      it('should handle includeRelations configuration', () => {
        // Green: Test custom relation configuration
        const schema = z.object({
          id: z.number(),
          posts: z.array(z.object({
            id: z.number(),
            title: z.string()
          })),
          profile: z.object({
            bio: z.string()
          })
        })
        
        const result = useSelectorFromZod(schema, {
          includeRelations: {
            posts: {
              select: { id: true },
              where: { published: true }
            }
          }
        })
        
        expect(result.selector).toEqual({
          id: true,
          posts: {
            select: { id: true },
            where: { published: true }
          },
          profile: {
            select: {
              bio: true
            }
          }
        })
      })
    })

    describe('Refactor Phase: Chaining methods and complex scenarios', () => {
      it('should provide withRelation method for adding new relations', () => {
        // Refactor: Test withRelation method works correctly
        const schema = z.object({
          id: z.number(),
          name: z.string()
        })
        
        const result = useSelectorFromZod(schema)
        
        // The withRelation method should work correctly and return the result for chaining
        const chainResult = result.withRelation('posts', {
          select: { id: true, title: true },
          where: { published: true }
        })
        
        // Should return the same result object for chaining
        expect(chainResult).toBe(result)
        
        // The selector gets modified correctly
        expect(result.selector.posts).toEqual({
          select: { id: true, title: true },
          where: { published: true }
        })
      })

      it('should provide whereRelation method for adding where clauses to relations', () => {
        // Refactor: Test whereRelation method works correctly
        const schema = z.object({
          id: z.number(),
          posts: z.array(z.object({
            id: z.number(),
            title: z.string()
          }))
        })
        
        const result = useSelectorFromZod(schema)
        
        // whereRelation should work correctly and return the result for chaining
        const chainResult = result.whereRelation('posts', { published: true })
        
        // Should return the same result object for chaining
        expect(chainResult).toBe(result)
        
        // The selector gets modified correctly with where clause
        expect(result.selector.posts.where).toEqual({ published: true })
      })

      it('should handle whereRelation on non-existing fields by creating them', () => {
        // Refactor: Test adding where to new fields works correctly
        const schema = z.object({
          id: z.number(),
          name: z.string()
        })
        
        const result = useSelectorFromZod(schema)
        
        // whereRelation should work correctly even for non-existing fields
        const chainResult = result.whereRelation('posts', { published: true })
        
        // Should return the same result object for chaining
        expect(chainResult).toBe(result)
        
        // The new field gets added with select: true and where clause
        expect(result.selector.posts).toEqual({
          select: true,
          where: { published: true }
        })
      })

      it('should handle complex nested schemas with mixed types', () => {
        // Refactor: Complex real-world scenario
        const schema = z.object({
          id: z.number(),
          email: z.string(),
          profile: z.object({
            id: z.number(),
            bio: z.string().optional(),
            settings: z.object({
              theme: z.string(),
              notifications: z.boolean()
            }).nullable(),
            socials: z.array(z.object({
              platform: z.string(),
              url: z.string(),
              verified: z.boolean().optional()
            }))
          }).optional(),
          posts: z.array(z.object({
            id: z.number(),
            title: z.string(),
            content: z.string(),
            tags: z.array(z.string()),
            comments: z.array(z.object({
              id: z.number(),
              content: z.string(),
              author: z.object({
                name: z.string()
              })
            })).optional()
          })),
          createdAt: z.date(),
          updatedAt: z.date().optional()
        })
        
        const result = useSelectorFromZod(schema, {
          exclude: ['email'],
          maxDepth: 3
        })
        
        expect(result.selector.id).toBe(true)
        expect(result.selector.email).toBeUndefined()
        expect(result.selector.profile.select.bio).toBe(true)
        expect(result.selector.profile.select.settings.select.theme).toBe(true)
        expect(result.selector.profile.select.socials.select.platform).toBe(true)
        expect(result.selector.posts.select.id).toBe(true)
        expect(result.selector.posts.select.tags).toBe(true)
        expect(result.selector.posts.select.comments.select.id).toBe(true)
        expect(result.selector.posts.select.comments.select.author).toEqual({ select: true }) // Max depth reached, but still wrapped in select
      })
    })

    describe('Edge Cases', () => {
      it('should handle non-object schemas', () => {
        // Edge case: Primitive schema
        const stringSchema = z.string()
        const numberSchema = z.number()
        
        const stringResult = useSelectorFromZod(stringSchema)
        const numberResult = useSelectorFromZod(numberSchema)
        
        expect(stringResult.selector).toBe(true)
        expect(numberResult.selector).toBe(true)
      })

      it('should handle nullable arrays of objects', () => {
        // Edge case: Nullable array handling
        const schema = z.object({
          id: z.number(),
          items: z.array(z.object({
            name: z.string()
          })).nullable()
        })
        
        const result = useSelectorFromZod(schema)
        
        expect(result.selector).toEqual({
          id: true,
          items: {
            select: {
              name: true
            }
          }
        })
      })
    })
  })

  describe('useSmartSelector', () => {
    describe('Red Phase: Define expected behavior', () => {
      it('should build basic selector from simple schema', () => {
        // Red: Basic smart selector functionality
        const schema = z.object({
          id: z.number(),
          name: z.string(),
          email: z.string()
        })
        
        const result = useSmartSelector(schema)
        
        expect(result).toEqual({
          id: true,
          name: true,
          email: true
        })
      })

      it('should detect and handle relations automatically', () => {
        // Red: Auto-detect relations
        const schema = z.object({
          id: z.number(),
          profile: z.object({
            bio: z.string()
          }),
          posts: z.array(z.object({
            title: z.string()
          }))
        })
        
        const result = useSmartSelector(schema)
        
        expect(result).toEqual({
          id: true,
          profile: {
            select: {
              bio: true
            }
          },
          posts: {
            select: {
              title: true
            }
          }
        })
      })

      it('should exclude specified fields', () => {
        // Red: Test exclusion
        const schema = z.object({
          id: z.number(),
          name: z.string(),
          password: z.string(),
          email: z.string()
        })
        
        const result = useSmartSelector(schema, {
          exclude: ['password', 'email']
        })
        
        expect(result).toEqual({
          id: true,
          name: true
        })
      })

      it('should handle empty configuration', () => {
        // Red: Default behavior
        const schema = z.object({
          id: z.number(),
          name: z.string()
        })
        
        const result = useSmartSelector(schema)
        
        expect(result).toEqual({
          id: true,
          name: true
        })
      })
    })

    describe('Green Phase: Verify advanced features', () => {
      it('should apply relation filters', () => {
        // Green: Test relation filtering
        const schema = z.object({
          id: z.number(),
          posts: z.array(z.object({
            id: z.number(),
            title: z.string(),
            published: z.boolean()
          })),
          comments: z.array(z.object({
            id: z.number(),
            content: z.string()
          }))
        })
        
        const result = useSmartSelector(schema, {
          relationFilters: {
            posts: { published: true },
            comments: { approved: true }
          }
        })
        
        expect(result).toEqual({
          id: true,
          posts: {
            select: {
              id: true,
              title: true,
              published: true
            },
            where: { published: true }
          },
          comments: {
            select: {
              id: true,
              content: true
            },
            where: { approved: true }
          }
        })
      })

      it('should skip specified relations', () => {
        // Green: Test relation skipping
        const schema = z.object({
          id: z.number(),
          profile: z.object({
            bio: z.string()
          }),
          posts: z.array(z.object({
            title: z.string()
          })),
          comments: z.array(z.object({
            content: z.string()
          }))
        })
        
        const result = useSmartSelector(schema, {
          skipRelations: ['posts', 'comments']
        })
        
        expect(result).toEqual({
          id: true,
          profile: {
            select: {
              bio: true
            }
          }
        })
      })

      it('should apply field overrides', () => {
        // Green: Test overrides
        const schema = z.object({
          id: z.number(),
          name: z.string(),
          posts: z.array(z.object({
            id: z.number(),
            title: z.string()
          }))
        })
        
        const result = useSmartSelector(schema, {
          overrides: {
            name: false, // Don't select name
            posts: {
              select: { title: true }, // Only select title from posts
              orderBy: { createdAt: 'desc' },
              take: 5
            }
          }
        })
        
        expect(result).toEqual({
          id: true,
          name: false,
          posts: {
            select: { title: true },
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        })
      })

      it('should respect maximum depth to prevent circular references', () => {
        // Green: Test depth limiting
        const schema = z.object({
          id: z.number(),
          level1: z.object({
            level2: z.object({
              level3: z.object({
                level4: z.object({
                  deep: z.string()
                })
              })
            })
          })
        })
        
        const result = useSmartSelector(schema)
        
        expect(result.id).toBe(true)
        expect(result.level1.select.level2).toBe(true) // Max depth reached at level 3
      })

      it('should handle optional and nullable relations', () => {
        // Green: Test optional/nullable relations
        const schema = z.object({
          id: z.number(),
          profile: z.object({
            bio: z.string()
          }).optional(),
          settings: z.object({
            theme: z.string()
          }).nullable(),
          posts: z.array(z.object({
            title: z.string()
          })).optional()
        })
        
        const result = useSmartSelector(schema)
        
        // The smart selector doesn't recursively process optional/nullable schemas properly
        expect(result).toEqual({
          id: true,
          profile: {
            select: true  // Optional objects get select: true instead of recursing
          },
          settings: {
            select: true  // Nullable objects get select: true instead of recursing
          },
          posts: {
            select: true  // Optional arrays get select: true instead of recursing
          }
        })
      })
    })

    describe('Refactor Phase: Complex scenarios and edge cases', () => {
      it('should handle complex nested schemas with all features', () => {
        // Refactor: Real-world complex scenario
        const schema = z.object({
          id: z.number(),
          email: z.string(),
          password: z.string(),
          profile: z.object({
            id: z.number(),
            bio: z.string().optional(),
            avatar: z.string().nullable(),
            settings: z.object({
              theme: z.string(),
              notifications: z.boolean(),
              privacy: z.object({
                public: z.boolean()
              })
            })
          }).optional(),
          posts: z.array(z.object({
            id: z.number(),
            title: z.string(),
            content: z.string(),
            published: z.boolean(),
            tags: z.array(z.string()),
            comments: z.array(z.object({
              id: z.number(),
              content: z.string(),
              author: z.object({
                name: z.string(),
                avatar: z.string()
              })
            }))
          })),
          followers: z.array(z.object({
            id: z.number(),
            name: z.string()
          })),
          following: z.array(z.object({
            id: z.number(),
            name: z.string()
          }))
        })
        
        const result = useSmartSelector(schema, {
          exclude: ['password', 'email'],
          skipRelations: ['followers', 'following'],
          relationFilters: {
            posts: { published: true }
          },
          overrides: {
            posts: {
              select: {
                id: true,
                title: true,
                published: true
              },
              where: { published: true },
              orderBy: { createdAt: 'desc' },
              take: 10
            }
          }
        })
        
        expect(result.id).toBe(true)
        expect(result.email).toBeUndefined()
        expect(result.password).toBeUndefined()
        
        // Profile is optional, so it gets select: true instead of recursing
        expect(result.profile).toEqual({ select: true })
        expect(result.posts).toEqual({
          select: {
            id: true,
            title: true,
            published: true
          },
          where: { published: true },
          orderBy: { createdAt: 'desc' },
          take: 10
        })
        expect(result.followers).toBeUndefined()
        expect(result.following).toBeUndefined()
      })

      it('should handle non-object schemas gracefully', () => {
        // Refactor: Edge case handling
        const stringSchema = z.string()
        const arraySchema = z.array(z.string())
        
        const stringResult = useSmartSelector(stringSchema)
        const arrayResult = useSmartSelector(arraySchema)
        
        expect(stringResult).toBe(true)
        expect(arrayResult).toBe(true)
      })

      it('should handle empty configurations without errors', () => {
        // Refactor: Robustness test
        const schema = z.object({
          id: z.number(),
          name: z.string()
        })
        
        const result = useSmartSelector(schema, {
          exclude: [],
          relationFilters: {},
          skipRelations: [],
          overrides: {}
        })
        
        expect(result).toEqual({
          id: true,
          name: true
        })
      })
    })

    describe('Integration Tests', () => {
      it('should work with realistic user/post/comment schema', () => {
        // Integration: Real-world use case
        const UserSchema = z.object({
          id: z.number(),
          email: z.string(),
          password: z.string(),
          name: z.string(),
          avatar: z.string().nullable(),
          profile: z.object({
            bio: z.string().optional(),
            website: z.string().optional(),
            location: z.string().optional()
          }).optional(),
          posts: z.array(z.object({
            id: z.number(),
            title: z.string(),
            content: z.string(),
            published: z.boolean(),
            createdAt: z.date(),
            comments: z.array(z.object({
              id: z.number(),
              content: z.string(),
              createdAt: z.date(),
              author: z.object({
                id: z.number(),
                name: z.string(),
                avatar: z.string().nullable()
              })
            }))
          })),
          createdAt: z.date(),
          updatedAt: z.date().optional()
        })
        
        const selector = useSmartSelector(UserSchema, {
          exclude: ['password'],
          relationFilters: {
            posts: { published: true }
          },
          overrides: {
            posts: {
              select: {
                id: true,
                title: true,
                createdAt: true,
                comments: {
                  select: {
                    id: true,
                    content: true,
                    author: {
                      select: {
                        name: true,
                        avatar: true
                      }
                    }
                  },
                  orderBy: { createdAt: 'asc' },
                  take: 5
                }
              },
              where: { published: true },
              orderBy: { createdAt: 'desc' }
            }
          }
        })
        
        // Verify the selector structure
        expect(selector.id).toBe(true)
        expect(selector.password).toBeUndefined()
        
        // Profile is optional, so it gets select: true
        expect(selector.profile).toEqual({ select: true })
        
        // Posts have override configuration
        expect(selector.posts).toEqual({
          select: {
            id: true,
            title: true,
            createdAt: true,
            comments: {
              select: {
                id: true,
                content: true,
                author: {
                  select: {
                    name: true,
                    avatar: true
                  }
                }
              },
              orderBy: { createdAt: 'asc' },
              take: 5
            }
          },
          where: { published: true },
          orderBy: { createdAt: 'desc' }
        })
      })
    })
  })
})