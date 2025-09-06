import { ref, reactive, computed, watch, type Ref, type ComputedRef } from 'vue'

export interface ValidationRule {
  validator: (value: any, formData?: any) => boolean | Promise<boolean>
  message: string | ((value: any) => string)
}

export interface FieldValidation {
  required?: boolean | { value: boolean; message?: string }
  minLength?: number | { value: number; message?: string }
  maxLength?: number | { value: number; message?: string }
  pattern?: RegExp | { value: RegExp; message?: string }
  email?: boolean | { value: boolean; message?: string }
  url?: boolean | { value: boolean; message?: string }
  min?: number | { value: number; message?: string }
  max?: number | { value: number; message?: string }
  custom?: ValidationRule | ValidationRule[]
}

export interface FormField<T = any> {
  value: Ref<T>
  errors: Ref<string[]>
  touched: Ref<boolean>
  dirty: Ref<boolean>
  valid: ComputedRef<boolean>
  validate: () => Promise<boolean>
  reset: () => void
  clear: () => void
}

export interface FormValidationOptions {
  validateOn?: 'blur' | 'input' | 'change' | 'submit'
  revalidateOn?: 'blur' | 'input' | 'change'
  clearErrorsOnInput?: boolean
}

export interface FormValidationComposable<T = any> {
  fields: Record<string, FormField>
  errors: ComputedRef<Record<string, string[]>>
  isValid: ComputedRef<boolean>
  isValidating: Ref<boolean>
  isDirty: ComputedRef<boolean>
  isTouched: ComputedRef<boolean>
  validate: () => Promise<boolean>
  validateField: (fieldName: string) => Promise<boolean>
  clearErrors: () => void
  clearFieldErrors: (fieldName: string) => void
  reset: () => void
  setFieldValue: (fieldName: string, value: any) => void
  setFieldError: (fieldName: string, error: string | string[]) => void
  getValues: () => T
}

// Email regex pattern
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// URL regex pattern
const URL_PATTERN = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/

