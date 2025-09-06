<template>
  <div class="form-field" :class="fieldClasses">
    <!-- Label -->
    <label 
      v-if="label"
      :for="inputId"
      class="form-label"
      :class="labelClasses">
      {{ label }}
      <span 
        v-if="required" 
        class="required-indicator"
        data-testid="required-indicator"
        aria-label="required">
        *
      </span>
    </label>
    
    <!-- Helper Text (above input) -->
    <p 
      v-if="helperText && helperPosition === 'top'"
      :id="helperId"
      class="helper-text">
      {{ helperText }}
    </p>
    
    <!-- Input Wrapper -->
    <div class="input-wrapper">
      <!-- Textarea -->
      <textarea
        v-if="type === 'textarea'"
        :id="inputId"
        v-model="internalValue"
        :name="name"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :rows="rows"
        :maxlength="maxlength"
        :aria-invalid="hasError"
        :aria-describedby="ariaDescribedBy"
        :aria-errormessage="hasError ? errorId : undefined"
        @blur="handleBlur"
        @focus="handleFocus"
        @input="handleInput"
        class="form-input"
        :class="inputClasses"
        data-testid="form-input"
      />
      
      <!-- Select -->
      <select
        v-else-if="type === 'select'"
        :id="inputId"
        v-model="internalValue"
        :name="name"
        :disabled="disabled"
        :required="required"
        :aria-invalid="hasError"
        :aria-describedby="ariaDescribedBy"
        :aria-errormessage="hasError ? errorId : undefined"
        @blur="handleBlur"
        @focus="handleFocus"
        @change="handleInput"
        class="form-input"
        :class="inputClasses"
        data-testid="form-input">
        <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
        <option 
          v-for="option in options" 
          :key="option.value"
          :value="option.value">
          {{ option.label }}
        </option>
      </select>
      
      <!-- Regular Input -->
      <input
        v-else
        :id="inputId"
        v-model="internalValue"
        :type="type"
        :name="name"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :min="min"
        :max="max"
        :step="step"
        :maxlength="maxlength"
        :pattern="pattern"
        :autocomplete="autocomplete"
        :aria-invalid="hasError"
        :aria-describedby="ariaDescribedBy"
        :aria-errormessage="hasError ? errorId : undefined"
        @blur="handleBlur"
        @focus="handleFocus"
        @input="handleInput"
        class="form-input"
        :class="inputClasses"
        data-testid="form-input"
      />
      
      <!-- Loading Indicator -->
      <div 
        v-if="loading"
        class="input-loading"
        data-testid="input-loading">
        <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      
      <!-- Success Indicator -->
      <div 
        v-if="showSuccess && !hasError && !loading"
        class="input-success"
        data-testid="input-success">
        <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
        </svg>
      </div>
    </div>
    
    <!-- Helper Text (below input) -->
    <p 
      v-if="helperText && helperPosition === 'bottom'"
      :id="helperId"
      class="helper-text">
      {{ helperText }}
    </p>
    
    <!-- Error Messages -->
    <div 
      v-if="hasError"
      :id="errorId"
      class="error-messages"
      role="alert"
      aria-live="polite"
      data-testid="field-errors">
      <p 
        v-for="(error, index) in displayErrors"
        :key="`error-${index}`"
        class="error-message">
        {{ error }}
      </p>
    </div>
    
    <!-- Character Counter -->
    <div 
      v-if="showCharacterCount && maxlength"
      class="character-count"
      :class="{ 'over-limit': characterCount > maxlength }"
      data-testid="character-count">
      {{ characterCount }}/{{ maxlength }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

export interface SelectOption {
  value: string | number
  label: string
}

export interface FormFieldProps {
  modelValue: string | number | null
  label?: string
  name?: string
  type?: string
  placeholder?: string
  helperText?: string
  helperPosition?: 'top' | 'bottom'
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  loading?: boolean
  errors?: string | string[]
  showSuccess?: boolean
  showCharacterCount?: boolean
  
  // Validation props
  min?: string | number
  max?: string | number
  step?: string | number
  maxlength?: number
  pattern?: string
  autocomplete?: string
  
  // Textarea props
  rows?: number
  
  // Select props
  options?: SelectOption[]
  
  // Validation
  validateOn?: 'blur' | 'input' | 'change'
  validator?: (value: any) => string | string[] | null
}

const props = withDefaults(defineProps<FormFieldProps>(), {
  type: 'text',
  helperPosition: 'bottom',
  required: false,
  disabled: false,
  readonly: false,
  loading: false,
  showSuccess: false,
  showCharacterCount: false,
  rows: 3,
  validateOn: 'blur'
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number | null]
  'blur': [event: FocusEvent]
  'focus': [event: FocusEvent]
  'validate': [errors: string[]]
}>()

// Internal state
const internalValue = ref(props.modelValue)
const touched = ref(false)
const focused = ref(false)
const internalErrors = ref<string[]>([])

// Generate unique IDs
const inputId = `field-${Math.random().toString(36).substr(2, 9)}`
const helperId = `helper-${Math.random().toString(36).substr(2, 9)}`
const errorId = `error-${Math.random().toString(36).substr(2, 9)}`

// Computed
const hasError = computed(() => {
  return displayErrors.value.length > 0
})

const displayErrors = computed(() => {
  const errors = props.errors
  if (!errors) return internalErrors.value
  
  if (typeof errors === 'string') {
    return [errors]
  }
  return errors
})

const characterCount = computed(() => {
  const value = String(internalValue.value || '')
  return value.length
})

const ariaDescribedBy = computed(() => {
  const ids = []
  if (props.helperText) ids.push(helperId)
  if (hasError.value) ids.push(errorId)
  return ids.length > 0 ? ids.join(' ') : undefined
})

const fieldClasses = computed(() => ({
  'field-disabled': props.disabled,
  'field-readonly': props.readonly,
  'field-error': hasError.value,
  'field-success': props.showSuccess && !hasError.value && !props.loading,
  'field-loading': props.loading,
  'field-focused': focused.value
}))

const labelClasses = computed(() => ({
  'label-disabled': props.disabled,
  'label-error': hasError.value
}))

const inputClasses = computed(() => ({
  'input-error': hasError.value,
  'input-success': props.showSuccess && !hasError.value && !props.loading,
  'input-disabled': props.disabled,
  'input-readonly': props.readonly
}))

// Methods
const validate = () => {
  if (!props.validator) return
  
  const result = props.validator(internalValue.value)
  if (result === null) {
    internalErrors.value = []
  } else if (typeof result === 'string') {
    internalErrors.value = [result]
  } else {
    internalErrors.value = result
  }
  
  emit('validate', internalErrors.value)
}

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  internalValue.value = target.value
  emit('update:modelValue', internalValue.value)
  
  if (props.validateOn === 'input') {
    validate()
  }
}

