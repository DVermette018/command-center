<script lang="ts" setup>
import { z } from 'zod'
import { useApi } from '~/api'
import type { ListAnswerDTO, ListQuestionDTO, ListQuestionTemplateDTO } from '~~/dto/question'

// Props & Emits
const props = defineProps<{
  planType: 'LANDING' | 'WEBSITE' | 'PRO'
}>()

const emit = defineEmits<{
  complete: [answers: ListAnswerDTO[]]
  close: []
}>()

// Composables
const api = useApi()
const toast = useToast()
const route = useRoute()
const projectId = route.params.id as string

// State
const currentSectionIndex = ref(0)
const questionTemplates = ref<ListQuestionTemplateDTO[]>([])
const projectAnswers = ref<Map<string, any>>(new Map())
const errors = ref<Map<string, string>>(new Map())
const isLoading = ref(false)
const isSaving = ref(false)
const draftSaveTimeout = ref<NodeJS.Timeout>()

// Section mapping
const sectionInfo = {
  'BUSINESS_CONTEXT': {
    title: 'Business Context',
    description: 'Tell us about your business and target audience',
    icon: 'i-lucide-briefcase'
  },
  'PROJECT_GOALS': {
    title: 'Project Goals',
    description: 'Define what you want to achieve',
    icon: 'i-lucide-target'
  },
  'DESIGN_PREFERENCES': {
    title: 'Design Preferences',
    description: 'Describe your visual style and preferences',
    icon: 'i-lucide-palette'
  },
  'CONTENT_STRUCTURE': {
    title: 'Content Structure',
    description: 'Plan your website content and pages',
    icon: 'i-lucide-file-text'
  },
  'ADDITIONAL_CONTEXT': {
    title: 'Additional Context',
    description: 'Any other important details',
    icon: 'i-lucide-info'
  }
}

// Computed
const currentTemplate = computed<ListQuestionTemplateDTO | undefined>(() => questionTemplates.value[currentSectionIndex.value])

const currentQuestions = computed(() => {
  if (!currentTemplate.value) return []

  // Filter questions based on conditional logic
  return (currentTemplate.value.questions || []).filter(question => {
    if (!question.conditionalOn) return true

    const condition = JSON.parse(question.conditionalOn)
    const dependentAnswer = projectAnswers.value.get(condition.questionCode)

    if (condition.hasValue) {
      if (Array.isArray(dependentAnswer)) {
        return dependentAnswer.includes(condition.hasValue)
      }
      return dependentAnswer === condition.hasValue
    }

    return !!dependentAnswer
  })
})

const progress = computed(() => {
  const totalSections = questionTemplates.value.length
  const completedSections = currentSectionIndex.value
  return Math.round((completedSections / totalSections) * 100)
})

const currentSectionProgress = computed(() => {
  if (!currentQuestions.value.length) return 0

  const requiredQuestions = currentQuestions.value.filter(q => q.required)
  const answeredRequired = requiredQuestions.filter(q => {
    const answer = projectAnswers.value.get(q.code)
    return answer !== null && answer !== undefined && answer !== '' &&
      (Array.isArray(answer) ? answer.length > 0 : true)
  })

  return Math.round((answeredRequired.length / requiredQuestions.length) * 100)
})

const canProceed = computed(() => {
  return currentQuestions.value
    .filter(q => q.required)
    .every(q => {
      const answer = projectAnswers.value.get(q.code)
      return answer !== null && answer !== undefined && answer !== '' &&
        (Array.isArray(answer) ? answer.length > 0 : true)
    })
})

const isLastSection = computed(() => currentSectionIndex.value === questionTemplates.value.length - 1)

