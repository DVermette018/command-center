import { describe, it, expect } from 'vitest'
import { validateTranslations, getTranslationStats, loadTranslations } from '../utils/i18n-validator'
import { resolve } from 'path'

describe('i18n Validation', () => {
  const localesDir = resolve(__dirname, '../locales')

  it('should validate translation consistency', () => {
    const result = validateTranslations(localesDir)
    
    expect(result).toBeDefined()
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should load English translations correctly', () => {
    const translations = loadTranslations(resolve(localesDir, 'en'))
    
    expect(translations).toBeDefined()
    expect(translations.common).toBeDefined()
    expect(translations.projects).toBeDefined()
    expect(translations.customers).toBeDefined()
    
    // Check for required common translations
    expect(translations.common.actions.button_save).toBe('Save')
    expect(translations.common.actions.button_cancel).toBe('Cancel')
    expect(translations.common.navigation.home).toBe('Home')
  })

  it('should load Spanish translations correctly', () => {
    const translations = loadTranslations(resolve(localesDir, 'es'))
    
    expect(translations).toBeDefined()
    expect(translations.common).toBeDefined()
    expect(translations.projects).toBeDefined()
    expect(translations.customers).toBeDefined()
    
    // Check for required common translations
    expect(translations.common.actions.button_save).toBe('Guardar')
    expect(translations.common.actions.button_cancel).toBe('Cancelar')
    expect(translations.common.navigation.home).toBe('Inicio')
  })

  it('should have matching keys between locales', () => {
    const enTranslations = loadTranslations(resolve(localesDir, 'en'))
    const esTranslations = loadTranslations(resolve(localesDir, 'es'))
    
    // Check that both locales have the same namespaces
    const enNamespaces = Object.keys(enTranslations).sort()
    const esNamespaces = Object.keys(esTranslations).sort()
    
    expect(esNamespaces).toEqual(enNamespaces)
  })

  it('should have no empty translation values', () => {
    const enStats = getTranslationStats(localesDir, 'en')
    const esStats = getTranslationStats(localesDir, 'es')
    
    expect(enStats.emptyValues).toHaveLength(0)
    expect(esStats.emptyValues).toHaveLength(0)
  })

  it('should follow naming conventions', () => {
    const translations = loadTranslations(resolve(localesDir, 'en'))
    
    // Check that all keys follow snake_case convention
    function checkSnakeCase(obj: any, prefix = ''): void {
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key
        
        // Check snake_case pattern
        expect(key).toMatch(/^[a-z][a-z0-9_]*$/), `Key "${fullKey}" should be in snake_case`
        
        if (typeof value === 'object' && value !== null) {
          checkSnakeCase(value, fullKey)
        }
      }
    }
    
    for (const [namespace, namespaceTranslations] of Object.entries(translations)) {
      checkSnakeCase(namespaceTranslations, namespace)
    }
  })
})