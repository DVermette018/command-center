<template>
  <div 
    v-if="hasErrors"
    class="form-errors"
    :class="variantClasses"
    role="alert"
    aria-live="polite"
    data-testid="form-errors">
    
    <!-- Title -->
    <div v-if="title" class="errors-title">
      <svg 
        class="error-icon" 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 20 20" 
        fill="currentColor">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      {{ title }}
    </div>
    
    <!-- Error List -->
    <ul 
      class="errors-list"
      :class="{ 'mt-2': title }">
      <li 
        v-for="(error, index) in displayErrors"
        :key="`error-${index}`"
        class="error-item">
        <span v-if="showFieldName && error.field" class="error-field">
          {{ error.field }}:
        </span>
        {{ error.message || error }}
      </li>
    </ul>
    
    <!-- Dismiss Button -->
    <button
      v-if="dismissible"
      @click="handleDismiss"
      class="dismiss-button"
      type="button"
      aria-label="Dismiss errors"
      data-testid="dismiss-button">
      <svg 
        class="dismiss-icon" 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 20 20" 
        fill="currentColor">
        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface FormError {
  field?: string
  message: string
}

export interface FormErrorsProps {
  errors?: string | string[] | FormError[] | Record<string, string | string[]>
  title?: string
  variant?: 'inline' | 'block' | 'toast'
  showFieldName?: boolean
  dismissible?: boolean
}

const props = withDefaults(defineProps<FormErrorsProps>(), {
  variant: 'block',
  showFieldName: true,
  dismissible: false
})

const emit = defineEmits<{
  dismiss: []
}>()

// Computed
const displayErrors = computed(() => {
  if (!props.errors) return []
  
  // Handle string
  if (typeof props.errors === 'string') {
    return [{ message: props.errors }]
  }
  
  // Handle array of strings
  if (Array.isArray(props.errors)) {
    // Check if it's an array of FormError objects
    if (props.errors.length > 0 && typeof props.errors[0] === 'object') {
      return props.errors as FormError[]
    }
    // Array of strings
    return props.errors.map(error => ({ message: String(error) }))
  }
  
  // Handle object (field -> error mapping)
  if (typeof props.errors === 'object') {
    const errorList: FormError[] = []
    for (const [field, messages] of Object.entries(props.errors)) {
      if (Array.isArray(messages)) {
        messages.forEach(message => {
          errorList.push({ field, message })
        })
      } else {
        errorList.push({ field, message: String(messages) })
      }
    }
    return errorList
  }
  
  return []
})

const hasErrors = computed(() => {
  return displayErrors.value.length > 0
})

const variantClasses = computed(() => ({
  'errors-inline': props.variant === 'inline',
  'errors-block': props.variant === 'block',
  'errors-toast': props.variant === 'toast'
}))

// Methods
const handleDismiss = () => {
  emit('dismiss')
}
</script>

<style scoped>
.form-errors {
  position: relative;
  border-radius: 0.375rem;
  padding: 0.75rem 1rem;
}

/* Block variant (default) */
.errors-block {
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

/* Inline variant */
.errors-inline {
  background-color: transparent;
  border: none;
  color: #ef4444;
  padding: 0;
  margin-top: 0.25rem;
}

/* Toast variant */
.errors-toast {
  background-color: #ef4444;
  color: white;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  position: fixed;
  top: 1rem;
  right: 1rem;
  max-width: 24rem;
  z-index: 50;
  animation: slide-in 0.3s ease-out;
}

@keyframes slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.errors-title {
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.error-icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.errors-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.errors-inline .errors-list {
  font-size: 0.75rem;
}

.error-item {
  margin-top: 0.25rem;
  font-size: 0.875rem;
}

.errors-inline .error-item {
  margin-top: 0.125rem;
}

.error-item:first-child {
  margin-top: 0;
}

.error-field {
  font-weight: 500;
}

.dismiss-button {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  padding: 0.25rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: inherit;
  opacity: 0.7;
  transition: opacity 0.15s;
}

.dismiss-button:hover {
  opacity: 1;
}

.dismiss-icon {
  width: 1rem;
  height: 1rem;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .errors-block {
    background-color: #7f1d1d;
    border-color: #991b1b;
    color: #fecaca;
  }
  
  .errors-inline {
    color: #f87171;
  }
}
</style>