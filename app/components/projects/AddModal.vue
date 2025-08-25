<script lang="ts" setup>
import type { FormSubmitEvent } from '@nuxt/ui'
import { type CreateProjectDTO, createProjectSchema } from '~~/dto/project'
import type { SelectOption } from '~~/types/common'
import DatePicker from '~/components/shared/DatePicker.vue'
import { useApi } from '~/api'
import type { ListUserDTO } from '~~/dto/user'
import { CalendarDate } from '@internationalized/date'

const props = defineProps<{
  customerId: string
}>()

const api = useApi()
const toast = useToast()

const open = ref(false)

// Use the mutation hook for creating projects
const createProjectMutation = api.projects.create()

// Form state matching the Project model
const state = reactive<CreateProjectDTO>({
  customerId: props.customerId,
  name: '',
  type: 'WEBSITE',
  startDate: new Date(),
  targetEndDate: undefined,
  projectManagerId: ''
})

// Calendar date conversion for DatePicker components
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

const projectManagers = ref<SelectOption[]>([])

// Use query hook for loading users
const { data: usersData, error: usersError } = api.users.getAllByRoles({ 
  pageIndex: 1, 
  pageSize: 100, 
  roles: ['PROJECT_MANAGER', 'DEVELOPER', 'DESIGNER'] 
})

// Watch for data changes and update projectManagers
watch(usersData, (data) => {
  if (data?.data) {
    projectManagers.value = data.data.map((u: ListUserDTO) => ({ 
      label: `${u.firstName} ${u.lastName}`, 
      value: u.id 
    }))
  }
}, { immediate: true })

// Watch for errors
watch(usersError, (error) => {
  if (error) {
    toast.add({
      title: 'Error',
      description: 'No se pudieron cargar los usuarios',
      color: 'error',
      icon: 'i-lucide-x'
    })
  }
})

// Options
const projectTypeOptions = [
  { label: 'Sitio Web', value: 'WEBSITE' },
  { label: 'Branding', value: 'BRANDING' },
  { label: 'Consultoría', value: 'CONSULTING' },
  { label: 'Desarrollo', value: 'DEVELOPMENT' },
  { label: 'Marketing', value: 'MARKETING' },
  { label: 'Otro', value: 'OTHER' }
]

const projectStatusOptions = [
  { label: 'Borrador', value: 'DRAFT' },
  { label: 'Pendiente de Aprobación', value: 'PENDING_APPROVAL' },
  { label: 'Activo', value: 'ACTIVE' },
  { label: 'En Pausa', value: 'ON_HOLD' },
  { label: 'Completado', value: 'COMPLETED' },
  { label: 'Cancelado', value: 'CANCELLED' },
  { label: 'Archivado', value: 'ARCHIVED' }
]

const projectPhaseOptions = [
  { label: 'Descubrimiento', value: 'DISCOVERY' },
  { label: 'Planificación', value: 'PLANNING' },
  { label: 'Diseño', value: 'DESIGN' },
  { label: 'Desarrollo', value: 'DEVELOPMENT' },
  { label: 'Revisión', value: 'REVIEW' },
  { label: 'Pruebas', value: 'TESTING' },
  { label: 'Lanzamiento', value: 'LAUNCH' },
  { label: 'Post-Lanzamiento', value: 'POST_LAUNCH' },
  { label: 'Mantenimiento', value: 'MAINTENANCE' }
]

const priorityOptions = [
  { label: 'Baja', value: 'LOW', icon: 'i-lucide-arrow-down' },
  { label: 'Media', value: 'MEDIUM', icon: 'i-lucide-minus' },
  { label: 'Alta', value: 'HIGH', icon: 'i-lucide-arrow-up' },
  { label: 'Crítica', value: 'CRITICAL', icon: 'i-lucide-alert-circle' }
]

const currencyOptions = [
  { label: 'USD - Dólares', value: 'USD' },
  { label: 'MXN - Pesos Mexicanos', value: 'MXN' },
  { label: 'EUR - Euros', value: 'EUR' },
  { label: 'CAD - Dólares Canadienses', value: 'CAD' }
]

// Date validation
const validateDates = computed(() => {
  if (state.startDate && state.targetEndDate) {
    return state.startDate <= state.targetEndDate
  }
  return true
})

// Error handler
const onError = (error: any): void => {
  console.error('Form validation error:', error)
  toast.add({
    title: 'Error de validación',
    description: 'Por favor, corrija los errores en el formulario',
    color: 'error',
    icon: 'i-lucide-x'
  })
}

