<script lang="ts" setup>
import type { FormSubmitEvent } from '@nuxt/ui'
import { type CreateBusinessProfileDTO, createBusinessProfileSchema } from '~~/dto/business'
import { useApi } from '~/api'

const api = useApi()
const route = useRoute()

// Get projectId from route params or query
const projectId = computed(() => route.params.projectId || route.query.projectId)

// Form state matching the new schema
const businessForm = reactive<CreateBusinessProfileDTO>({
  projectId: projectId.value as string || '',

  // Identity
  businessName: '',
  ownerName: '',
  phone: '',
  email: '',
  legalName: '',
  taxId: '',

  // Business Details
  category: '',
  customCategory: '',
  description: '',
  productsServices: '',
  yearEstablished: undefined,

  // Branding
  slogan: '',
  missionStatement: '',
  primaryColor: '',
  secondaryColor: '',
  accentColors: '',
  additionalColors: [],

  // Relations (will be handled separately)
  addresses: [{
    type: 'BUSINESS',
    isPrimary: true,
    street: '',
    street2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'MX',
    reference: ''
  }],
  schedules: [],
  socialMedia: []
})

// Initialize schedules with all days
const schedules = reactive([
  { dayOfWeek: 'MONDAY', openTime: '09:00', closeTime: '18:00', isClosed: false },
  { dayOfWeek: 'TUESDAY', openTime: '09:00', closeTime: '18:00', isClosed: false },
  { dayOfWeek: 'WEDNESDAY', openTime: '09:00', closeTime: '18:00', isClosed: false },
  { dayOfWeek: 'THURSDAY', openTime: '09:00', closeTime: '18:00', isClosed: false },
  { dayOfWeek: 'FRIDAY', openTime: '09:00', closeTime: '18:00', isClosed: false },
  { dayOfWeek: 'SATURDAY', openTime: '10:00', closeTime: '14:00', isClosed: false },
  { dayOfWeek: 'SUNDAY', openTime: '', closeTime: '', isClosed: true }
])

// Social media array
const socialMedia = reactive([
  { platform: 'FACEBOOK', url: '', username: '', isActive: true }
])

// Additional colors array for multiple accent colors
const additionalColorsList = reactive<string[]>([])

// Options
const businessCategoryOptions = [
  { label: 'Restaurante', value: 'restaurant' },
  { label: 'Cafetería', value: 'cafe' },
  { label: 'Tienda de Abarrotes', value: 'grocery' },
  { label: 'Servicios Profesionales', value: 'professional' },
  { label: 'Salud y Belleza', value: 'health_beauty' },
  { label: 'Tecnología', value: 'technology' },
  { label: 'Educación', value: 'education' },
  { label: 'Manufactura', value: 'manufacturing' },
  { label: 'Construcción', value: 'construction' },
  { label: 'Otro', value: 'other' }
]

const socialPlatformOptions = [
  { label: 'Facebook', value: 'FACEBOOK' },
  { label: 'Instagram', value: 'INSTAGRAM' },
  { label: 'Twitter/X', value: 'TWITTER' },
  { label: 'LinkedIn', value: 'LINKEDIN' },
  { label: 'TikTok', value: 'TIKTOK' },
  { label: 'YouTube', value: 'YOUTUBE' },
  { label: 'WhatsApp Business', value: 'WHATSAPP' }
]

const dayLabels = {
  MONDAY: 'Lunes',
  TUESDAY: 'Martes',
  WEDNESDAY: 'Miércoles',
  THURSDAY: 'Jueves',
  FRIDAY: 'Viernes',
  SATURDAY: 'Sábado',
  SUNDAY: 'Domingo'
}

const companySizeOptions = [
  { label: '1-10 empleados', value: '1-10' },
  { label: '11-50 empleados', value: '11-50' },
  { label: '51-250 empleados', value: '51-250' },
  { label: '251-1000 empleados', value: '251-1000' },
  { label: 'Más de 1000 empleados', value: '1000+' }
]

// Toast notification
const toast = useToast()

