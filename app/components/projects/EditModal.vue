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
    title="Edit Project"
    description="Update project information and settings"
    class="max-w-2xl"
  >
    <template #body>
    <UForm
      id="edit-project-form"
      :schema="updateProjectSchema"
      :state="state"
      @submit="onSubmit"
      @error="onError"
    >
      <div class="space-y-6">
        <!-- Basic Information -->
        <div class="space-y-4">
          <h3 class="text-lg font-medium">Basic Information</h3>
          
          <UFormField
            label="Project Name"
            name="name"
            required
          >
            <UInput
              v-model="state.name"
              placeholder="Enter project name"
            />
          </UFormField>

          <UFormField
            label="Description"
            name="description"
          >
            <UTextarea
              v-model="state.description"
              placeholder="Describe the project"
              :rows="3"
            />
          </UFormField>

          <UFormField
            label="Project Type"
            name="type"
          >
            <USelect
              v-model="state.type"
              :items="projectTypeOptions"
              placeholder="Select project type"
            />
          </UFormField>

          <UFormField
            label="Priority"
            name="priority"
          >
            <USelect
              v-model="state.priority"
              :items="priorityOptions"
              placeholder="Select priority"
            />
          </UFormField>
        </div>

        <!-- Timeline -->
        <div class="space-y-4">
          <h3 class="text-lg font-medium">Timeline</h3>
          
          <UFormField
            label="Start Date"
            name="startDate"
          >
            <DatePicker 
              v-model="startDateCalendar"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Target End Date"
            name="targetEndDate"
            :error="!validateDates ? 'Target date must be after start date' : undefined"
          >
            <DatePicker 
              v-model="targetEndDateCalendar"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Actual End Date"
            name="actualEndDate"
          >
            <DatePicker 
              v-model="actualEndDateCalendar"
              class="w-full"
            />
          </UFormField>
        </div>

        <!-- Budget -->
        <div class="space-y-4">
          <h3 class="text-lg font-medium">Budget</h3>
          
          <div class="grid grid-cols-2 gap-4">
            <UFormField
              label="Budget Amount"
              name="budget"
            >
              <UInput
                v-model.number="state.budget"
                type="number"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </UFormField>

            <UFormField
              label="Currency"
              name="currency"
            >
              <USelect
                v-model="state.currency"
                :items="currencyOptions"
                placeholder="Select currency"
              />
            </UFormField>
          </div>
        </div>
      </div>
    </UForm>
    </template>

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
          :loading="updateProjectMutation.isPending.value"
          form="edit-project-form"
          type="submit"
        >
          Save Changes
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script lang="ts" setup>
import type { FormSubmitEvent } from '@nuxt/ui'
import { CalendarDate } from '@internationalized/date'
import { updateProjectSchema, type UpdateProjectDTO, type ProjectDTO } from '~~/dto/project'
import DatePicker from '~/components/shared/DatePicker.vue'
import { useApi } from '~/api'

interface Props {
  project: ProjectDTO
  triggerText?: string
  triggerIcon?: string
  triggerVariant?: string
  triggerColor?: string
}

interface Emits {
  success: []
}

const props = withDefaults(defineProps<Props>(), {
  triggerText: 'Edit Project',
  triggerIcon: 'i-lucide-pencil',
  triggerVariant: 'outline',
  triggerColor: 'neutral'
})
const emit = defineEmits<Emits>()

const api = useApi()
const toast = useToast()

// Use the mutation hook for updating projects
const updateProjectMutation = api.projects.useUpdateMutation()

// Modal state
const isOpen = ref(false)

// Form state
const state = reactive<Partial<UpdateProjectDTO>>({
  id: props.project.id,
  name: '',
  description: '',
  type: 'WEBSITE',
  priority: 'MEDIUM',
  startDate: undefined,
  targetEndDate: undefined,
  actualEndDate: undefined,
  budget: undefined,
  currency: 'USD'
})

