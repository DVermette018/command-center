<script lang="ts" setup>
import type { FormSubmitEvent } from '@nuxt/ui'
import { type CreateCustomerSchema, createCustomerSchema } from '~~/dto/customer'
import { useApi } from '~/api'

const api = useApi()
const toast = useToast()

const open = ref(false)

// Use the mutation hook for creating customers
const createCustomerMutation = api.customers.create()

// Form state matching the Customer model
const state = reactive<CreateCustomerSchema>({
  business: {
    businessName: '',
    ownerName: '', // Add missing ownerName
    legalName: undefined,
    phone: undefined,
    email: undefined,
    taxId: undefined,
    website: undefined,
    category: '',
    customCategory: undefined,
    size: undefined,
    // Address information
    address: {
      type: 'BUSINESS',
      isPrimary: true,
      street: '',
      street2: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'MX',
      reference: ''
    },
    slogan: undefined,
    missionStatement: undefined,
    primaryColor: undefined,
    secondaryColor: undefined,
    accentColor: undefined,
    additionalColors: undefined
  },
  status: 'LEAD',
  source: undefined,

  // Contact information (will create a CustomerContact)
  contact: {
    id: '',
    customerId: '',
    email: '',
    firstName: '',
    lastName: '',
    position: undefined,
    department: undefined,
    isPrimary: true
  }
})

// Options
const statusOptions = [
  { label: 'Prospecto', value: 'LEAD' },
  { label: 'Cliente Potencial', value: 'PROSPECT' },
  { label: 'Cliente Activo', value: 'ACTIVE' },
  { label: 'Inactivo', value: 'INACTIVE' },
  { label: 'Perdido', value: 'CHURNED' }
]

const companySizeOptions = [
  { label: 'Micro (1-10 empleados)', value: 'MICRO' },
  { label: 'Pequeña (11-50 empleados)', value: 'SMALL' },
  { label: 'Mediana (51-250 empleados)', value: 'MEDIUM' },
  { label: 'Grande (251-1000 empleados)', value: 'LARGE' },
  { label: 'Empresa (1000+ empleados)', value: 'ENTERPRISE' }
]

const industryOptions = [
  { label: 'Restoracion', value: 'restaurant' },
  { label: 'Retail', value: 'retail' },
  { label: 'Construcción', value: 'construction' },
  { label: 'Tecnología de la Información', value: 'it' },
  { label: 'Servicios Profesionales', value: 'professional_services' },
  { label: 'Telecomunicaciones', value: 'telecommunications' },
  { label: 'Automotriz', value: 'automotive' },
  { label: 'Energías Renovables', value: 'renewable_energy' },
  { label: 'Alimentos y Bebidas', value: 'food_and_beverage' },
  { label: 'Logística y Transporte', value: 'logistics' },
  { label: 'Turismo y Viajes', value: 'tourism' },
  { label: 'Tecnología', value: 'technology' },
  { label: 'Servicios Financieros', value: 'finance' },
  { label: 'Salud', value: 'healthcare' },
  { label: 'Educación', value: 'education' },
  { label: 'Manufactura', value: 'manufacturing' },
  { label: 'Bienes Raíces', value: 'real_estate' },
  { label: 'Agricultura', value: 'agriculture' },
  { label: 'Energía', value: 'energy' },
  { label: 'Medios y Entretenimiento', value: 'media' },
  { label: 'Gobierno', value: 'government' },
  { label: 'Sin Fines de Lucro', value: 'nonprofit' },
  { label: 'Otro', value: 'other' }
]

const sourceOptions = [
  { label: 'Sitio Web', value: 'website' },
  { label: 'Visita de vendedor', value: 'cold_visit' },
  { label: 'Referencia', value: 'referral' },
  { label: 'Redes Sociales', value: 'social_media' },
  { label: 'Google Ads', value: 'google_ads' },
  { label: 'Facebook Ads', value: 'facebook_ads' },
  { label: 'LinkedIn', value: 'linkedin' },
  { label: 'Evento', value: 'event' },
  { label: 'Llamada en Frío', value: 'cold_call' },
  { label: 'Email Marketing', value: 'email_marketing' },
  { label: 'Partner', value: 'partner' },
  { label: 'Otro', value: 'other' }
]

const addressTypeOptions = [
  { label: 'Negocio', value: 'BUSINESS' },
  { label: 'Facturación', value: 'BILLING' },
  { label: 'Envío', value: 'SHIPPING' },
  { label: 'Otro', value: 'OTHER' }
]

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
const onSubmit = async (event: FormSubmitEvent<CreateCustomerSchema>): Promise<void> => {
  console.log('Form submitted with data:', event.data)
  
  createCustomerMutation.mutate({
    business: event.data.business,
    status: event.data.status,
    source: event.data.source,
    contact: event.data.contact
  }, {
    onSuccess: (data) => {
      toast.add({
        title: 'Cliente creado',
        description: `${event.data.business.businessName} ha sido agregado exitosamente`,
        color: 'success',
        icon: 'i-lucide-check'
      })

      // Reset form and close modal
      resetForm()
      open.value = false
    },
    onError: (error) => {
      console.error('Error creating customer:', error)
      toast.add({
        title: 'Error',
        description: 'No se pudo crear el cliente',
        color: 'error',
        icon: 'i-lucide-x'
      })
    }
  })
}

