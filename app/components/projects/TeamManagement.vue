<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold">Team Members</h3>
        <p class="text-sm text-gray-600">Manage project team assignments</p>
      </div>
      <UButton
        icon="i-lucide-user-plus"
        label="Add Member"
        @click="openAddModal"
      />
    </div>

    <!-- Project Manager -->
    <div class="border rounded-lg p-4">
      <div class="flex items-center justify-between mb-3">
        <h4 class="font-medium flex items-center gap-2">
          <Icon name="i-lucide-user-check" class="h-4 w-4" />
          Project Manager
        </h4>
        <UButton
          size="sm"
          variant="ghost"
          icon="i-lucide-edit-2"
          @click="openManagerModal"
        />
      </div>
      <div v-if="projectManager" class="flex items-center gap-3">
        <UAvatar
          :alt="`${projectManager.firstName} ${projectManager.lastName}`"
          size="sm"
        />
        <div>
          <p class="font-medium">{{ projectManager.firstName }} {{ projectManager.lastName }}</p>
          <p class="text-sm text-gray-600">{{ projectManager.email }}</p>
        </div>
        <UBadge color="primary" variant="subtle">Manager</UBadge>
      </div>
      <div v-else class="text-gray-500 text-sm">
        No project manager assigned
      </div>
    </div>

    <!-- Team Members List -->
    <div class="border rounded-lg">
      <div class="p-4 border-b bg-gray-50">
        <h4 class="font-medium flex items-center gap-2">
          <Icon name="i-lucide-users" class="h-4 w-4" />
          Team Members ({{ teamMembers.length }})
        </h4>
      </div>
      
      <div v-if="isLoadingTeam" class="p-8 text-center">
        <UButton loading variant="ghost">Loading team members...</UButton>
      </div>
      
      <div v-else-if="teamMembers.length === 0" class="p-8 text-center text-gray-500">
        <Icon name="i-lucide-user-x" class="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No team members assigned</p>
        <p class="text-sm">Click "Add Member" to start building your team</p>
      </div>
      
      <div v-else class="divide-y">
        <div 
          v-for="member in teamMembers" 
          :key="member.id"
          class="p-4 flex items-center justify-between hover:bg-gray-50"
        >
          <div class="flex items-center gap-3">
            <UAvatar
              :alt="`${member.user.firstName} ${member.user.lastName}`"
              size="sm"
            />
            <div>
              <p class="font-medium">{{ member.user.firstName }} {{ member.user.lastName }}</p>
              <p class="text-sm text-gray-600">{{ member.user.email }}</p>
            </div>
          </div>
          
          <div class="flex items-center gap-3">
            <UBadge 
              :color="getRoleBadgeColor(member.role)"
              variant="subtle"
            >
              {{ member.role }}
            </UBadge>
            <div class="text-sm text-gray-500">
              Joined {{ formatDate(member.joinedAt) }}
            </div>
            <UDropdown :items="getTeamMemberActions(member)">
              <UButton
                icon="i-lucide-more-horizontal"
                size="sm"
                color="neutral"
                variant="ghost"
              />
            </UDropdown>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Team Member Modal -->
    <UModal
      v-model:open="showAddModal"
      title="Add Team Member"
      description="Assign a user to this project"
    >
      <div class="space-y-4">
        <UFormField
          label="Team Member"
          name="userId"
          required
        >
          <USelect
            v-model="newMember.userId"
            :options="availableUsers"
            placeholder="Select a user"
            :loading="isLoadingUsers"
          />
        </UFormField>
        
        <UFormField
          label="Role"
          name="role"
          required
        >
          <UInput
            v-model="newMember.role"
            placeholder="e.g., Developer, Designer, QA"
          />
        </UFormField>
      </div>

      <template #footer>
        <div class="flex justify-end space-x-2">
          <UButton
            color="neutral"
            variant="subtle"
            @click="cancelAdd"
          >
            Cancel
          </UButton>
          <UButton
            :loading="isAddingMember"
            :disabled="!newMember.userId || !newMember.role"
            @click="addTeamMember"
          >
            Add Member
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Change Manager Modal -->
    <UModal
      v-model:open="showManagerModal"
      title="Change Project Manager"
      description="Assign a new project manager"
    >
      <div class="space-y-4">
        <UFormField
          label="New Project Manager"
          name="managerId"
          required
        >
          <USelect
            v-model="newManagerId"
            :options="availableManagers"
            placeholder="Select a project manager"
            :loading="isLoadingUsers"
          />
        </UFormField>
      </div>

      <template #footer>
        <div class="flex justify-end space-x-2">
          <UButton
            color="neutral"
            variant="subtle"
            @click="showManagerModal = false"
          >
            Cancel
          </UButton>
          <UButton
            :loading="isUpdatingManager"
            :disabled="!newManagerId"
            @click="updateProjectManager"
          >
            Update Manager
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script lang="ts" setup>
import { format } from 'date-fns'
import type { ProjectTeamMemberDTO } from '~~/dto/project'
import type { ProjectDTO } from '~~/dto/project'
import { useApi } from '~/api'