// Methods
const addSocialMedia = (): void => {
  socialMedia.push({
    platform: 'FACEBOOK',
    url: '',
    username: '',
    isActive: true
  })
}

const removeSocialMedia = (index: number): void => {
  if (socialMedia.length > 1) {
    socialMedia.splice(index, 1)
  }
}

const addAdditionalColor = (): void => {
  additionalColorsList.push('#000000')
}

const removeAdditionalColor = (index: number): void => {
  additionalColorsList.splice(index, 1)
}

// Reactive mutations
const storeBusinessMutation = api.business.useStoreMutation()

// Submit handler
const onSubmit = async (event: FormSubmitEvent<CreateBusinessProfileDTO>): Promise<void> => {
  try {
    // Prepare the payload
    const payload = {
      ...event.data,
      // Convert reactive arrays to the form data
      schedules: schedules.filter(s => !s.isClosed || s.openTime), // Include only configured days
      socialMedia: socialMedia.filter(s => s.url || s.username), // Include only filled social media
      additionalColors: additionalColorsList.length > 0 ? additionalColorsList : undefined,
      // Ensure address is properly formatted
      addresses: [{
        ...event.data.addresses[0],
        coordinates: event.data.addresses[0].coordinates ? {
          lat: event.data.addresses[0].coordinates.lat,
          lng: event.data.addresses[0].coordinates.lng
        } : undefined
      }]
    }

    console.log('Submitting business profile:', payload)

    // Call your API endpoint
    await storeBusinessMutation(payload)

    toast.add({
      title: 'Registro exitoso',
      description: 'El perfil del negocio ha sido creado correctamente',
      icon: 'i-lucide-check',
      color: 'success'
    })

    // Redirect to business profile or list
    // await navigateTo(`/projects/${projectId.value}/business-profile`)
  } catch (error) {
    console.error('Error creating business profile:', error)
    toast.add({
      title: 'Error',
      description: 'Hubo un problema al crear el perfil del negocio',
      icon: 'i-lucide-x',
      color: 'error'
    })
  }
}

// Validate projectId on mount
onMounted(() => {
  // if (!projectId.value) {
  //   toast.add({
  //     title: 'Error',
  //     description: 'Se requiere un ID de proyecto para crear un perfil de negocio',
  //     color: 'error'
  //   })
  //   navigateTo('/projects')
  // }
})
</script>

