# Modal Implementation Patterns

## ✅ RECOMMENDED: Self-Contained Modal with Trigger

The best practice for Nuxt UI Pro is to include the trigger button within the modal component itself:

### Complete Self-Contained Modal:
```vue
<template>
  <!-- Trigger Button -->
  <UButton
    :icon="triggerIcon"
    :color="triggerColor"
    :variant="triggerVariant"
    @click="open"
  >
    {{ triggerText }}
  </UButton>

  <!-- Modal -->
  <UModal
    v-model:open="isOpen"
    :title="title"
    :description="description"
  >
    <template #body>
      <UFormField label="Status" required>
        <USelect v-model="selectedStatus" :items="statusOptions" />
      </UFormField>
    </template>
    
    <template #footer>
      <UButton @click="cancel">Cancel</UButton>
      <UButton 
        :loading="updateMutation.isPending.value"
        @click="updateStatus"
      >
        Update
      </UButton>
    </template>
  </UModal>
</template>

<script setup>
import { useApi } from '~/api'

interface Props {
  projectId: string
  currentStatus: string
  triggerText?: string
  triggerIcon?: string
  triggerVariant?: string
  triggerColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  triggerText: 'Update Status',
  triggerIcon: 'i-lucide-flag',
  triggerVariant: 'outline',
  triggerColor: 'primary'
})

const api = useApi()
const updateMutation = api.projects.updateStatus()

const isOpen = ref(false)
const selectedStatus = ref(props.currentStatus)

const updateStatus = () => {
  updateMutation.mutate({
    id: props.projectId,
    status: selectedStatus.value
  }, {
    onSuccess: () => {
      emit('success', selectedStatus.value)
      isOpen.value = false
    },
    onError: (error) => {
      // Handle error
    }
  })
}
</script>
```

### Usage in Parent:
```vue
<template>
  <!-- Just include the component - trigger is built-in -->
  <MyModal 
    :project-id="projectId"
    :current-status="status"
    trigger-icon="i-lucide-custom-icon"
    @success="handleUpdate"
  />
</template>
```

## UModal Component Structure

When using Nuxt UI's `UModal` component, you MUST use explicit template slots for proper rendering:

### Correct Structure:
```vue
<template>
  <UModal
    v-model="isOpen"
    title="Modal Title"
    description="Modal description"
  >
    <template #body>
      <!-- All modal content goes here -->
      <div class="space-y-4">
        <UFormField label="Field">
          <UInput v-model="value" />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end space-x-2">
        <UButton @click="cancel">Cancel</UButton>
        <UButton @click="submit">Submit</UButton>
      </div>
    </template>
  </UModal>
</template>
```

### ❌ WRONG - Will cause modal to render inline:
```vue
<UModal v-model="isOpen">
  <!-- Missing #body template -->
  <div>Content</div>
</UModal>
```

### ❌ WRONG - USelect won't show options:
```vue
<USelect v-model="value" :options="items" />
```

### ✅ CORRECT - Properly contained modal with working select:
```vue
<UModal v-model:open="isOpen">
  <template #body>
    <USelect v-model="value" :items="items" />
  </template>
</UModal>
```

## Key Points:

1. **Use `v-model:open="isOpen"` for UModal** (not `v-model="isOpen"`)
2. **Use `:items` for USelect** (not `:options`)
3. **Always wrap content in `<template #body>`**
4. **Use `<template #footer>` for action buttons**
5. **Initialize modal state with `const isOpen = ref(false)`**
6. **Include trigger button in modal component for better encapsulation**

## Modal State Management:

```typescript
// Modal state
const isOpen = ref(false)

// Open method
const open = () => {
  isOpen.value = true
  // Reset form state
}

// Cancel/Close method  
const cancel = () => {
  isOpen.value = false
  // Reset form state
}

// Expose to parent
defineExpose({ open })
```

## Usage in Parent Component:

```vue
<template>
  <UButton @click="openModal">Open Modal</UButton>
  
  <MyModal 
    ref="modalRef"
    @success="handleSuccess"
  />
</template>

<script setup>
const modalRef = ref()

const openModal = () => {
  modalRef.value?.open()
}
</script>
```

This pattern ensures modals are properly contained and only appear when explicitly triggered.

## 🚨 Common Pitfalls & Solutions

### Problem: Modal renders inline instead of as overlay
**Cause:** Missing `<template #body>` wrapper
**Solution:** Always wrap content in `<template #body>`

### Problem: Modal appears stuck open on page load  
**Cause:** Using `v-model` instead of `v-model:open`
**Solution:** Use `v-model:open="isOpen"` for proper two-way binding

### Problem: USelect dropdown shows no options
**Cause:** Using `:options` instead of `:items`
**Solution:** Use `:items="optionsArray"` for USelect components

### Problem: API calls don't work or mutations fail
**Cause:** Using wrong API pattern (await, .mutate(), $api, etc.)
**Solution:** Use proper TanStack Query pattern:
```typescript
// ❌ WRONG
const { $api } = useNuxtApp()
await $api.projects.updateStatus.mutate(data)

// ✅ CORRECT  
const api = useApi()
const updateMutation = api.projects.updateStatus()
updateMutation.mutate(data, { onSuccess: () => {}, onError: () => {} })
```

### Problem: Loading state not working on buttons
**Cause:** Missing `.value` when accessing reactive properties
**Solution:** Use `:loading="mutation.isPending.value"` (note the `.value`)

### Problem: Multiple trigger buttons and complex ref management
**Cause:** Separating trigger from modal component
**Solution:** Use self-contained pattern with trigger built into modal component

### Problem: Modal doesn't close after form submission
**Cause:** Missing `isOpen.value = false` in success handler
**Solution:** Always set `isOpen.value = false` after successful operations

## Benefits of Self-Contained Pattern:

1. **Simpler parent components** - No need for refs or modal methods
2. **Better encapsulation** - Modal logic stays within modal component  
3. **Customizable triggers** - Props allow different button styles per usage
4. **Reduced complexity** - No need for `defineExpose` or method management
5. **Consistent behavior** - Modal state is managed internally