// Submit handler
const onSubmit = async (event: FormSubmitEvent<CreateProjectDTO>): Promise<void> => {
  console.log('Form submitted with data:', event.data)
  
  createProjectMutation.mutate({
    customerId: event.data.customerId,
    name: event.data.name,
    type: event.data.type,
    startDate: event.data.startDate,
    targetEndDate: event.data.targetEndDate,
    projectManagerId: event.data.projectManagerId,
  }, {
    onSuccess: (data) => {
      toast.add({
        title: 'Proyecto creado',
        description: `${event.data.name} ha sido creado exitosamente`,
        color: 'success',
        icon: 'i-lucide-check'
      })

      // Reset form and close modal
      resetForm()
      open.value = false
    },
    onError: (error) => {
      console.error('Error creating project:', error)
      toast.add({
        title: 'Error',
        description: 'No se pudo crear el proyecto',
        color: 'error',
        icon: 'i-lucide-x'
      })
    }
  })
}

// Reset form helper
const resetForm = (): void => {
  state.customerId = props.customerId
  state.name = ''
  state.type = 'WEBSITE'
  state.startDate = new Date()
  state.targetEndDate = undefined
  state.projectManagerId = ''
}

// Reset form when modal closes
watch(open, (newValue) => {
  if (newValue) {
    resetForm()
  }
})

</script>

<template>
  <div>
    <UButton
      icon="i-lucide-plus"
      :label="$t('projects.add_modal.button_trigger')"
      @click="open = true"
    />

    <UModal
      v-model:open="open"
      class="max-w-3xl"
    >
      <template #header>
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold">{{ $t('projects.add_modal.title') }}</h3>
            <p class="text-sm text-gray-500">{{ $t('projects.add_modal.subtitle') }}</p>
          </div>
        </div>
      </template>

      <template #body>
        <UForm
          id="project-form"
          :schema="createProjectSchema"
          :state="state"
          @error="onError"
          @submit="onSubmit"
        >
          <!-- Basic Information -->
          <UPageCard
            class="mb-6"
            :description="$t('projects.add_modal.sections.basic_info.description')"
            :title="$t('projects.add_modal.sections.basic_info.title')"
            variant="subtle"
          >
            <UFormField
              class="flex max-sm:flex-col justify-between items-start gap-4"
              :description="$t('projects.add_modal.sections.basic_info.description_name')"
              :label="$t('projects.add_modal.sections.basic_info.label_name')"
              name="name"
              required
            >
              <UInput
                v-model="state.name"
                class="w-full max-w-sm"
                :placeholder="$t('projects.add_modal.sections.basic_info.placeholder_name')"
              />
            </UFormField>

            <USeparator/>

            <UFormField
              class="flex max-sm:flex-col justify-between items-start gap-4"
              :description="$t('projects.add_modal.sections.basic_info.description')"
              :label="$t('projects.add_modal.sections.basic_info.label_type')"
              name="type"
              required
            >
              <USelect
                v-model="state.type"
                :items="projectTypeOptions"
                class="w-48 max-w-sm"
                :placeholder="$t('projects.add_modal.sections.basic_info.placeholder_type')"
              />
            </UFormField>

          </UPageCard>

          <!-- Dates and Timeline -->
          <UPageCard
            class="mb-6"
            :description="$t('projects.add_modal.sections.timeline.description')"
            :title="$t('projects.add_modal.sections.timeline.title')"
            variant="subtle"
          >
            <UFormField
              class="flex max-sm:flex-col justify-between items-start gap-4"
              :description="$t('projects.add_modal.sections.timeline.description_start_date')"
              :label="$t('projects.add_modal.sections.timeline.label_start_date')"
              name="startDate"
            >

              <DatePicker v-model="startDateCalendar" class="w-full max-w-sm" />
            </UFormField>

            <USeparator/>

            <UFormField
              :error="!validateDates ? 'La fecha objetivo debe ser posterior a la fecha de inicio' : undefined"
              class="flex max-sm:flex-col justify-between items-start gap-4"
              description="Fecha objetivo de finalización"
              :label="$t('projects.add_modal.sections.timeline.label_target_date')"
              name="targetEndDate"
            >
              <DatePicker v-model="targetEndDateCalendar" class="w-full max-w-sm" />
            </UFormField>

          </UPageCard>

          <!-- Assignment and Budget -->
          <UPageCard
            class="mb-6"
            description="Asignación y presupuesto del proyecto"
            title="Asignación y Presupuesto"
            variant="subtle"
          >
            <UFormField
              class="flex max-sm:flex-col justify-between items-start gap-4"
              :description="$t('projects.add_modal.sections.team.description_manager')"
              :label="$t('projects.add_modal.sections.team.label_manager')"
              name="projectManagerId"
            >
              <USelect
                v-model="state.projectManagerId"
                :items="projectManagers"
                class="w-full max-w-sm"
                :placeholder="$t('projects.add_modal.sections.team.placeholder_manager')"
              />
            </UFormField>

          </UPageCard>
        </UForm>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton
            color="neutral"
            :label="$t('common.actions.button_cancel')"
            variant="subtle"
            @click="open = false"
          />
          <UButton
            color="primary"
            form="project-form"
            icon="i-lucide-save"
            :label="$t('projects.add_modal.button_create')"
            type="submit"
            variant="solid"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