const handleBlur = (event: FocusEvent) => {
  touched.value = true
  focused.value = false
  emit('blur', event)
  
  if (props.validateOn === 'blur') {
    validate()
  }
}

const handleFocus = (event: FocusEvent) => {
  focused.value = true
  emit('focus', event)
}

// Watch for external value changes
watch(() => props.modelValue, (newValue) => {
  internalValue.value = newValue
})

// Watch for validation trigger
watch(() => internalValue.value, () => {
  if (props.validateOn === 'change' && touched.value) {
    validate()
  }
})

// Initial validation if needed
onMounted(() => {
  if (props.validator && props.modelValue) {
    validate()
  }
})
</script>

<style scoped>
.form-field {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.required-indicator {
  color: #ef4444;
  margin-left: 0.25rem;
}

.input-wrapper {
  position: relative;
}

.form-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: all 0.15s;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input.input-error {
  border-color: #ef4444;
  padding-right: 2.5rem;
}

.form-input.input-error:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.form-input.input-success {
  border-color: #10b981;
  padding-right: 2.5rem;
}

.form-input.input-disabled {
  background-color: #f9fafb;
  cursor: not-allowed;
}

.form-input.input-readonly {
  background-color: #f9fafb;
}

select.form-input {
  padding-right: 2rem;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  appearance: none;
}

textarea.form-input {
  resize: vertical;
  min-height: 5rem;
}

.helper-text {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
}

.error-messages {
  margin-top: 0.25rem;
}

.error-message {
  font-size: 0.75rem;
  color: #ef4444;
  margin-top: 0.125rem;
}

.character-count {
  font-size: 0.75rem;
  color: #6b7280;
  text-align: right;
  margin-top: 0.25rem;
}

.character-count.over-limit {
  color: #ef4444;
}

.input-loading,
.input-success {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

.input-loading {
  color: #6b7280;
}

.input-success {
  color: #10b981;
}

@keyframes spin {
  from { transform: translateY(-50%) rotate(0deg); }
  to { transform: translateY(-50%) rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .form-label {
    color: #e5e7eb;
  }
  
  .form-input {
    background-color: #374151;
    border-color: #4b5563;
    color: #f3f4f6;
  }
  
  .form-input:focus {
    border-color: #3b82f6;
  }
  
  .form-input.input-disabled,
  .form-input.input-readonly {
    background-color: #1f2937;
  }
  
  .helper-text {
    color: #9ca3af;
  }
  
  .character-count {
    color: #9ca3af;
  }
}
</style>