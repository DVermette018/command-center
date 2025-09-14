<script lang="ts" setup>
import type { CustomerDTO } from '~~/dto/customer'
import { CUSTOMER_STATUSES } from '~~/types/customers'
import { useApi } from '~/api'

const props = defineProps<{
  customer: CustomerDTO
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'statusChanged': [customer: CustomerDTO]
}>()

const api = useApi()
const toast = useToast()

const updateStatusMutation = api.customers.useUpdateStatusMutation()

const open = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

const state = reactive({
  status: props.customer.status,
  reason: ''
})

const statusOptions = [
  { label: 'Prospecto', value: 'LEAD', color: 'primary' as const, description: 'Cliente potencial inicial' },
  { label: 'Cliente Potencial', value: 'PROSPECT', color: 'warning' as const, description: 'Cliente cualificado con interés confirmado' },
  { label: 'Cliente Activo', value: 'ACTIVE', color: 'success' as const, description: 'Cliente que genera ingresos actualmente' },
  { label: 'Inactivo', value: 'INACTIVE', color: 'neutral' as const, description: 'Cliente temporalmente inactivo' },
  { label: 'Perdido', value: 'CHURNED', color: 'error' as const, description: 'Cliente que dejó de usar nuestros servicios' }
]

const currentStatus = computed(() => 
  statusOptions.find(option => option.value === props.customer.status)
)

const newStatus = computed(() => 
  statusOptions.find(option => option.value === state.status)
)

const hasChanged = computed(() => 
  state.status !== props.customer.status
)

const isDowngrade = computed(() => {
  const statusPriority = { 'LEAD': 1, 'PROSPECT': 2, 'ACTIVE': 3, 'INACTIVE': 2, 'CHURNED': 0 }
  return statusPriority[state.status as keyof typeof statusPriority] < 
         statusPriority[props.customer.status as keyof typeof statusPriority]
})

const requiresReason = computed(() => 
  isDowngrade.value || state.status === 'CHURNED' || state.status === 'INACTIVE'
)

const onSubmit = async (): Promise<void> => {
  if (requiresReason.value && !state.reason.trim()) {
    toast.add({
      title: 'Motivo requerido',
      description: 'Por favor, proporcione un motivo para este cambio de estado',
      color: 'error',
      icon: 'i-lucide-alert-triangle'
    })
    return
  }

  updateStatusMutation.mutate({
    id: props.customer.id,
    status: state.status as (typeof CUSTOMER_STATUSES)[number],
    reason: state.reason || undefined
  }, {
    onSuccess: (updatedCustomer: CustomerDTO) => {
      toast.add({
        title: 'Estado actualizado',
        description: `El cliente ${props.customer.businessProfile?.businessName} ahora es ${newStatus.value?.label}`,
        color: 'success',
        icon: 'i-lucide-check'
      })

      emit('statusChanged', updatedCustomer)
      open.value = false
      resetForm()
    },
    onError: (error: Error) => {
      console.error('Error updating customer status:', error)
      toast.add({
        title: 'Error',
        description: 'No se pudo actualizar el estado del cliente',
        color: 'error',
        icon: 'i-lucide-x'
      })
    }
  })
}

const resetForm = (): void => {
  state.status = props.customer.status
  state.reason = ''
}

// Reset form when modal opens/closes
watch(open, (newValue) => {
  if (newValue) {
    resetForm()
  }
})
</script>

<template>
  <UModal
    v-model:open="open"
    class="max-w-md"
  >
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold">Cambiar Estado del Cliente</h3>
          <p class="text-sm text-gray-500">{{ customer.businessProfile?.businessName }}</p>
        </div>
      </div>
    </template>

    <template #body>
      <div class="space-y-6">
        <!-- Current Status -->
        <div class="rounded-lg border border-gray-200 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-700">Estado Actual</p>
              <div class="flex items-center gap-2 mt-1">
                <UBadge 
                  :color="currentStatus?.color" 
                  variant="subtle"
                >
                  {{ currentStatus?.label }}
                </UBadge>
                <span class="text-sm text-gray-500">{{ currentStatus?.description }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- New Status Selection -->
        <UFormField
          label="Nuevo Estado"
          name="status"
          required
        >
          <USelect
            v-model="state.status"
            :items="statusOptions.map(opt => ({
              label: opt.label,
              value: opt.value,
              description: opt.description
            }))"
            placeholder="Seleccione un nuevo estado"
          >
            <template #option="{ option }: { option: { label: string; value: string; description: string } }">
              <div class="flex items-center gap-3">
                <UBadge 
                  :color="statusOptions.find(s => s.value === option.value)?.color" 
                  variant="subtle"
                  size="sm"
                >
                  {{ option.label }}
                </UBadge>
                <span class="text-sm text-gray-600">{{ option.description }}</span>
              </div>
            </template>
          </USelect>
        </UFormField>

        <!-- Preview New Status -->
        <div 
          v-if="hasChanged" 
          class="rounded-lg border border-green-200 bg-green-50 p-4"
        >
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-arrow-right" class="text-green-600" />
            <p class="text-sm font-medium text-green-800">Cambio a:</p>
            <UBadge 
              :color="newStatus?.color" 
              variant="subtle"
            >
              {{ newStatus?.label }}
            </UBadge>
          </div>
          <p class="text-sm text-green-700 mt-1">{{ newStatus?.description }}</p>
        </div>

        <!-- Reason Field (when required) -->
        <UFormField
          v-if="requiresReason"
          label="Motivo del Cambio"
          name="reason"
          :required="requiresReason"
          description="Este cambio requiere una explicación"
        >
          <UTextarea
            v-model="state.reason"
            placeholder="Explique el motivo de este cambio de estado..."
            :rows="3"
          />
        </UFormField>

        <!-- Warning for downgrades -->
        <UAlert
          v-if="isDowngrade"
          color="warning"
          icon="i-lucide-alert-triangle"
          title="Cambio Sensible"
          description="Este cambio representa una regresión en el proceso de ventas. Asegúrese de documentar adecuadamente el motivo."
        />
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton
          color="neutral"
          label="Cancelar"
          variant="subtle"
          @click="open = false"
        />
        <UButton
          :color="isDowngrade ? 'warning' : 'primary'"
          :disabled="!hasChanged || updateStatusMutation.isPending.value"
          :icon="updateStatusMutation.isPending.value ? 'i-lucide-loader-2' : 'i-lucide-save'"
          :label="updateStatusMutation.isPending.value ? 'Guardando...' : 'Actualizar Estado'"
          variant="solid"
          @click="onSubmit"
        />
      </div>
    </template>
  </UModal>
</template>