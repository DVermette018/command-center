<template>
  <Teleport to="body">
    <Transition name="dialog-fade">
      <div 
        v-if="open" 
        class="confirmation-dialog-overlay"
        data-testid="confirmation-dialog"
        @click.self="handleCancel"
        @keydown.escape="handleCancel"
        role="dialog"
        :aria-modal="true"
        :aria-labelledby="titleId"
        :aria-describedby="messageId">
        
        <div class="confirmation-dialog" :class="dialogClasses">
          <!-- Icon -->
          <div v-if="icon || variant !== 'default'" class="dialog-icon">
            <component 
              :is="iconComponent" 
              :class="iconClasses"
            />
          </div>

          <!-- Title -->
          <h2 
            :id="titleId" 
            class="dialog-title"
            :class="titleClasses">
            {{ title }}
          </h2>

          <!-- Message -->
          <p 
            :id="messageId" 
            class="dialog-message">
            {{ message }}
          </p>

          <!-- Text Verification for Destructive Actions -->
          <div 
            v-if="requireTextVerification" 
            class="text-verification"
            data-testid="text-verification">
            <label :for="inputId" class="verification-label">
              Type <strong>{{ verificationText }}</strong> to confirm:
            </label>
            <input
              :id="inputId"
              v-model="verificationInput"
              type="text"
              class="verification-input"
              :class="{ 'error': verificationError }"
              @input="verificationError = false"
              @keydown.enter="handleConfirm"
              data-testid="verification-input"
              :aria-invalid="verificationError"
              :aria-describedby="verificationError ? errorId : undefined"
            />
            <span 
              v-if="verificationError" 
              :id="errorId"
              class="verification-error"
              role="alert">
              Text does not match
            </span>
          </div>

          <!-- Actions -->
          <div class="dialog-actions">
            <button
              ref="cancelButton"
              @click="handleCancel"
              class="dialog-button cancel-button"
              data-testid="cancel-button"
              type="button">
              {{ cancelLabel }}
            </button>
            <button
              ref="confirmButton"
              @click="handleConfirm"
              class="dialog-button confirm-button"
              :class="confirmButtonClasses"
              :disabled="isConfirmDisabled"
              data-testid="confirm-button"
              type="button">
              <span v-if="loading" class="button-spinner" aria-hidden="true">
                <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
              <span>{{ confirmLabel }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'

export interface ConfirmationDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'danger' | 'warning' | 'info'
  icon?: string | object
  loading?: boolean
  requireTextVerification?: boolean
  verificationText?: string
  autoFocus?: 'confirm' | 'cancel'
}

const props = withDefaults(defineProps<ConfirmationDialogProps>(), {
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  variant: 'default',
  loading: false,
  requireTextVerification: false,
  verificationText: 'DELETE',
  autoFocus: 'cancel'
})

const emit = defineEmits<{
  confirm: []
  cancel: []
  'update:open': [value: boolean]
}>()

// Refs
const confirmButton = ref<HTMLButtonElement>()
const cancelButton = ref<HTMLButtonElement>()
const verificationInput = ref('')
const verificationError = ref(false)
const previousFocus = ref<HTMLElement | null>(null)

// Generate unique IDs for accessibility
const titleId = `dialog-title-${Math.random().toString(36).substr(2, 9)}`
const messageId = `dialog-message-${Math.random().toString(36).substr(2, 9)}`
const inputId = `dialog-input-${Math.random().toString(36).substr(2, 9)}`
const errorId = `dialog-error-${Math.random().toString(36).substr(2, 9)}`

// Computed
const isConfirmDisabled = computed(() => {
  if (props.loading) return true
  if (props.requireTextVerification) {
    return verificationInput.value !== props.verificationText
  }
  return false
})

const dialogClasses = computed(() => ({
  [`dialog-${props.variant}`]: props.variant !== 'default'
}))

const titleClasses = computed(() => ({
  'text-red-900': props.variant === 'danger',
  'text-yellow-900': props.variant === 'warning',
  'text-blue-900': props.variant === 'info'
}))