// Reset form helper
const resetForm = (): void => {
  state.status = 'LEAD'
  state.source = undefined
  state.business = {
    businessName: '',
    ownerName: '',
    legalName: undefined,
    phone: undefined,
    email: undefined,
    taxId: undefined,
    website: undefined,
    category: '',
    customCategory: undefined,
    size: undefined,
    address: {
      type: 'BUSINESS',
      isPrimary: true,
      street: '',
      street2: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'MX',
      reference: ''
    },
    slogan: undefined,
    missionStatement: undefined,
    primaryColor: undefined,
    secondaryColor: undefined,
    accentColor: undefined,
    additionalColors: undefined
  }
  state.contact = {
    id: '',
    customerId: '',
    email: '',
    firstName: '',
    lastName: '',
    position: undefined,
    department: undefined,
    isPrimary: true
  }
}
// console.log(createCustomerSchema.safeParse?.({}))

// Reset form when modal closes
watch(open, (newValue) => {
  if (!newValue) {
    resetForm()
  }
})
</script>

<template>
  <div>
    <UButton
      icon="i-lucide-plus"
      label="Nuevo Cliente"
      @click="open = true"
    />

    <UModal
      v-model:open="open"
      class="max-w-2xl"
    >
      <template #header>
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold">Nuevo Cliente</h3>
            <p class="text-sm text-gray-500">Complete la información para agregar un nuevo cliente</p>
          </div>
        </div>
      </template>

      <template #body>
        <UForm
          id="customer-form"
          :schema="createCustomerSchema"
          :state="state"
          @error="onError"
          @submit="onSubmit"
        >
          <!-- Company Information -->
          <UPageCard
            class="mb-6"
            description="Información general de la empresa"
            title="Datos de la Empresa"
            variant="subtle"
          >
            <UFormField
              class="flex max-sm:flex-col justify-between items-start gap-4"
              description="Nombre de la empresa o cliente"
              label="Nombre de la Empresa"
              name="business.businessName"
              required
            >
              <UInput
                v-model="state.business.businessName"
                class="w-full max-w-sm"
                placeholder="Empresa ABC"
              />
            </UFormField>

            <USeparator/>

            <UFormField
              class="flex max-sm:flex-col justify-between items-start gap-4"
              description="Nombre del propietario o representante legal"
              label="Propietario"
              name="business.ownerName"
              required
            >
              <UInput
                v-model="state.business.ownerName"
                class="w-full max-w-sm"
                placeholder="Juan Pérez"
              />
            </UFormField>

            <USeparator/>
            
            <UFormField
              class="flex max-sm:flex-col justify-between items-start gap-4"
              description="Teléfono de la empresa"
              label="Teléfono"
              name="business.phone"
            >
              <UInput
                v-model="state.business.phone"
                class="w-full max-w-sm"
                placeholder="(33) 1234-5678"
                type="tel"
              />
            </UFormField>
            
            <USeparator/>
            
            <UFormField
              class="flex max-sm:flex-col justify-between items-start gap-4"
              description="Email de la empresa"
              label="Email"
              name="business.email"
            >
              <UInput
                v-model="state.business.email"
                class="w-full max-w-sm"
                placeholder="info@empresa.com"
                type="email"
              />
            </UFormField>

            <USeparator/>

            <UFormField
              class="flex max-sm:flex-col justify-between items-start gap-4"
              description="Nombre legal de la empresa"
              label="Nombre legal"
              name="business.legalName"
            >
              <UInput
                v-model="state.business.legalName"
                class="w-full max-w-sm"
                placeholder="Empresa ABC S.A. de C.V."
              />
            </UFormField>

            <USeparator/>

            <UFormField
              class="flex max-sm:flex-col justify-between items-start gap-4"
              description="RFC o identificación fiscal"
              label="RFC / ID Fiscal"
              name="business.taxId"
            >
              <UInput
                v-model="state.business.taxId"
                class="w-full max-w-sm"
                placeholder="ABC123456DEF"
              />
            </UFormField>

            <USeparator/>

            <UFormField
              class="flex max-sm:flex-col justify-between items-start gap-4"
              description="Industria o sector"
              label="Industria"
              name="business.category"
            >
              <USelect
                v-model="state.business.category"
                :items="industryOptions"
                class="w-full max-w-sm"
                placeholder="Seleccione una industria"
              />
            </UFormField>

            <USeparator/>

            <UFormField
              class="flex max-sm:flex-col justify-between items-start gap-4"
              description="Tamaño de la empresa"
              label="Tamaño"
              name="business.size"
            >
              <USelect
                v-model="state.business.size"
                :items="companySizeOptions"
                class="w-full max-w-sm"
                placeholder="Seleccione el tamaño"
              />
            </UFormField>

            <USeparator/>

            <UFormField
              class="flex max-sm:flex-col justify-between items-start gap-4"
              description="Estado actual del cliente"
              label="Estado"
              name="status"
              required
            >
              <USelect
                v-model="state.status"
                :items="statusOptions"
                class="w-full max-w-sm"
                placeholder="Seleccione un estado"
              />
            </UFormField>

            <USeparator/>

            <UFormField
              class="flex max-sm:flex-col justify-between items-start gap-4"
              description="¿Cómo nos encontró?"
              label="Fuente"
              name="source"
            >
              <USelect
                v-model="state.source"
                :items="sourceOptions"
                class="w-full max-w-sm"
                placeholder="Seleccione la fuente"
              />
            </UFormField>
          </UPageCard>

          <!-- Contact Information -->
          <UPageCard
            class="mb-6"
            description="Información del contacto principal"
            title="Contacto Principal"
            variant="subtle"
          >
            <UFormField
              class="flex max-sm:flex-col justify-between items-start gap-4"
              description="Nombre del contacto"
              label="Nombre"
              name="contact.firstName"
            >
              <UInput
                v-model="state.contact.firstName"
                class="w-full max-w-sm"
                placeholder="Juan Oscar"
              />
            </UFormField>

            <USeparator/>
            <UFormField
              class="flex max-sm:flex-col justify-between items-start gap-4"
              description="Apellido del contacto"
              label="Apellido"
              name="contact.lastName"
            >
              <UInput
                v-model="state.contact.lastName"
                class="w-full max-w-sm"
                placeholder="Perez Alvarez"
              />
            </UFormField>

            <USeparator/>

            <UFormField
              class="flex max-sm:flex-col justify-between items-start gap-4"
              description="Correo electrónico del contacto"
              label="Email"
              name="contact.email"
            >
              <UInput
                v-model="state.contact.email"
                class="w-full max-w-sm"
                placeholder="contacto@empresa.com"
                type="email"
              />
            </UFormField>

            <USeparator/>

