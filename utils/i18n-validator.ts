/**
 * Translation validation utilities
 * Ensures translation keys consistency across locales
 */

import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface TranslationStats {
  totalKeys: number
  missingKeys: string[]
  extraKeys: string[]
  emptyValues: string[]
}

/**
 * Get all translation keys from a nested object
 */
function extractKeys(obj: any, prefix = ''): string[] {
  const keys: string[] = []
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    
    if (typeof value === 'object' && value !== null) {
      keys.push(...extractKeys(value, fullKey))
    } else {
      keys.push(fullKey)
    }
  }
  
  return keys
}

/**
 * Load translation files from a locale directory
 */
export function loadTranslations(localePath: string): Record<string, any> {
  const translations: Record<string, any> = {}
  
  try {
    const files = readdirSync(localePath).filter(file => file.endsWith('.json'))
    
    for (const file of files) {
      const filePath = join(localePath, file)
      const content = readFileSync(filePath, 'utf-8')
      const namespace = file.replace('.json', '')
      translations[namespace] = JSON.parse(content)
    }
  } catch (error) {
    console.error(`Error loading translations from ${localePath}:`, error)
  }
  
  return translations
}

/**
 * Validate translation consistency between locales
 */
export function validateTranslations(localesDir: string): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  try {
    const locales = readdirSync(localesDir).filter(dir => 
      readdirSync(join(localesDir, dir)).some(file => file.endsWith('.json'))
    )
    
    if (locales.length === 0) {
      errors.push('No translation files found')
      return { valid: false, errors, warnings }
    }
    
    // Load all translations
    const allTranslations: Record<string, Record<string, any>> = {}
    for (const locale of locales) {
      allTranslations[locale] = loadTranslations(join(localesDir, locale))
    }
    
    // Get keys from the first locale as reference
    const [referenceLocale] = locales
    const referenceKeys = new Set<string>()
    
    for (const [namespace, translations] of Object.entries(allTranslations[referenceLocale])) {
      const keys = extractKeys(translations, namespace)
      keys.forEach(key => referenceKeys.add(key))
    }
    
    // Validate each locale against reference
    for (const locale of locales.slice(1)) {
      const localeKeys = new Set<string>()
      
      for (const [namespace, translations] of Object.entries(allTranslations[locale])) {
        const keys = extractKeys(translations, namespace)
        keys.forEach(key => localeKeys.add(key))
      }
      
      // Check for missing keys
      for (const key of referenceKeys) {
        if (!localeKeys.has(key)) {
          errors.push(`Missing key in ${locale}: ${key}`)
        }
      }
      
      // Check for extra keys
      for (const key of localeKeys) {
        if (!referenceKeys.has(key)) {
          warnings.push(`Extra key in ${locale}: ${key}`)
        }
      }
    }
    
    // Check for empty values
    for (const [locale, translations] of Object.entries(allTranslations)) {
      if (translations) {
        for (const [namespace, namespaceTranslations] of Object.entries(translations)) {
          if (namespaceTranslations) {
            checkEmptyValues(namespaceTranslations, namespace, locale, warnings)
          }
        }
      }
    }
    
  } catch (error) {
    errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Check for empty translation values
 */
function checkEmptyValues(obj: any, prefix: string, locale: string, warnings: string[]): void {
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = `${prefix}.${key}`
    
    if (typeof value === 'object' && value !== null) {
      checkEmptyValues(value, fullKey, locale, warnings)
    } else if (typeof value === 'string' && value.trim() === '') {
      warnings.push(`Empty value in ${locale}: ${fullKey}`)
    }
  }
}

/**
 * Get translation statistics for a locale
 */
export function getTranslationStats(localesDir: string, locale: string): TranslationStats {
  const translations = loadTranslations(join(localesDir, locale))
  const keys: string[] = []
  const emptyValues: string[] = []
  
  for (const [namespace, namespaceTranslations] of Object.entries(translations)) {
    const namespaceKeys = extractKeys(namespaceTranslations, namespace)
    keys.push(...namespaceKeys)
    
    // Check for empty values
    for (const key of namespaceKeys) {
      const value = getNestedValue(translations, key)
      if (typeof value === 'string' && value.trim() === '') {
        emptyValues.push(key)
      }
    }
  }
  
  return {
    totalKeys: keys.length,
    missingKeys: [],
    extraKeys: [],
    emptyValues
  }
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

/**
 * CLI command to validate translations
 */
export function runValidation(localesDir: string): void {
  console.log('🔍 Validating translations...\n')
  
  const result = validateTranslations(localesDir)
  
  if (result.valid) {
    console.log('✅ All translations are valid!')
  } else {
    console.log('❌ Translation validation failed:')
    result.errors.forEach(error => console.log(`  • ${error}`))
  }
  
  if (result.warnings.length > 0) {
    console.log('\n⚠️  Warnings:')
    result.warnings.forEach(warning => console.log(`  • ${warning}`))
  }
  
  console.log('\n📊 Statistics:')
  const locales = readdirSync(localesDir).filter(dir => 
    readdirSync(join(localesDir, dir)).some(file => file.endsWith('.json'))
  )
  
  for (const locale of locales) {
    const stats = getTranslationStats(localesDir, locale)
    console.log(`  ${locale}: ${stats.totalKeys} keys, ${stats.emptyValues.length} empty values`)
  }
}