export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  validationRules: Partial<Record<keyof T, FieldValidation>>,
  options: FormValidationOptions = {}
): FormValidationComposable<T> {
  const {
    validateOn = 'blur',
    revalidateOn = 'input',
    clearErrorsOnInput = true
  } = options

  const isValidating = ref(false)
  const fields: Record<string, FormField> = {}

  // Initialize fields
  for (const [fieldName, initialValue] of Object.entries(initialValues)) {
    const fieldRef = ref(initialValue)
    const errorsRef = ref<string[]>([])
    const touchedRef = ref(false)
    const dirtyRef = ref(false)
    
    fields[fieldName] = {
      value: fieldRef,
      errors: errorsRef,
      touched: touchedRef,
      dirty: dirtyRef,
      valid: computed(() => errorsRef.value.length === 0),
      validate: async () => validateField(fieldName),
      reset: () => {
        fieldRef.value = initialValue
        errorsRef.value = []
        touchedRef.value = false
        dirtyRef.value = false
      },
      clear: () => {
        errorsRef.value = []
      }
    }

    // Watch for changes
    watch(fieldRef, (newValue, oldValue) => {
      if (newValue !== initialValue) {
        dirtyRef.value = true
      }
      
      if (clearErrorsOnInput && errorsRef.value.length > 0) {
        errorsRef.value = []
      }
      
      if (touchedRef.value && revalidateOn === 'input') {
        validateField(fieldName)
      }
    })
  }

  // Validate a single field
  const validateField = async (fieldName: string): Promise<boolean> => {
    const field = fields[fieldName]
    if (!field) return true

    const rules = validationRules[fieldName as keyof T]
    if (!rules) return true

    const value = field.value.value
    const errors: string[] = []

    // Required validation
    if (rules.required) {
      const isEmpty = value === null || value === undefined || value === '' || 
                     (Array.isArray(value) && value.length === 0)
      
      if (isEmpty) {
        if (typeof rules.required === 'object' && rules.required.message) {
          errors.push(rules.required.message)
        } else {
          errors.push(`This field is required`)
        }
      }
    }

    // Skip other validations if field is empty and not required
    const isEmpty = value === null || value === undefined || value === ''
    if (isEmpty && !rules.required) {
      field.errors.value = []
      return true
    }

    // MinLength validation
    if (rules.minLength) {
      const minLength = typeof rules.minLength === 'object' ? rules.minLength.value : rules.minLength
      const message = typeof rules.minLength === 'object' && rules.minLength.message
        ? rules.minLength.message
        : `Must be at least ${minLength} characters`
      
      if (String(value).length < minLength) {
        errors.push(message)
      }
    }

    // MaxLength validation
    if (rules.maxLength) {
      const maxLength = typeof rules.maxLength === 'object' ? rules.maxLength.value : rules.maxLength
      const message = typeof rules.maxLength === 'object' && rules.maxLength.message
        ? rules.maxLength.message
        : `Must be no more than ${maxLength} characters`
      
      if (String(value).length > maxLength) {
        errors.push(message)
      }
    }

    // Pattern validation
    if (rules.pattern) {
      const pattern = typeof rules.pattern === 'object' ? rules.pattern.value : rules.pattern
      const message = typeof rules.pattern === 'object' && rules.pattern.message
        ? rules.pattern.message
        : `Invalid format`
      
      if (!pattern.test(String(value))) {
        errors.push(message)
      }
    }

    // Email validation
    if (rules.email) {
      const message = typeof rules.email === 'object' && rules.email.message
        ? rules.email.message
        : `Please enter a valid email address`
      
      if (!EMAIL_PATTERN.test(String(value))) {
        errors.push(message)
      }
    }

    // URL validation
    if (rules.url) {
      const message = typeof rules.url === 'object' && rules.url.message
        ? rules.url.message
        : `Please enter a valid URL`
      
      if (!URL_PATTERN.test(String(value))) {
        errors.push(message)
      }
    }

    // Min validation (numbers)
    if (rules.min !== undefined) {
      const min = typeof rules.min === 'object' ? rules.min.value : rules.min
      const message = typeof rules.min === 'object' && rules.min.message
        ? rules.min.message
        : `Must be at least ${min}`
      
      if (Number(value) < min) {
        errors.push(message)
      }
    }

    // Max validation (numbers)
    if (rules.max !== undefined) {
      const max = typeof rules.max === 'object' ? rules.max.value : rules.max
      const message = typeof rules.max === 'object' && rules.max.message
        ? rules.max.message
        : `Must be no more than ${max}`
      
      if (Number(value) > max) {
        errors.push(message)
      }
    }

    // Custom validations
    if (rules.custom) {
      const customRules = Array.isArray(rules.custom) ? rules.custom : [rules.custom]
      
      for (const rule of customRules) {
        const formData = getValues()
        const isValid = await rule.validator(value, formData)
        
        if (!isValid) {
          const message = typeof rule.message === 'function' 
            ? rule.message(value)
            : rule.message
          errors.push(message)
        }
      }
    }

    field.errors.value = errors
    return errors.length === 0
  }

  // Validate all fields
  const validate = async (): Promise<boolean> => {
    isValidating.value = true
    const results = await Promise.all(
      Object.keys(fields).map(fieldName => validateField(fieldName))
    )
    isValidating.value = false
    
    // Mark all fields as touched
    Object.values(fields).forEach(field => {
      field.touched.value = true
    })
    
    return results.every(result => result)
  }

  // Clear all errors
  const clearErrors = () => {
    Object.values(fields).forEach(field => {
      field.errors.value = []
    })
  }

  // Clear errors for a specific field
  const clearFieldErrors = (fieldName: string) => {
    const field = fields[fieldName]
    if (field) {
      field.errors.value = []
    }
  }

  // Reset form to initial state
  const reset = () => {
    Object.entries(fields).forEach(([fieldName, field]) => {
      field.reset()
    })
  }

  // Set field value programmatically
  const setFieldValue = (fieldName: string, value: any) => {
    const field = fields[fieldName]
    if (field) {
      field.value.value = value
    }
  }

  // Set field error programmatically
  const setFieldError = (fieldName: string, error: string | string[]) => {
    const field = fields[fieldName]
    if (field) {
      field.errors.value = Array.isArray(error) ? error : [error]
    }
  }

  // Get all form values
  const getValues = (): T => {
    const values: any = {}
    Object.entries(fields).forEach(([fieldName, field]) => {
      values[fieldName] = field.value.value
    })
    return values as T
  }

  // Computed properties
  const errors = computed(() => {
    const errorMap: Record<string, string[]> = {}
    Object.entries(fields).forEach(([fieldName, field]) => {
      if (field.errors.value.length > 0) {
        errorMap[fieldName] = field.errors.value
      }
    })
    return errorMap
  })

  const isValid = computed(() => {
    return Object.values(fields).every(field => field.valid.value)
  })

  const isDirty = computed(() => {
    return Object.values(fields).some(field => field.dirty.value)
  })

  const isTouched = computed(() => {
    return Object.values(fields).some(field => field.touched.value)
  })

  return {
    fields,
    errors,
    isValid,
    isValidating,
    isDirty,
    isTouched,
    validate,
    validateField,
    clearErrors,
    clearFieldErrors,
    reset,
    setFieldValue,
    setFieldError,
    getValues
  }
}