<!-- Note: Phone is not part of the contact schema, it's in the business schema -->

            <USeparator/>

            <UFormField
              class="flex max-sm:flex-col justify-between items-start gap-4"
              description="Cargo o puesto en la empresa"
              label="Puesto"
              name="contact.position"
            >
              <UInput
                v-model="state.contact.position"
                class="w-full max-w-sm"
                placeholder="Director General"
              />
            </UFormField>
          </UPageCard>

          <!-- Address (Optional) -->
          <UPageCard
            class="mb-6"
            description="Dirección física (opcional)"
            title="Dirección"
            variant="subtle"
          >
            <UFormField
              class="flex max-sm:flex-col justify-between items-start gap-4"
              description="Tipo de dirección"
              label="Tipo"
              name="business.address.type"
            >
              <USelect
                v-model="state.business.address.type"
                :items="addressTypeOptions"
                class="w-full max-w-sm"
              />
            </UFormField>

            <USeparator/>

            <UFormField
              class="flex max-sm:flex-col justify-between items-start gap-4"
              description="Calle y número"
              label="Dirección"
              name="business.address.street"
            >
              <UInput
                v-model="state.business.address.street"
                class="w-full max-w-sm"
                placeholder="Av. Principal 123"
              />
            </UFormField>

            <USeparator/>

            <UFormField
              class="flex max-sm:flex-col justify-between items-start gap-4"
              description="Colonia, edificio, piso, etc."
              label="Dirección Línea 2"
              name="business.address.street2"
            >
              <UInput
                v-model="state.business.address.street2"
                class="w-full max-w-sm"
                placeholder="Col. Centro, Piso 2"
              />
            </UFormField>

            <USeparator/>

            <UFormField
              class="flex max-sm:flex-col justify-between items-start gap-4"
              description="Ciudad"
              label="Ciudad"
              name="business.address.city"
            >
              <UInput
                v-model="state.business.address.city"
                class="w-full max-w-sm"
                placeholder="Guadalajara"
              />
            </UFormField>

            <USeparator/>

            <UFormField
              class="flex max-sm:flex-col justify-between items-start gap-4"
              description="Estado o provincia"
              label="Estado"
              name="business.address.state"
            >
              <UInput
                v-model="state.business.address.state"
                class="w-full max-w-sm"
                placeholder="Jalisco"
              />
            </UFormField>

            <USeparator/>

            <UFormField
              class="flex max-sm:flex-col justify-between items-start gap-4"
              description="Código postal"
              label="CP"
              name="business.address.zipCode"
            >
              <UInput
                v-model="state.business.address.zipCode"
                class="w-full max-w-sm"
                placeholder="44100"
              />
            </UFormField>

            <USeparator/>

            <UFormField
              class="flex max-sm:flex-col justify-between items-start gap-4"
              description="Referencias o indicaciones"
              label="Referencias"
              name="business.address.reference"
            >
              <UInput
                v-model="state.business.address.reference"
                class="w-full max-w-sm"
                placeholder="Frente al parque central"
              />
            </UFormField>
          </UPageCard>
        </UForm>
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
            color="primary"
            form="customer-form"
            icon="i-lucide-save"
            label="Crear Cliente"
            type="submit"
            variant="solid"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
