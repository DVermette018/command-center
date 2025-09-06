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
    :title="$t('projects.phase_modal.title')"
    :description="$t('projects.phase_modal.description', { currentPhase: allPhases.find(p => p.value === currentPhase)?.label, selectedPhase: allPhases.find(p => p.value === selectedPhase)?.label })"
  >
    <template #body>
    <div class="flex flex-col space-y-4">
      <!-- Phase Selection -->
      <UFormField
        :label="$t('projects.phase_modal.label_new_phase')"
        name="phase"
        required
      >
        <USelect
          v-model="selectedPhase"
          :items="phaseOptions"
          :placeholder="$t('projects.phase_modal.placeholder_phase')"
          class="w-full"
        />
      </UFormField>

      <!-- Notes -->
      <UFormField
        :label="$t('projects.phase_modal.label_notes')"
        name="notes"
      >
        <UTextarea
          v-model="notes"
          :placeholder="$t('projects.phase_modal.placeholder_notes')"
          :rows="3"
        />
      </UFormField>

      <!-- Phase Progress Preview -->
      <div class="p-4 bg-gray-50 rounded-lg">
        <h4 class="text-sm font-medium mb-3">{{ $t('projects.phase_modal.flow.title') }}</h4>
        <div class="flex flex-wrap gap-2">
          <div
            v-for="(phase, index) in allPhases"
            :key="phase.value"
            class="flex items-center"
          >
            <UBadge
              :color="getPhaseColor(phase.value, selectedPhase)"
              :variant="getPhaseVariant(phase.value, selectedPhase)"
              size="sm"
            >
              {{ phase.label }}
            </UBadge>
            <Icon
              v-if="index < allPhases.length - 1"
              name="i-lucide-chevron-right"
              class="h-3 w-3 mx-1 text-gray-400"
            />
          </div>
        </div>
        <p class="text-sm text-gray-600 mt-2">
          {{ getPhaseDescription(selectedPhase) }}
        </p>
      </div>
    </div>
    </template>

    <template #footer>
      <div class="flex justify-end space-x-2">
        <UButton
          color="neutral"
          variant="subtle"
          @click="cancel"
        >
          {{ $t('common.actions.button_cancel') }}
        </UButton>
        <UButton
          :loading="updatePhaseMutation.isPending.value"
          :disabled="!selectedPhase"
          @click="updatePhase"
        >
          {{ $t('projects.phase_modal.button_update') }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script lang="ts" setup>
import type { ProjectPhase } from '~~/types/project'
import { useApi } from '~/api'

interface Props {
  projectId: string
  currentPhase: ProjectPhase
  triggerText?: string
  triggerIcon?: string
  triggerVariant?: string
  triggerColor?: string
}

interface Emits {
  success: [newPhase: ProjectPhase]
  error: [error: string]
}

const props = withDefaults(defineProps<Props>(), {
  triggerText: 'Update Phase',
  triggerIcon: 'i-lucide-route',
  triggerVariant: 'outline',
  triggerColor: 'secondary'
})
const emit = defineEmits<Emits>()

const api = useApi()
const toast = useToast()

// Use the mutation hook for updating project phase
const updatePhaseMutation = api.projects.updatePhase()

// Modal state
const isOpen = ref(false)
const selectedPhase = ref<ProjectPhase>(props.currentPhase)
const notes = ref('')

// Phase options in logical order
const { t } = useI18n()
const allPhases = computed(() => [
  { label: t('projects.phase_modal.phases.discovery'), value: 'DISCOVERY' },
  { label: t('projects.phase_modal.phases.planning'), value: 'PLANNING' },
  { label: t('projects.phase_modal.phases.design'), value: 'DESIGN' },
  { label: t('projects.phase_modal.phases.development'), value: 'DEVELOPMENT' },
  { label: t('projects.phase_modal.phases.review'), value: 'REVIEW' },
  { label: t('projects.phase_modal.phases.testing'), value: 'TESTING' },
  { label: t('projects.phase_modal.phases.launch'), value: 'LAUNCH' },
  { label: t('projects.phase_modal.phases.post_launch'), value: 'POST_LAUNCH' },
  { label: t('projects.phase_modal.phases.maintenance'), value: 'MAINTENANCE' }
])

const phaseOptions = allPhases

// Phase metadata
const phaseMeta = {
  DISCOVERY: { color: 'purple', description: 'Understanding requirements and project scope' },
  PLANNING: { color: 'blue', description: 'Creating project plan and timeline' },
  DESIGN: { color: 'pink', description: 'Creating visual designs and user experience' },
  DEVELOPMENT: { color: 'orange', description: 'Building the actual project deliverables' },
  REVIEW: { color: 'yellow', description: 'Internal review and quality assurance' },
  TESTING: { color: 'red', description: 'Testing functionality and user acceptance' },
  LAUNCH: { color: 'green', description: 'Going live and initial deployment' },
  POST_LAUNCH: { color: 'teal', description: 'Post-launch monitoring and support' },
  MAINTENANCE: { color: 'gray', description: 'Ongoing maintenance and updates' }
}

// Helper functions
const getPhaseColor = (phase: ProjectPhase, selectedPhase: ProjectPhase) => {
  const phaseIndex = allPhases.findIndex(p => p.value === phase)
  const selectedIndex = allPhases.findIndex(p => p.value === selectedPhase)
  const currentIndex = allPhases.findIndex(p => p.value === props.currentPhase)

  if (phase === selectedPhase) return 'primary'
  if (phaseIndex <= currentIndex) return 'success'
  return 'neutral'
}

const getPhaseVariant = (phase: ProjectPhase, selectedPhase: ProjectPhase) => {
  return phase === selectedPhase ? 'solid' : 'subtle'
}

const getPhaseDescription = (phase: ProjectPhase) => {
  const key = `projects.phase_modal.phase_descriptions.${phase.toLowerCase()}`
  return t(key)
}

// Methods
const open = () => {
  isOpen.value = true
  selectedPhase.value = props.currentPhase
  notes.value = ''
}

const cancel = () => {
  isOpen.value = false
  selectedPhase.value = props.currentPhase
  notes.value = ''
}

const updatePhase = () => {
  if (!selectedPhase.value) return

  updatePhaseMutation.mutate({
    id: props.projectId,
    phase: selectedPhase.value,
    notes: notes.value.trim() || undefined
  }, {
    onSuccess: () => {
      emit('success', selectedPhase.value)

      toast.add({
        title: 'Phase Updated',
        description: `Project phase changed to ${allPhases.find(p => p.value === selectedPhase.value)?.label}`,
        color: 'success',
        icon: 'i-lucide-check'
      })

      isOpen.value = false
      selectedPhase.value = props.currentPhase
      notes.value = ''
    },
    onError: (error: any) => {
      console.error('Failed to update project phase:', error)

      const errorMessage = error instanceof Error ? error.message : 'Failed to update project phase'
      emit('error', errorMessage)

      toast.add({
        title: 'Update Failed',
        description: errorMessage,
        color: 'error',
        icon: 'i-lucide-x'
      })
    }
  })
}

// No need to expose methods - button is included in component
</script>
