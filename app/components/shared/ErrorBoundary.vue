<script setup lang="ts">
import { ref, onErrorCaptured, nextTick, watch, onMounted } from 'vue'

interface ErrorBoundaryProps {
  fallbackMessage?: string
  onError?: (error: Error, errorInfo: any) => void
}

const props = withDefaults(defineProps<ErrorBoundaryProps>(), {
  fallbackMessage: 'Something went wrong'
})

const emits = defineEmits<{
  error: [error: Error]
}>()

// Error state
const hasError = ref(false)
const error = ref<Error | null>(null)
const retryButton = ref<HTMLButtonElement>()

// Error capture
onErrorCaptured((err: Error, instance, info) => {
  hasError.value = true
  error.value = err
  
  // Log error to console in development
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
    console.error('ErrorBoundary caught error:', err)
    console.error('Component info:', info)
  }
  
  // Emit error event
  emits('error', err)
  
  // Call custom error handler
  if (props.onError) {
    props.onError(err, { instance, info })
  }
  
  // Focus retry button for accessibility
  nextTick(() => {
    if (retryButton.value) {
      retryButton.value.focus()
    }
  })
  
  return false // Prevent error from propagating
})

// Retry functionality
const retry = () => {
  hasError.value = false
  error.value = null
}

// Cleanup on unmount
onMounted(() => {
  return () => {
    error.value = null
    hasError.value = false
  }
})

// Expose methods for testing
defineExpose({
  hasError,
  error,
  retry
})
</script>

<template>
  <div>
    <!-- Error UI -->
    <div
      v-if="hasError"
      data-testid="error-boundary"
      role="alert"
      aria-live="assertive"
      class="flex flex-col items-center justify-center p-8 text-center bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800"
    >
      <!-- Error slot with fallback -->
      <slot 
        name="error" 
        :error="error" 
        :retry="retry"
      >
        <!-- Default error UI -->
        <div class="flex flex-col items-center space-y-4">
          <!-- Error icon -->
          <div class="flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full">
            <UIcon
              name="i-lucide-alert-circle"
              class="w-8 h-8 text-red-600 dark:text-red-400"
            />
          </div>
          
          <!-- Error message -->
          <div class="space-y-2">
            <h3 class="text-lg font-semibold text-red-800 dark:text-red-200">
              {{ fallbackMessage }}
            </h3>
            
            <p 
              v-if="error?.message && typeof process !== 'undefined' && process.env?.NODE_ENV === 'development'"
              class="text-sm text-red-600 dark:text-red-400 max-w-md"
            >
              {{ error.message }}
            </p>
          </div>
          
          <!-- Actions -->
          <div class="flex flex-col sm:flex-row gap-3">
            <UButton
              ref="retryButton"
              data-testid="retry-button"
              color="red"
              variant="solid"
              icon="i-lucide-refresh-cw"
              label="Try Again"
              @click="retry"
            />
            
            <UButton
              color="red"
              variant="ghost"
              label="Report Issue"
              @click="() => {
                // Could integrate with error reporting service
                if (typeof window !== 'undefined') {
                  console.warn('Error reporting not configured')
                }
              }"
            />
          </div>
        </div>
      </slot>
    </div>
    
    <!-- Normal content -->
    <div v-else>
      <slot />
    </div>
  </div>
</template>

<style scoped>
/* Add any additional styling if needed */
</style>