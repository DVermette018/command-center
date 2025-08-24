<template>
  <UModal
    v-model:open="isOpen"
    :description="`Change project status from ${currentStatus} to ${selectedStatus}`"
    :title="`Update Project Status`"
  >
    <div class="flex flex-col space-y-4">
      <!-- Status Selection -->
      <UFormField
        label="New Status"
        name="status" 
        required
      >
        <USelect
          v-model="selectedStatus"
          :options="statusOptions"
          placeholder="Select new status"
          class="w-full"
        />
      </UFormField>

      <!-- Reason (optional for most, required for certain transitions) -->
      <UFormField
        :label="reasonRequired ? 'Reason (Required)' : 'Reason (Optional)'"
        name="reason"
        :required="reasonRequired"
      >
        <UTextarea
          v-model="reason"
          :placeholder="reasonRequired ? 'Please provide a reason for this status change' : 'Optional: Provide context for this change'"
          rows="3"
        />
      </UFormField>

      <!-- Status Preview -->
      <div class="p-4 bg-gray-50 rounded-lg">
        <h4 class="text-sm font-medium mb-2">Status Change Preview:</h4>
        <div class="flex items-center space-x-2">
          <UBadge :color="getStatusColor(currentStatus)" :variant="'solid'">
            {{ getStatusLabel(currentStatus) }}
          </UBadge>
          <Icon name="i-lucide-arrow-right" class="h-4 w-4 text-gray-400" />
          <UBadge :color="getStatusColor(selectedStatus)" :variant="'solid'">
            {{ getStatusLabel(selectedStatus) }}
          </UBadge>
        </div>
        <p class="text-sm text-gray-600 mt-2" v-if="getStatusDescription(selectedStatus)">
          {{ getStatusDescription(selectedStatus) }}
        </p>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end space-x-2">
        <UButton
          color="neutral"
          variant="subtle"
          @click="cancel"
        >
          Cancel
        </UButton>
        <UButton
          :loading="isUpdating"
          :disabled="!selectedStatus || (reasonRequired && !reason.trim())"
          @click="updateStatus"
        >
          Update Status
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script lang="ts" setup>
import type { ProjectStatus } from '~~/types/project'

interface Props {
  projectId: string
  currentStatus: ProjectStatus
}

interface Emits {
  success: [newStatus: ProjectStatus]
  error: [error: string]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { $api } = useNuxtApp()
const toast = useToast()

// Modal state
const isOpen = ref(false)
const selectedStatus = ref<ProjectStatus>(props.currentStatus)
const reason = ref('')
const isUpdating = ref(false)

// Status options with proper labels and colors
const statusOptions = [
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Pending Approval', value: 'PENDING_APPROVAL' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'On Hold', value: 'ON_HOLD' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
  { label: 'Archived', value: 'ARCHIVED' }
]

// Status metadata
const statusMeta = {
  DRAFT: { color: 'gray', label: 'Draft', description: 'Project is in draft stage' },
  PENDING_APPROVAL: { color: 'yellow', label: 'Pending Approval', description: 'Waiting for client approval' },
  ACTIVE: { color: 'green', label: 'Active', description: 'Project is actively being worked on' },
  ON_HOLD: { color: 'orange', label: 'On Hold', description: 'Project is temporarily paused' },
  COMPLETED: { color: 'blue', label: 'Completed', description: 'Project has been completed' },
  CANCELLED: { color: 'red', label: 'Cancelled', description: 'Project has been cancelled' },
  ARCHIVED: { color: 'gray', label: 'Archived', description: 'Project has been archived' }
}

// Computed properties
const reasonRequired = computed(() => {
  // Require reason for certain status changes
  return ['CANCELLED', 'ON_HOLD', 'ARCHIVED'].includes(selectedStatus.value) ||
         (props.currentStatus === 'ACTIVE' && selectedStatus.value !== 'COMPLETED')
})

// Helper functions
const getStatusColor = (status: ProjectStatus) => statusMeta[status]?.color || 'gray'
const getStatusLabel = (status: ProjectStatus) => statusMeta[status]?.label || status
const getStatusDescription = (status: ProjectStatus) => statusMeta[status]?.description || ''

// Methods
const open = () => {
  isOpen.value = true
  selectedStatus.value = props.currentStatus
  reason.value = ''
}

const cancel = () => {
  isOpen.value = false
  selectedStatus.value = props.currentStatus
  reason.value = ''
}

const updateStatus = async () => {
  if (!selectedStatus.value || (reasonRequired.value && !reason.value.trim())) {
    return
  }

  isUpdating.value = true

  try {
    await $api.projects.updateStatus.mutate({
      id: props.projectId,
      status: selectedStatus.value,
      reason: reason.value.trim() || undefined
    })

    emit('success', selectedStatus.value)
    
    toast.add({
      title: 'Status Updated',
      description: `Project status changed to ${getStatusLabel(selectedStatus.value)}`,
      color: 'success',
      icon: 'i-lucide-check'
    })

    isOpen.value = false
  } catch (error) {
    console.error('Failed to update project status:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to update project status'
    emit('error', errorMessage)
    
    toast.add({
      title: 'Update Failed',
      description: errorMessage,
      color: 'error',
      icon: 'i-lucide-x'
    })
  } finally {
    isUpdating.value = false
  }
}

// Expose methods to parent
defineExpose({
  open
})
</script>