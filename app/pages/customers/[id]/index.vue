<script lang="ts" setup>
import { useApi } from '~/api'

const route = useRoute()
const api = useApi()
const toast = useToast()

const customerId = computed(() => route.params.id as string)

// Fetch customer data
const { data: customer, isLoading, error } = api.customers.getById(customerId.value)

// Status change modal state
const statusModalOpen = ref(false)

const openStatusModal = () => {
  statusModalOpen.value = true
}

// Handle errors
watchEffect(() => {
  if (error.value) {
    console.error('Failed to fetch customer:', error.value)
    toast.add({
      title: 'Error',
      description: 'Failed to load customer details',
      color: 'error',
      icon: 'i-lucide-x'
    })
  }
})

// Page meta
definePageMeta({
  title: 'Customer Details',
  description: 'View and manage customer information'
})
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Loading State -->
    <div v-if="isLoading" class="space-y-6">
      <div class="animate-pulse">
        <div class="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="h-32 bg-gray-200 rounded"></div>
          <div class="h-32 bg-gray-200 rounded"></div>
          <div class="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-12">
      <UIcon class="text-4xl text-red-500 mb-4" name="i-lucide-alert-triangle"/>
      <h2 class="text-xl font-semibold text-gray-900 mb-2">Customer Not Found</h2>
      <p class="text-gray-600 mb-4">The customer you're looking for doesn't exist or has been deleted.</p>
      <UButton
        color="primary"
        icon="i-lucide-arrow-left"
        label="Back to Customers"
        to="/customers"
      />
    </div>

    <!-- Customer Details -->
    <div v-else-if="customer" class="space-y-6">
      <!-- Header -->
      <div class="flex items-start justify-between">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <h1 class="text-2xl font-bold text-gray-900">
              {{ customer.businessProfile?.businessName || 'Unknown Business' }}
            </h1>
            <UBadge
              :color="{
                LEAD: 'blue',
                PROSPECT: 'yellow',
                ACTIVE: 'green',
                INACTIVE: 'gray',
                CHURNED: 'red'
              }[customer.status]"
              size="lg"
              variant="subtle"
            >
              {{ {
              LEAD: 'Prospecto',
              PROSPECT: 'Cliente Potencial',
              ACTIVE: 'Cliente Activo',
              INACTIVE: 'Inactivo',
              CHURNED: 'Perdido'
            }[customer.status] }}
            </UBadge>
          </div>
          <p class="text-gray-600">
            {{ customer.businessProfile?.legalName || customer.businessProfile?.businessName }}
          </p>
          <p class="text-sm text-gray-500">
            Cliente desde {{ new Date(customer.createdAt).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) }}
          </p>
        </div>

        <div class="flex items-center gap-3">
          <UButton
            color="neutral"
            icon="i-lucide-refresh-cw"
            label="Cambiar Estado"
            variant="outline"
            @click="openStatusModal"
          />
          <UButton
            color="primary"
            icon="i-lucide-edit"
            label="Editar"
            variant="outline"
          />
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <UPageCard
          :description="customer.status === 'ACTIVE' ? 'Cliente activo generando ingresos' : 'Estado del cliente en el pipeline'"
          title="Estado"
        >
          <template #icon>
            <UIcon
              :class="{
                LEAD: 'text-blue-500',
                PROSPECT: 'text-yellow-500',
                ACTIVE: 'text-green-500',
                INACTIVE: 'text-gray-500',
                CHURNED: 'text-red-500'
              }[customer.status]"
              :name="{
                LEAD: 'i-lucide-user-plus',
                PROSPECT: 'i-lucide-users',
                ACTIVE: 'i-lucide-user-check',
                INACTIVE: 'i-lucide-user-minus',
                CHURNED: 'i-lucide-user-x'
              }[customer.status]"
            />
          </template>
        </UPageCard>

        <UPageCard
          :description="`${customer.contacts?.length || 0} contacto(s) registrados`"
          title="Contactos"
        >
          <template #icon>
            <UIcon class="text-purple-500" name="i-lucide-contact"/>
          </template>
        </UPageCard>

        <UPageCard
          :description="customer.businessProfile?.category || 'No especificada'"
          title="Industria"
        >
          <template #icon>
            <UIcon class="text-indigo-500" name="i-lucide-building"/>
          </template>
        </UPageCard>

        <UPageCard
          :description="{
            MICRO: 'Micro (1-10 empleados)',
            SMALL: 'Pequeña (11-50 empleados)',
            MEDIUM: 'Mediana (51-250 empleados)',
            LARGE: 'Grande (251-1000 empleados)',
            ENTERPRISE: 'Empresa (1000+ empleados)'
          }[customer.businessProfile?.size || ''] || 'No especificado'"
          title="Tamaño"
        >
          <template #icon>
            <UIcon class="text-orange-500" name="i-lucide-users"/>
          </template>
        </UPageCard>
      </div>

      <!-- Main Content -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Business Information -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Business Details -->
          <UPageCard
            description="Detalles del negocio y datos fiscales"
            title="Información de la Empresa"
          >
            <div class="space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700">Nombre Legal</label>
                  <p class="text-gray-900">{{ customer.businessProfile?.legalName || 'No especificado' }}</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Propietario</label>
                  <p class="text-gray-900">{{ customer.businessProfile?.ownerName || 'No especificado' }}</p>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700">RFC / Tax ID</label>
                  <p class="text-gray-900">{{ customer.businessProfile?.taxId || 'No especificado' }}</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Sitio Web</label>
                  <p class="text-gray-900">
                    <a
                      v-if="customer.businessProfile?.website"
                      :href="customer.businessProfile.website"
                      class="text-blue-600 hover:underline"
                      target="_blank"
                    >
                      {{ customer.businessProfile.website }}
                    </a>
                    <span v-else>No especificado</span>
                  </p>
                </div>
              </div>

              <!-- Address -->
              <div v-if="customer.businessProfile?.addresses?.[0]">
                <label class="block text-sm font-medium text-gray-700 mb-2">Dirección Principal</label>
                <div class="bg-gray-50 rounded-lg p-3">
                  <p class="text-gray-900">{{ customer.businessProfile.addresses[0].street }}</p>
                  <p v-if="customer.businessProfile.addresses[0].street2" class="text-gray-700">
                    {{ customer.businessProfile.addresses[0].street2 }}
                  </p>
                  <p class="text-gray-700">
                    {{ customer.businessProfile.addresses[0].city }},
                    {{ customer.businessProfile.addresses[0].state }}
                    {{ customer.businessProfile.addresses[0].zipCode }}
                  </p>
                  <p class="text-gray-700">{{ customer.businessProfile.addresses[0].country }}</p>
                  <p v-if="customer.businessProfile.addresses[0].reference" class="text-sm text-gray-600 mt-1">
                    Ref: {{ customer.businessProfile.addresses[0].reference }}
                  </p>
                </div>
              </div>
            </div>
          </UPageCard>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Contact Information -->
          <UPageCard
            description="Personas de contacto principales"
            title="Contactos"
          >
            <div class="space-y-3">
              <div
                v-for="contact in customer.contacts?.filter(c => c.isPrimary)"
                :key="contact.id"
                class="bg-gray-50 rounded-lg p-3"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <p class="font-medium text-gray-900">
                      {{ contact.user?.firstName }} {{ contact.user?.lastName }}
                    </p>
                    <p v-if="contact.position" class="text-sm text-gray-600">{{ contact.position }}</p>
                  </div>
                  <UBadge v-if="contact.isPrimary" color="primary" size="sm">
                    Principal
                  </UBadge>
                </div>
                <div class="mt-2 space-y-1">
                  <p class="text-sm text-gray-700">
                    <UIcon class="inline w-4 h-4 mr-1" name="i-lucide-mail"/>
                    {{ contact.user?.email }}
                  </p>
                  <p v-if="customer.businessProfile?.phone" class="text-sm text-gray-700">
                    <UIcon class="inline w-4 h-4 mr-1" name="i-lucide-phone"/>
                    {{ customer.businessProfile.phone }}
                  </p>
                </div>
              </div>

              <div v-if="!customer.contacts?.length" class="text-center py-4 text-gray-500">
                No hay contactos registrados
              </div>
            </div>
          </UPageCard>

          <!-- Customer Source -->
          <UPageCard
            v-if="customer.source"
            :description="`Cliente adquirido vía ${customer.source}`"
            title="Fuente de Adquisición"
          >
            <div class="flex items-center gap-2">
              <UIcon
                :name="{
                  website: 'i-lucide-globe',
                  cold_visit: 'i-lucide-map-pin',
                  referral: 'i-lucide-users',
                  social_media: 'i-lucide-share-2',
                  google_ads: 'i-lucide-search',
                  facebook_ads: 'i-lucide-facebook',
                  linkedin: 'i-lucide-linkedin',
                  event: 'i-lucide-calendar',
                  cold_call: 'i-lucide-phone',
                  email_marketing: 'i-lucide-mail',
                  partner: 'i-lucide-handshake',
                  other: 'i-lucide-help-circle'
                }[customer.source] || 'i-lucide-help-circle'"
                class="text-blue-500"
              />
              <span class="capitalize">{{ customer.source.replace('_', ' ') }}</span>
            </div>
          </UPageCard>
        </div>
      </div>
    </div>

    <!-- Status Change Modal -->
    <CustomersStatusModal
      v-if="customer"
      v-model:open="statusModalOpen"
      :customer="customer"
      @status-changed="onStatusChanged"
    />
  </div>
</template>