<template>
  <UDashboardPanel id="business-profile">
    <div class="max-w-4xl mx-auto">
      <UForm
        id="business-profile-form"
        :schema="createBusinessProfileSchema"
        :state="businessForm"
        @submit="onSubmit"
      >
        <!-- Header Card -->
        <UPageCard
          class="mb-6"
          description="Complete la información de su negocio para crear su perfil empresarial."
          orientation="horizontal"
          title="Registro de Perfil de Negocio"
          variant="naked"
        >
          <UButton
            class="w-fit lg:ms-auto"
            color="primary"
            form="business-profile-form"
            icon="i-lucide-building"
            label="Crear Perfil"
            type="submit"
          />
        </UPageCard>

        <!-- Business Identity -->
        <UPageCard
          class="mb-6"
          description="Información principal del negocio"
          title="Identidad del Negocio"
          variant="subtle"
        >
          <UFormField
            class="flex max-sm:flex-col justify-between items-start gap-4"
            description="Nombre comercial de la empresa"
            label="Nombre del Negocio"
            name="businessName"
            required
          >
            <UInput
              v-model="businessForm.businessName"
              placeholder="Nombre de su empresa"
            />
          </UFormField>

          <USeparator/>

          <UFormField
            class="flex max-sm:flex-col justify-between items-start gap-4"
            description="Razón social (si es diferente al nombre comercial)"
            label="Nombre Legal"
            name="legalName"
          >
            <UInput
              v-model="businessForm.legalName"
              placeholder="Razón social de la empresa"
            />
          </UFormField>

          <USeparator/>

          <UFormField
            class="flex max-sm:flex-col justify-between items-start gap-4"
            description="Nombre completo del propietario o representante legal"
            label="Propietario"
            name="ownerName"
            required
          >
            <UInput
              v-model="businessForm.ownerName"
              placeholder="Nombre completo del propietario"
            />
          </UFormField>

          <USeparator/>

          <UFormField
            class="flex max-sm:flex-col justify-between items-start gap-4"
            description="RFC o identificación fiscal"
            label="RFC / ID Fiscal"
            name="taxId"
          >
            <UInput
              v-model="businessForm.taxId"
              placeholder="ABCD123456EF1"
            />
          </UFormField>

          <USeparator/>

          <UFormField
            class="flex max-sm:flex-col justify-between items-start gap-4"
            description="Teléfono principal del negocio"
            label="Teléfono"
            name="phone"
            required
          >
            <UInput
              v-model="businessForm.phone"
              placeholder="(333) 123-4567"
            />
          </UFormField>

          <USeparator/>

          <UFormField
            class="flex max-sm:flex-col justify-between items-start gap-4"
            description="Correo electrónico del negocio"
            label="Email"
            name="email"
            required
          >
            <UInput
              v-model="businessForm.email"
              placeholder="contacto@empresa.com"
              type="email"
            />
          </UFormField>
        </UPageCard>

        <!-- Business Details -->
        <UPageCard
          class="mb-6"
          description="Detalles específicos del negocio"
          title="Información del Negocio"
          variant="subtle"
        >
          <UFormField
            class="flex max-sm:flex-col justify-between items-start gap-4"
            description="Categoría principal del negocio"
            label="Categoría"
            name="category"
            required
          >
            <USelect
              v-model="businessForm.category"
              :items="businessCategoryOptions"
              placeholder="Seleccione una categoría"
            />
          </UFormField>

          <USeparator v-if="businessForm.category === 'OTHER'"/>

          <UFormField
            v-if="businessForm.category === 'OTHER'"
            class="flex max-sm:flex-col justify-between items-start gap-4"
            description="Especifique la categoría de su negocio"
            label="Categoría Personalizada"
            name="customCategory"
          >
            <UInput
              v-model="businessForm.customCategory"
              placeholder="Describa su categoría"
            />
          </UFormField>

          <USeparator/>

          <UFormField
            class="flex max-sm:flex-col justify-between items-start gap-4"
            description="Año de fundación del negocio"
            label="Año de Establecimiento"
            name="yearEstablished"
          >
            <UInput
              v-model.number="businessForm.yearEstablished"
              type="number"
              :min="1900"
              :max="new Date().getFullYear() + 2"
              placeholder="2020"
            />
          </UFormField>

          <USeparator/>

          <UFormField
            class="flex max-sm:flex-col justify-between items-start gap-4"
            description="Breve descripción del negocio"
            label="Descripción"
            name="description"
          >
            <UTextarea
              v-model="businessForm.description"
              :rows="3"
              placeholder="Describa su negocio..."
            />
          </UFormField>

          <USeparator/>

          <UFormField
            class="flex max-sm:flex-col justify-between items-start gap-4"
            description="Productos o servicios principales que ofrece"
            label="Productos/Servicios"
            name="productsServices"
          >
            <UTextarea
              v-model="businessForm.productsServices"
              :rows="3"
              placeholder="Liste sus productos o servicios principales..."
            />
          </UFormField>
        </UPageCard>

        <!-- Branding -->
        <UPageCard
          class="mb-6"
          description="Elementos de marca e identidad visual"
          title="Marca e Identidad"
          variant="subtle"
        >
          <UFormField
            class="flex max-sm:flex-col justify-between items-start gap-4"
            description="Frase representativa del negocio"
            label="Slogan"
            name="slogan"
          >
            <UInput
              v-model="businessForm.slogan"
              placeholder="Su slogan aquí"
            />
          </UFormField>

          <USeparator/>

          <UFormField
            class="flex max-sm:flex-col justify-between items-start gap-4"
            description="Misión o propósito del negocio"
            label="Declaración de Misión"
            name="missionStatement"
          >
            <UTextarea
              v-model="businessForm.missionStatement"
              :rows="3"
              placeholder="Nuestra misión es..."
            />
          </UFormField>

          <USeparator/>

          <UFormField
            class="flex max-sm:flex-col justify-between items-start gap-4"
            description="Color principal de la marca"
            label="Color Primario"
            name="primaryColor"
          >
            <div class="flex gap-2 items-center">
              <UInput
                v-model="businessForm.primaryColor"
                placeholder="#000000"
                class="font-mono"
              />
              <UPopover>
                <UButton color="neutral" variant="outline" size="sm" square>
                  <div
                    class="w-5 h-5 rounded border border-gray-300"
                    :style="{ backgroundColor: businessForm.primaryColor || '#ffffff' }"
                  />
                </UButton>
                <template #content>
                  <UColorPicker v-model="businessForm.primaryColor" />
                </template>
              </UPopover>
            </div>
          </UFormField>

          <USeparator/>

          <UFormField
            class="flex max-sm:flex-col justify-between items-start gap-4"
            description="Color secundario de la marca"
            label="Color Secundario"
            name="secondaryColor"
          >
            <div class="flex gap-2 items-center">
              <UInput
                v-model="businessForm.secondaryColor"
                placeholder="#000000"
                class="font-mono"
              />
              <UPopover>
                <UButton color="neutral" variant="outline" size="sm" square>
                  <div
                    class="w-5 h-5 rounded border border-gray-300"
                    :style="{ backgroundColor: businessForm.secondaryColor || '#ffffff' }"
                  />
                </UButton>
                <template #content>
                  <UColorPicker v-model="businessForm.secondaryColor" />
                </template>
              </UPopover>
            </div>
          </UFormField>

          <USeparator/>

          <UFormField
            class="flex max-sm:flex-col justify-between items-start gap-4"
            description="Colores adicionales de la paleta"
            label="Colores de Acento"
            name="additionalColors"
          >
            <div class="space-y-2 w-full">
              <div
                v-for="(color, index) in additionalColorsList"
                :key="index"
                class="flex gap-2 items-center"
              >
                <UInput
                  v-model="additionalColorsList[index]"
                  placeholder="#000000"
                  class="font-mono flex-1"
                />
                <UPopover>
                  <UButton color="neutral" variant="outline" size="sm" square>
                    <div
                      class="w-5 h-5 rounded border border-gray-300"
                      :style="{ backgroundColor: color || '#ffffff' }"
                    />
                  </UButton>
                  <template #content>
                    <UColorPicker v-model="additionalColorsList[index]" />
                  </template>
                </UPopover>
                <UButton
                  color="error"
                  icon="i-lucide-trash-2"
                  size="sm"
                  variant="ghost"
                  @click="removeAdditionalColor(index)"
                />
              </div>
              <UButton
                icon="i-lucide-plus"
                variant="outline"
                size="sm"
                @click="addAdditionalColor"
              >
                Agregar Color
              </UButton>
            </div>
          </UFormField>
        </UPageCard>

        <!-- Address -->
        <UPageCard
          class="mb-6"
          description="Ubicación física del establecimiento"
          title="Dirección del Negocio"
          variant="subtle"
        >
          <UFormField
            class="flex max-sm:flex-col justify-between items-start gap-4"
            description="Calle y número"
            label="Dirección"
            name="addresses[0].street"
            required
          >
            <UInput
              v-model="businessForm.addresses[0].street"
              placeholder="Av. Principal 123"
            />
          </UFormField>

          <USeparator/>

          <UFormField
            class="flex max-sm:flex-col justify-between items-start gap-4"
            description="Colonia, edificio, piso, etc."
            label="Dirección Línea 2"
            name="addresses[0].street2"
          >
            <UInput
              v-model="businessForm.addresses[0].street2"
              placeholder="Col. Centro, Piso 2"
            />
          </UFormField>

          <USeparator/>

          <UFormField
            class="flex max-sm:flex-col justify-between items-start gap-4"
            description="Ciudad"
            label="Ciudad"
            name="addresses[0].city"
            required
          >
            <UInput
              v-model="businessForm.addresses[0].city"
              placeholder="Guadalajara"
            />
          </UFormField>

          <USeparator/>

          <UFormField
            class="flex max-sm:flex-col justify-between items-start gap-4"
            description="Estado o provincia"
            label="Estado"
            name="addresses[0].state"
            required
          >
            <UInput
              v-model="businessForm.addresses[0].state"
              placeholder="Jalisco"
            />
          </UFormField>

          <USeparator/>

          <UFormField
            class="flex max-sm:flex-col justify-between items-start gap-4"
            description="Código postal"
            label="CP"
            name="addresses[0].zipCode"
            required
          >
            <UInput
              v-model="businessForm.addresses[0].zipCode"
              placeholder="44100"
            />
          </UFormField>

          <USeparator/>

          <UFormField
            class="flex max-sm:flex-col justify-between items-start gap-4"
            description="Referencias o indicaciones adicionales"
            label="Referencias"
            name="addresses[0].reference"
          >
            <UInput
              v-model="businessForm.addresses[0].reference"
              placeholder="Frente al parque central"
            />
          </UFormField>
        </UPageCard>

        <!-- Working Hours -->
        <UPageCard
          class="mb-6"
          description="Configure los horarios de operación"
          title="Horarios de Atención"
          variant="subtle"
        >
          <div class="space-y-4">
            <div
              v-for="(schedule, index) in schedules"
              :key="schedule.dayOfWeek"
              class="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <UFormField :label="dayLabels[schedule.dayOfWeek]">
                  <UToggle
                    v-model="schedule.isClosed"
                    off-label="Abierto"
                    on-label="Cerrado"
                  />
                </UFormField>

                <UFormField
                  v-if="!schedule.isClosed"
                  label="Hora Apertura"
                >
                  <UInput
                    v-model="schedule.openTime"
                    placeholder="09:00"
                    pattern="[0-9]{2}:[0-9]{2}"
                  />
                </UFormField>

                <UFormField
                  v-if="!schedule.isClosed"
                  label="Hora Cierre"
                >
                  <UInput
                    v-model="schedule.closeTime"
                    placeholder="18:00"
                    pattern="[0-9]{2}:[0-9]{2}"
                  />
                </UFormField>

                <div v-if="!schedule.isClosed" class="flex gap-2">
                  <UFormField label="Descanso" class="flex-1">
                    <div class="flex gap-1">
                      <UInput
                        v-model="schedule.breakStart"
                        placeholder="13:00"
                        size="sm"
                      />
                      <span class="text-gray-500 self-center">-</span>
                      <UInput
                        v-model="schedule.breakEnd"
                        placeholder="14:00"
                        size="sm"
                      />
                    </div>
                  </UFormField>
                </div>
              </div>
            </div>
          </div>
        </UPageCard>

        <!-- Social Media -->
        <UPageCard
          class="mb-6"
          description="Enlaces a redes sociales y plataformas digitales"
          title="Redes Sociales"
          variant="subtle"
        >
          <div class="space-y-4">
            <div
              v-for="(social, index) in socialMedia"
              :key="index"
              class="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <UFormField label="Plataforma">
                  <USelect
                    v-model="social.platform"
                    :items="socialPlatformOptions"
                    placeholder="Seleccionar"
                  />
                </UFormField>

                <UFormField label="URL">
                  <UInput
                    v-model="social.url"
                    placeholder="https://..."
                    type="url"
                  />
                </UFormField>

                <UFormField label="Usuario">
                  <div class="flex gap-2">
                    <UInput
                      v-model="social.username"
                      placeholder="@usuario"
                      class="flex-1"
                    />
                    <UButton
                      v-if="socialMedia.length > 1"
                      color="error"
                      icon="i-lucide-trash-2"
                      size="sm"
                      variant="ghost"
                      @click="removeSocialMedia(index)"
                    />
                  </div>
                </UFormField>
              </div>
            </div>

            <UButton
              class="w-full"
              icon="i-lucide-plus"
              variant="outline"
              @click="addSocialMedia"
            >
              Agregar Red Social
            </UButton>
          </div>
        </UPageCard>
      </UForm>
    </div>
  </UDashboardPanel>
</template>