const confirmButtonClasses = computed(() => ({
  'confirm-danger': props.variant === 'danger',
  'confirm-warning': props.variant === 'warning',
  'confirm-info': props.variant === 'info',
  'opacity-50 cursor-not-allowed': isConfirmDisabled.value
}))

const iconComponent = computed(() => {
  if (props.icon) return props.icon
  
  // Default icons based on variant
  switch (props.variant) {
    case 'danger':
      return 'div' // Would be an actual icon component
    case 'warning':
      return 'div'
    case 'info':
      return 'div'
    default:
      return null
  }
})

const iconClasses = computed(() => ({
  'text-red-600': props.variant === 'danger',
  'text-yellow-600': props.variant === 'warning',
  'text-blue-600': props.variant === 'info',
  'text-gray-600': props.variant === 'default'
}))

// Methods
const handleConfirm = () => {
  if (props.requireTextVerification && verificationInput.value !== props.verificationText) {
    verificationError.value = true
    return
  }
  
  emit('confirm')
  if (!props.loading) {
    close()
  }
}

const handleCancel = () => {
  emit('cancel')
  close()
}

const close = () => {
  emit('update:open', false)
  verificationInput.value = ''
  verificationError.value = false
  
  // Restore focus to previous element
  if (previousFocus.value) {
    nextTick(() => {
      previousFocus.value?.focus()
      previousFocus.value = null
    })
  }
}

// Focus management
watch(() => props.open, async (isOpen) => {
  if (isOpen) {
    // Store current focus
    previousFocus.value = document.activeElement as HTMLElement
    
    await nextTick()
    
    // Focus appropriate button
    if (props.autoFocus === 'confirm' && !isConfirmDisabled.value) {
      confirmButton.value?.focus()
    } else {
      cancelButton.value?.focus()
    }
    
    // Focus verification input if required
    if (props.requireTextVerification) {
      const input = document.getElementById(inputId)
      input?.focus()
    }
  }
})

// Keyboard event handling
const handleKeydown = (e: KeyboardEvent) => {
  if (!props.open) return
  
  if (e.key === 'Escape') {
    handleCancel()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.confirmation-dialog-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.confirmation-dialog {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  max-width: 28rem;
  width: 100%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.dialog-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

.dialog-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  text-align: center;
}

.dialog-message {
  color: #4b5563;
  text-align: center;
  margin-bottom: 1.5rem;
}

.text-verification {
  margin-bottom: 1.5rem;
}

.verification-label {
  display: block;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  color: #374151;
}

.verification-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.verification-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.verification-input.error {
  border-color: #ef4444;
}

.verification-error {
  display: block;
  color: #ef4444;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.dialog-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.dialog-button {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.15s;
}

.cancel-button {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.cancel-button:hover {
  background: #f9fafb;
}

.cancel-button:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(156, 163, 175, 0.2);
}

.confirm-button {
  background: #3b82f6;
  color: white;
  border: 1px solid transparent;
}

.confirm-button:hover:not(:disabled) {
  background: #2563eb;
}

.confirm-button:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.confirm-danger {
  background: #ef4444;
}

.confirm-danger:hover:not(:disabled) {
  background: #dc2626;
}

.confirm-warning {
  background: #f59e0b;
}

.confirm-warning:hover:not(:disabled) {
  background: #d97706;
}

.button-spinner {
  display: inline-flex;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Transitions */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.2s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

.dialog-fade-enter-active .confirmation-dialog,
.dialog-fade-leave-active .confirmation-dialog {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.dialog-fade-enter-from .confirmation-dialog {
  transform: scale(0.95);
  opacity: 0;
}

.dialog-fade-leave-to .confirmation-dialog {
  transform: scale(0.95);
  opacity: 0;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .confirmation-dialog {
    background: #1f2937;
    color: #f3f4f6;
  }
  
  .dialog-message {
    color: #d1d5db;
  }
  
  .verification-label {
    color: #e5e7eb;
  }
  
  .verification-input {
    background: #374151;
    border-color: #4b5563;
    color: #f3f4f6;
  }
  
  .cancel-button {
    background: #374151;
    color: #f3f4f6;
    border-color: #4b5563;
  }
  
  .cancel-button:hover {
    background: #4b5563;
  }
}
</style>