// Load questions
const loadQuestions = async () => {
  isLoading.value = true
  try {
    // Load question templates for this plan type
    const templates: ListQuestionTemplateDTO[] = await api.questions.getTemplatesForPlan('WEBSITE')

    questionTemplates.value = templates.sort((a: ListQuestionTemplateDTO, b: ListQuestionTemplateDTO) => a.order - b.order)

    const existingAnswers = await api.questions.getProjectAnswers(projectId)

    if (existingAnswers.length) {
      existingAnswers.forEach((answer: ListAnswerDTO) => {
        projectAnswers.value.set(answer.questionId, answer.answer)
      })

      // Resume from last incomplete section
      const lastCompletedSection = await api.questions.getLastCompletedSection(projectId)
      currentSectionIndex.value = Math.min(lastCompletedSection + 1, questionTemplates.value.length - 1)
    }
  } catch (error) {
    console.error('Error loading questions:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to load questions. Please try again.',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    isLoading.value = false
  }
}

// Validation
const validateAnswer = (question: ListQuestionDTO, answer: any): string | null => {
  if (question.required && (!answer || (Array.isArray(answer) && answer.length === 0))) {
    return 'This field is required'
  }

  if (question.validation) {
    const validation = JSON.parse(question.validation)

    if (validation.minLength && answer.length < validation.minLength) {
      return `Minimum ${validation.minLength} characters required`
    }

    if (validation.maxLength && answer.length > validation.maxLength) {
      return `Maximum ${validation.maxLength} characters allowed`
    }

    if (validation.pattern) {
      const regex = new RegExp(validation.pattern)
      if (!regex.test(answer)) {
        return 'Invalid format'
      }
    }
  }

  if (question.type === 'EMAIL') {
    const emailSchema = z.string().email()
    try {
      emailSchema.parse(answer)
    } catch {
      return 'Invalid email address'
    }
  }

  if (question.type === 'URL') {
    const urlSchema = z.string().url()
    try {
      urlSchema.parse(answer)
    } catch {
      return 'Invalid URL'
    }
  }

  if (question.maxSelections && Array.isArray(answer) && answer.length > question.maxSelections) {
    return `Maximum ${question.maxSelections} selections allowed`
  }

  return null
}

// Save answers
const saveAnswers = async (isDraft = false) => {
  isSaving.value = true
  try {
    const answersToSave = currentQuestions.value.map(question => ({
      projectId: projectId,
      questionId: question.id,
      questionCode: question.code,
      answer: projectAnswers.value.get(question.code) || null
    }))

    if (isDraft) {
      await api.questions.saveDraft({
        projectId: projectId,
        sectionIndex: currentSectionIndex.value,
        answers: answersToSave
      })
    } else {
      await api.questions.saveAnswers({
        projectId: projectId,
        answers: answersToSave
      })

      toast.add({
        title: 'Progress saved',
        description: 'Your answers have been saved.',
        icon: 'i-lucide-check'
      })
    }
  } catch (error) {
    console.error('Error saving answers:', error)
    if (!isDraft) {
      toast.add({
        title: 'Error',
        description: 'Failed to save answers. Please try again.',
        icon: 'i-lucide-alert-circle'
      })
    }
  } finally {
    isSaving.value = false
  }
}

// Auto-save draft
const scheduleDraftSave = () => {
  if (draftSaveTimeout.value) {
    clearTimeout(draftSaveTimeout.value)
  }

  draftSaveTimeout.value = setTimeout(() => {
    saveAnswers(true)
  }, 2000)
}

// Navigation
const goToSection = (index: number) => {
  if (index < currentSectionIndex.value || canProceed.value) {
    saveAnswers()
    currentSectionIndex.value = index
  }
}

const nextSection = async () => {
  // Validate all required questions
  let hasErrors = false
  currentQuestions.value.forEach(question => {
    const answer = projectAnswers.value.get(question.code)
    const error = validateAnswer(question, answer)
    if (error) {
      errors.value.set(question.code, error)
      hasErrors = true
    } else {
      errors.value.delete(question.code)
    }
  })

  if (hasErrors) {
    console.log('Validation errors:', Array.from(errors.value.entries()))
    toast.add({
      title: 'Validation Error',
      description: 'Please fill in all required fields.',
      icon: 'i-lucide-alert-circle'
    })
    return
  }

  await saveAnswers()

  if (isLastSection.value) {
    await completeSetup()
  } else {
    currentSectionIndex.value++
  }
}

const previousSection = () => {
  if (currentSectionIndex.value > 0) {
    saveAnswers()
    currentSectionIndex.value--
  }
}

const completeSetup = async () => {
  isLoading.value = true
  try {
    // Generate AI prompt
    const aiPrompt = await api.questions.generateAIPrompt(projectId)

    toast.add({
      title: 'Setup Complete!',
      description: 'Your project has been configured successfully.',
      icon: 'i-lucide-check-circle'
    })

    // Emit complete event with all answers
    // const allAnswers = Array.from(projectAnswers.value.entries()).map(([code, answer]) => ({
    //   questionCode: code,
    //   answer
    // }))
    //
    // emit('complete', allAnswers)
  } catch (error) {
    console.error('Error completing setup:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to complete setup. Please try again.',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    isLoading.value = false
  }
}

// Handle answer updates
const updateAnswer = (questionCode: string, value: any) => {
  projectAnswers.value.set(questionCode, value)
  errors.value.delete(questionCode)
  scheduleDraftSave()
}

// Initialize
onMounted(() => {
  loadQuestions()
})

onUnmounted(() => {
  if (draftSaveTimeout.value) {
    clearTimeout(draftSaveTimeout.value)
    saveAnswers(true)
  }
})
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header with progress -->
    <div class="border-b bg-gray-50 dark:bg-gray-900">
      <UContainer class="py-4">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-lg font-semibold">Project Setup</h2>
            <p class="text-sm text-gray-500">{{ props.planType }} Plan</p>
          </div>
          <UButton
            color="neutral"
            icon="i-lucide-x"
            variant="ghost"
            @click="$emit('close')"
          />
        </div>

        <!-- Progress bar -->
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Overall Progress</span>
            <span class="font-medium">{{ progress }}%</span>
          </div>
          <UProgress :animation="false" :value="progress"/>
        </div>

        <!-- Section tabs -->
        <div class="mt-6 flex gap-2 overflow-x-auto no-scrollbar">
          <UButton
            v-for="(template, index) in questionTemplates"
            :key="template.id"
            :color="index === currentSectionIndex ? 'primary' : 'neutral'"
            :disabled="index > currentSectionIndex && !canProceed"
            :icon="sectionInfo[template.section]?.icon"
            :variant="index === currentSectionIndex ? 'soft' : 'ghost'"
            size="sm"
            @click="goToSection(index)"
          >
            {{ sectionInfo[template.section]?.title }}
            <UBadge
              v-if="index < currentSectionIndex"
              class="ml-2"
              color="success"
              variant="subtle"
            >
              <UIcon class="w-3 h-3" name="i-lucide-check"/>
            </UBadge>
          </UButton>
        </div>
      </UContainer>
    </div>

    <!-- Main content -->
    <div class="flex-1 overflow-y-auto">
      <UContainer class="py-8">
        <div v-if="isLoading" class="flex justify-center py-12">
          <UIcon class="animate-spin w-8 h-8 text-gray-400" name="i-lucide-loader-2"/>
        </div>

        <div v-else-if="currentTemplate" class="max-w-3xl mx-auto">
          <!-- Section header -->
          <div class="mb-8">
            <div class="flex items-center gap-3 mb-2">
              <UIcon
                :name="sectionInfo[currentTemplate.section]?.icon"
                class="w-6 h-6 text-primary"
              />
              <h3 class="text-xl font-semibold">
                {{ sectionInfo[currentTemplate.section]?.title }}
              </h3>
            </div>
            <p class="text-gray-600 dark:text-gray-400">
              {{ sectionInfo[currentTemplate.section]?.description }}
            </p>

            <!-- Section progress -->
            <div class="mt-4 space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-gray-500">Section Progress</span>
                <span class="font-medium">{{ currentSectionProgress }}%</span>
              </div>
              <UProgress :animation="false" :value="currentSectionProgress" size="sm"/>
            </div>
          </div>

          <!-- Questions -->
          <div class="space-y-6">
            <div
              v-for="question in currentQuestions"
              :key="question.id"
              class="group"
            >
              <UForm
                :error="errors.get(question.code)"
                :help="question.helpText"
                :label="question.question"
                :required="question.required"
              >
                <!-- Text input -->
                <UInput
                  v-if="question.type === 'TEXT' || question.type === 'EMAIL' || question.type === 'URL'"
                  :model-value="projectAnswers.get(question.code) || ''"
                  :placeholder="question.placeholder"
                  :type="question.type === 'EMAIL' ? 'email' : question.type === 'URL' ? 'url' : 'text'"
                  @update:model-value="(value) => updateAnswer(question.code, value)"
                />

                <!-- Textarea -->
                <UTextarea
                  v-else-if="question.type === 'TEXTAREA'"
                  :model-value="projectAnswers.get(question.code) || ''"
                  :placeholder="question.placeholder"
                  :rows="4"
                  @update:model-value="(value) => updateAnswer(question.code, value)"
                />

                <!-- Select -->
                <USelectMenu
                  v-else-if="question.type === 'SELECT'"
                  :model-value="projectAnswers.get(question.code) || ''"
                  :options="JSON.parse(question.options || '[]')"
                  :placeholder="question.placeholder || 'Select an option'"
                  option-attribute="label"
                  value-attribute="value"
                  @update:model-value="(value) => updateAnswer(question.code, value)"
                />

                <!-- Multi-select -->
                <div v-else-if="question.type === 'MULTI_SELECT'" class="space-y-2">
                  <div
                    v-for="option in JSON.parse(question.options || '[]')"
                    :key="option.value"
                    class="flex items-start"
                  >
                    <UCheckbox
                      :model-value="(projectAnswers.get(question.code) || []).includes(option.value)"
                      @update:model-value="(checked) => {
                        const current = projectAnswers.get(question.code) || []
                        const updated = checked
                          ? [...current, option.value]
                          : current.filter((v: string) => v !== option.value)
                        updateAnswer(question.code, updated)
                      }"
                    >
                      <template #label>
                        <span class="ml-2">{{ option.label }}</span>
                      </template>
                    </UCheckbox>
                  </div>
                  <p v-if="question.maxSelections" class="text-sm text-gray-500">
                    Maximum {{ question.maxSelections }} selections
                    ({{ (projectAnswers.get(question.code) || []).length }} selected)
                  </p>
                </div>

                <!-- Toggle -->
                <UToggle
                  v-else-if="question.type === 'TOGGLE'"
                  :model-value="projectAnswers.get(question.code) || false"
                  @update:model-value="(value) => updateAnswer(question.code, value)"
                />

                <!-- Number -->
                <UInput
                  v-else-if="question.type === 'NUMBER'"
                  :model-value="projectAnswers.get(question.code) || ''"
                  :placeholder="question.placeholder"
                  type="number"
                  @update:model-value="(value) => updateAnswer(question.code, value)"
                />

                <!-- Date -->
                <UInput
                  v-else-if="question.type === 'DATE'"
                  :model-value="projectAnswers.get(question.code) || ''"
                  type="date"
                  @update:model-value="(value) => updateAnswer(question.code, value)"
                />
              </UForm>
            </div>
          </div>
        </div>
      </UContainer>
    </div>

    <!-- Footer with navigation -->
    <div class="border-t bg-gray-50 dark:bg-gray-900">
      <UContainer class="py-4">
        <div class="flex items-center justify-between">
          <UButton
            v-if="currentSectionIndex > 0"
            color="gray"
            icon="i-lucide-arrow-left"
            variant="ghost"
            @click="previousSection"
          >
            Previous
          </UButton>
          <div v-else/>

          <div class="flex items-center gap-2">
            <span v-if="isSaving" class="text-sm text-gray-500 flex items-center gap-2">
              <UIcon class="animate-spin w-4 h-4" name="i-lucide-loader-2"/>
              Saving...
            </span>

            <UButton
              :color="canProceed ? 'primary' : 'neutral'"
              :disabled="!canProceed || isSaving"
              :loading="isLoading"
              @click="nextSection"
            >
              <template v-if="isLastSection">
                Complete Setup
                <UIcon class="ml-2 w-4 h-4" name="i-lucide-check"/>
              </template>
              <template v-else>
                Next
                <UIcon class="ml-2 w-4 h-4" name="i-lucide-arrow-right"/>
              </template>
            </UButton>
          </div>
        </div>
      </UContainer>
    </div>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