// Calendar date computeds
const startDateCalendar = computed({
  get: () => {
    if (!state.startDate) return null
    const date = state.startDate instanceof Date ? state.startDate : new Date(state.startDate)
    return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
  },
  set: (value) => {
    if (value) {
      state.startDate = new Date(value.year, value.month - 1, value.day)
    } else {
      state.startDate = undefined
    }
  }
})

const targetEndDateCalendar = computed({
  get: () => {
    if (!state.targetEndDate) return null
    const date = state.targetEndDate instanceof Date ? state.targetEndDate : new Date(state.targetEndDate)
    return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
  },
  set: (value) => {
    if (value) {
      state.targetEndDate = new Date(value.year, value.month - 1, value.day)
    } else {
      state.targetEndDate = undefined
    }
  }
})

const actualEndDateCalendar = computed({
  get: () => {
    if (!state.actualEndDate) return null
    const date = state.actualEndDate instanceof Date ? state.actualEndDate : new Date(state.actualEndDate)
    return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
  },
  set: (value) => {
    if (value) {
      state.actualEndDate = new Date(value.year, value.month - 1, value.day)
    } else {
      state.actualEndDate = undefined
    }
  }
})

// Options
const projectTypeOptions = [
  { label: 'Website', value: 'WEBSITE' },
  { label: 'Branding', value: 'BRANDING' },
  { label: 'Consulting', value: 'CONSULTING' },
  { label: 'Development', value: 'DEVELOPMENT' },
  { label: 'Marketing', value: 'MARKETING' },
  { label: 'Other', value: 'OTHER' }
]

const priorityOptions = [
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
  { label: 'Critical', value: 'CRITICAL' }
]

const currencyOptions = [
  { label: 'USD - US Dollar', value: 'USD' },
  { label: 'MXN - Mexican Peso', value: 'MXN' },
  { label: 'EUR - Euro', value: 'EUR' },
  { label: 'CAD - Canadian Dollar', value: 'CAD' }
]

// Validation
const validateDates = computed(() => {
  if (state.startDate && state.targetEndDate) {
    return state.startDate <= state.targetEndDate
  }
  return true
})

// Methods
const open = () => {
  isOpen.value = true
  populateForm()
}

const cancel = () => {
  isOpen.value = false
  resetForm()
}

const populateForm = () => {
  state.id = props.project.id
  state.name = props.project.name
  state.description = props.project.description || ''
  state.type = props.project.type
  state.priority = props.project.priority
  state.startDate = props.project.startDate ? new Date(props.project.startDate) : undefined
  state.targetEndDate = props.project.targetEndDate ? new Date(props.project.targetEndDate) : undefined
  state.actualEndDate = props.project.actualEndDate ? new Date(props.project.actualEndDate) : undefined
  state.budget = props.project.budget
  state.currency = props.project.currency || 'USD'
}

const resetForm = () => {
  state.name = ''
  state.description = ''
  state.type = 'WEBSITE'
  state.priority = 'MEDIUM'
  state.startDate = undefined
  state.targetEndDate = undefined
  state.actualEndDate = undefined
  state.budget = undefined
  state.currency = 'USD'
}

const onError = (error: any) => {
  console.error('Form validation error:', error)
  toast.add({
    title: 'Validation Error',
    description: 'Please check the form fields and try again',
    color: 'error',
    icon: 'i-lucide-x'
  })
}

const onSubmit = (event: FormSubmitEvent<UpdateProjectDTO>) => {
  if (!validateDates.value) {
    toast.add({
      title: 'Invalid Dates',
      description: 'Target end date must be after start date',
      color: 'error',
      icon: 'i-lucide-calendar-x'
    })
    return
  }

  updateProjectMutation.mutate(event.data, {
    onSuccess: () => {
      emit('success')
      
      toast.add({
        title: 'Project Updated',
        description: 'Project information has been updated successfully',
        color: 'success',
        icon: 'i-lucide-check'
      })

      isOpen.value = false
    },
    onError: (error: any) => {
      console.error('Failed to update project:', error)
      
      toast.add({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update project',
        color: 'error',
        icon: 'i-lucide-x'
      })
    }
  })
}

// No need to expose methods - button is included in component
</script>