interface Props {
  projectId: string
  project: ProjectDTO
}

interface Emits {
  updated: []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const api = useApi()
const toast = useToast()

// State
const showAddModal = ref(false)
const showManagerModal = ref(false)
const isAddingMember = ref(false)
const isUpdatingManager = ref(false)
const newMember = ref({ userId: '', role: '' })
const newManagerId = ref('')

// Data fetching
const { data: teamMembers, isLoading: isLoadingTeam, refetch: refetchTeam } = api.projects.getTeamMembers({ projectId: props.projectId })
const { data: usersData, isLoading: isLoadingUsers } = api.users.getAllByRoles({ 
  pageIndex: 1, 
  pageSize: 100, 
  roles: ['PROJECT_MANAGER', 'DEVELOPER', 'DESIGNER'] 
})

// Computed
const projectManager = computed(() => props.project.projectManager)

const availableUsers = computed(() => {
  if (!usersData.value?.data) return []
  
  // Exclude users who are already team members
  const teamMemberIds = new Set(teamMembers.value?.map(m => m.userId) || [])
  teamMemberIds.add(props.project.projectManager.id) // Also exclude current PM
  
  return usersData.value.data
    .filter(user => !teamMemberIds.has(user.id) && user.isActive)
    .map(user => ({
      label: `${user.firstName} ${user.lastName}`,
      value: user.id
    }))
})

const availableManagers = computed(() => {
  if (!usersData.value?.data) return []
  
  return usersData.value.data
    .filter(user => user.role === 'PROJECT_MANAGER' && user.isActive)
    .map(user => ({
      label: `${user.firstName} ${user.lastName}`,
      value: user.id
    }))
})

// Methods
const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'MMM d, yyyy')
}

const getRoleBadgeColor = (role: string) => {
  const roleColors: Record<string, string> = {
    'Developer': 'blue',
    'Designer': 'purple',
    'QA': 'green',
    'Tester': 'green',
    'DevOps': 'orange',
    'Analyst': 'yellow'
  }
  return roleColors[role] || 'gray'
}

const getTeamMemberActions = (member: ProjectTeamMemberDTO) => {
  return [[
    {
      label: 'Remove from project',
      icon: 'i-lucide-user-minus',
      color: 'red',
      click: () => removeTeamMember(member)
    }
  ]]
}

const openAddModal = () => {
  showAddModal.value = true
  newMember.value = { userId: '', role: '' }
}

const openManagerModal = () => {
  showManagerModal.value = true
  newManagerId.value = props.project.projectManager.id
}

const cancelAdd = () => {
  showAddModal.value = false
  newMember.value = { userId: '', role: '' }
}

const addTeamMember = async () => {
  if (!newMember.value.userId || !newMember.value.role) return

  isAddingMember.value = true

  try {
    await api.projects.addTeamMember().mutateAsync({
      projectId: props.projectId,
      userId: newMember.value.userId,
      role: newMember.value.role
    })

    toast.add({
      title: 'Member Added',
      description: 'Team member has been added to the project',
      color: 'success',
      icon: 'i-lucide-user-plus'
    })

    showAddModal.value = false
    refetchTeam()
    emit('updated')
  } catch (error) {
    console.error('Failed to add team member:', error)
    
    toast.add({
      title: 'Failed to Add Member',
      description: error instanceof Error ? error.message : 'Unknown error occurred',
      color: 'error',
      icon: 'i-lucide-x'
    })
  } finally {
    isAddingMember.value = false
  }
}

const removeTeamMember = async (member: ProjectTeamMemberDTO) => {
  try {
    await api.projects.removeTeamMember().mutateAsync({
      projectId: props.projectId,
      userId: member.userId
    })

    toast.add({
      title: 'Member Removed',
      description: `${member.user.firstName} ${member.user.lastName} has been removed from the project`,
      color: 'success',
      icon: 'i-lucide-user-minus'
    })

    refetchTeam()
    emit('updated')
  } catch (error) {
    console.error('Failed to remove team member:', error)
    
    toast.add({
      title: 'Failed to Remove Member',
      description: error instanceof Error ? error.message : 'Unknown error occurred',
      color: 'error',
      icon: 'i-lucide-x'
    })
  }
}

const updateProjectManager = async () => {
  if (!newManagerId.value || newManagerId.value === props.project.projectManager.id) {
    showManagerModal.value = false
    return
  }

  isUpdatingManager.value = true

  try {
    await api.projects.update().mutateAsync({
      id: props.projectId,
      projectManagerId: newManagerId.value
    })

    toast.add({
      title: 'Manager Updated',
      description: 'Project manager has been updated',
      color: 'success',
      icon: 'i-lucide-user-check'
    })

    showManagerModal.value = false
    emit('updated')
  } catch (error) {
    console.error('Failed to update project manager:', error)
    
    toast.add({
      title: 'Failed to Update Manager',
      description: error instanceof Error ? error.message : 'Unknown error occurred',
      color: 'error',
      icon: 'i-lucide-x'
    })
  } finally {
    isUpdatingManager.value = false
  }
}
</script>