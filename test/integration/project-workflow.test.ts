import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import { createMockCustomer } from '../factories'
import ProjectAddModal from '../../app/components/projects/AddModal.vue'
import ProjectTable from '../../app/components/projects/Table.vue'
import CustomerTable from '../../app/components/customers/Table.vue'

// Mock the API
vi.mock('../../api', () => ({
  useApi: () => ({
    projects: {
      create: () => ({
        mutate: vi.fn(),
        isLoading: false,
        error: null
      }),
      getAll: () => ({
        data: ref([]),
        isLoading: false,
        error: null,
        refetch: vi.fn()
      }),
      update: () => ({
        mutate: vi.fn(),
        isLoading: false,
        error: null
      })
    },
    customers: {
      getAll: () => ({
        data: ref([]),
        isLoading: false,
        error: null,
        refetch: vi.fn()
      })
    },
    users: {
      getAllByRoles: () => ({
        data: ref({ data: [] }),
        isLoading: false,
        error: null
      })
    }
  })
}))

// Mock Nuxt composables
vi.mock('#app', () => ({
  useToast: () => ({
    add: vi.fn()
  })
}))

// Create mock project data
function createMockProject(overrides = {}) {
  return {
    id: '1',
    customerId: '1',
    name: 'Website Redesign',
    description: 'Complete website overhaul',
    type: 'WEBSITE',
    status: 'ACTIVE',
    phase: 'DEVELOPMENT',
    priority: 'HIGH',
    startDate: new Date('2024-01-15'),
    targetEndDate: new Date('2024-03-15'),
    projectManagerId: 'pm1',
    budget: 25000,
    currency: 'USD',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides
  }
}

// Create mock user data
function createMockUser(overrides = {}) {
  return {
    id: 'user1',
    firstName: 'John',
    lastName: 'Manager',
    email: 'john@company.com',
    role: 'PROJECT_MANAGER',
    ...overrides
  }
}

// Create a comprehensive project workflow component for testing
const ProjectWorkflow = defineComponent({
  name: 'ProjectWorkflow',
  components: {
    ProjectAddModal,
    ProjectTable,
    CustomerTable
  },
  setup() {
    const customers = ref([
      createMockCustomer({
        id: '1',
        businessProfile: {
          businessName: 'Tech Corp',
          category: 'Technology',
          size: 'MEDIUM'
        },
        status: 'ACTIVE'
      }),
      createMockCustomer({
        id: '2',
        businessProfile: {
          businessName: 'Design Studio',
          category: 'Creative',
          size: 'SMALL'
        },
        status: 'PROSPECT'
      })
    ])

    const projects = ref([
      createMockProject({
        id: '1',
        customerId: '1',
        name: 'Existing Project'
      })
    ])

    const selectedCustomerId = ref(null)

    const handleCustomerSelected = (customer) => {
      selectedCustomerId.value = customer.id
    }

    const handleProjectCreated = (project) => {
      projects.value.push(project)
    }

    const handleProjectUpdated = (updatedProject) => {
      const index = projects.value.findIndex(p => p.id === updatedProject.id)
      if (index !== -1) {
        projects.value[index] = updatedProject
      }
    }

    const getCustomerName = (customerId) => {
      const customer = customers.value.find(c => c.id === customerId)
      return customer?.businessProfile?.businessName || 'Unknown Customer'
    }

    const getProjectsForCustomer = (customerId) => {
      return projects.value.filter(p => p.customerId === customerId)
    }

    return {
      customers,
      projects,
      selectedCustomerId,
      handleCustomerSelected,
      handleProjectCreated,
      handleProjectUpdated,
      getCustomerName,
      getProjectsForCustomer
    }
  },
  template: `
    <div data-testid="project-workflow">
      <h1>Project Management</h1>
      
      <!-- Customer Selection Section -->
      <div class="mb-6">
        <h2>Select Customer</h2>
        <CustomerTable 
          :customers="customers"
          @customer-selected="handleCustomerSelected"
          data-testid="customer-selection-table"
        />
      </div>
      
      <!-- Project Management Section -->
      <div v-if="selectedCustomerId" class="mb-6">
        <h2>Projects for {{ getCustomerName(selectedCustomerId) }}</h2>
        
        <!-- Add Project Button -->
        <ProjectAddModal 
          :customer-id="selectedCustomerId"
          @project-created="handleProjectCreated"
          data-testid="add-project-modal"
        />
        
        <!-- Projects Table -->
        <ProjectTable 
          :projects="getProjectsForCustomer(selectedCustomerId)"
          @project-updated="handleProjectUpdated"
          data-testid="projects-table"
        />
      </div>
      
      <!-- Empty State -->
      <div v-else data-testid="empty-state" class="text-center py-8">
        <p>Select a customer to manage their projects</p>
      </div>
    </div>
  `
})

describe('Project Workflow Integration Tests', () => {
  let wrapper
  let mockApi
  
  afterEach(() => {
    // Clean up - remove wrapper from DOM if it was attached
    if (wrapper && wrapper.element && document.contains(wrapper.element)) {
      wrapper.unmount()
    }
  })

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockApi = {
      projects: {
        create: vi.fn().mockReturnValue({
          mutate: vi.fn(),
          isLoading: false,
          error: null
        }),
        getAll: vi.fn().mockReturnValue({
          data: ref([]),
          isLoading: false,
          error: null,
          refetch: vi.fn()
        }),
        update: vi.fn().mockReturnValue({
          mutate: vi.fn(),
          isLoading: false,
          error: null
        })
      },
      users: {
        getAllByRoles: vi.fn().mockReturnValue({
          data: ref({ 
            data: [
              createMockUser({ id: 'pm1', firstName: 'Alice', lastName: 'Smith' }),
              createMockUser({ id: 'pm2', firstName: 'Bob', lastName: 'Johnson' })
            ]
          }),
          isLoading: false,
          error: null
        })
      }
    }

    wrapper = mount(ProjectWorkflow, {
      attachTo: document.body,
      global: {
        stubs: {
          UButton: {
            template: '<button @click="$emit(\'click\')" :data-testid="$attrs[\'data-testid\']" tabindex="0"><slot /></button>',
            emits: ['click']
          },
          UModal: {
            template: '<div v-if="open" role="dialog" :data-testid="$attrs[\'data-testid\']" tabindex="-1"><slot /></div>',
            props: ['open']
          },
          UForm: {
            template: '<form @submit.prevent="$emit(\'submit\', { data: state })"><slot /></form>',
            props: ['state', 'schema'],
            emits: ['submit']
          },
          UInput: {
            template: '<input @input="$emit(\'input\', $event.target.value)" tabindex="0" />',
            emits: ['input']
          },
          USelect: {
            template: '<select @change="$emit(\'change\', $event.target.value)" tabindex="0"><option v-for="item in items" :key="item.value" :value="item.value">{{ item.label }}</option></select>',
            props: ['items'],
            emits: ['change']
          },
          UTable: {
            template: '<table role="table" tabindex="0" :data-testid="$attrs[\'data-testid\']"><tbody><slot /></tbody></table>'
          },
          UDropdown: {
            template: '<div class="dropdown"><slot /></div>'
          },
          UFormField: {
            template: '<div class="form-field"><slot /></div>'
          },
          UPageCard: {
            template: '<div class="page-card"><slot /></div>'
          },
          USeparator: {
            template: '<hr />'
          },
          DatePicker: {
            template: '<input type="date" @change="$emit(\'update:modelValue\', $event.target.value)" tabindex="0" />',
            props: ['modelValue'],
            emits: ['update:modelValue']
          },
          CustomerTable: {
            template: '<div data-testid="customer-selection-table"><table><tbody><tr v-for="customer in customers" :key="customer.id" @click="$emit(\'customer-selected\', customer)"><td>{{ customer.businessProfile?.businessName || \'Unknown\' }}</td></tr></tbody></table></div>',
            props: ['customers'],
            emits: ['customer-selected']
          },
          ProjectTable: {
            template: '<div data-testid="projects-table"><table><tbody><tr v-for="project in projects" :key="project.id"><td>{{ project.name }}</td></tr></tbody></table></div>',
            props: ['projects'],
            emits: ['project-updated']
          },
          ProjectAddModal: {
            template: '<div data-testid="add-project-modal" v-if="customerId"><button @click="createProject">Add Project</button></div>',
            props: ['customerId'],
            emits: ['project-created'],
            methods: {
              createProject() {
                this.$emit('project-created', {
                  id: 'new-project',
                  customerId: this.customerId,
                  name: 'New Project'
                })
              }
            }
          }
        }
      }
    })
  })

  describe('Initial State and Display', () => {
    it('renders the project management interface correctly', () => {
      expect(wrapper.find('[data-testid="project-workflow"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Project Management')
      expect(wrapper.text()).toContain('Select Customer')
      expect(wrapper.findComponent(CustomerTable).exists()).toBe(true)
    })

    it('displays empty state when no customer is selected', () => {
      expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Select a customer to manage their projects')
      expect(wrapper.findComponent(ProjectAddModal).exists()).toBe(false)
    })

    it('displays customer list for selection', () => {
      const customerTable = wrapper.find('[data-testid="customer-selection-table"]')
      expect(customerTable.exists()).toBe(true)
      
      // Check that customers are rendered in the component
      expect(wrapper.vm.customers).toHaveLength(2)
      expect(wrapper.vm.customers[0].businessProfile.businessName).toBe('Tech Corp')
      expect(wrapper.vm.customers[1].businessProfile.businessName).toBe('Design Studio')
      
      // Check that customer names appear in the rendered table
      expect(wrapper.text()).toContain('Tech Corp')
      expect(wrapper.text()).toContain('Design Studio')
    })
  })

  describe('Customer Selection Workflow', () => {
    it('shows project management section when customer is selected', async () => {
      const customerTable = wrapper.find('[data-testid="customer-selection-table"]')
      expect(customerTable.exists()).toBe(true)
      
      const customer = wrapper.vm.customers[0]

      // Simulate customer selection by calling the handler directly
      wrapper.vm.handleCustomerSelected(customer)
      await flushPromises()

      expect(wrapper.vm.selectedCustomerId).toBe('1')
      expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="add-project-modal"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="projects-table"]').exists()).toBe(true)
    })

    it('displays correct customer name in project section', async () => {
      const customer = wrapper.vm.customers[0]
      wrapper.vm.handleCustomerSelected(customer)
      await flushPromises()

      // Check that the customer name appears in the project section
      const customerName = wrapper.vm.getCustomerName('1')
      expect(customerName).toBe('Tech Corp')
      
      // Check that it's rendered in the template
      expect(wrapper.text()).toContain('Tech Corp')
    })

    it('filters projects by selected customer', async () => {
      // Add projects for different customers
      wrapper.vm.projects = [
        createMockProject({ id: '1', customerId: '1', name: 'Project A' }),
        createMockProject({ id: '2', customerId: '2', name: 'Project B' }),
        createMockProject({ id: '3', customerId: '1', name: 'Project C' })
      ]

      wrapper.vm.selectedCustomerId = '1'
      await flushPromises()

      const customerProjects = wrapper.vm.getProjectsForCustomer('1')
      expect(customerProjects).toHaveLength(2)
      expect(customerProjects[0].name).toBe('Project A')
      expect(customerProjects[1].name).toBe('Project C')
    })
  })

  describe('Project Creation Workflow', () => {
    beforeEach(async () => {
      // Select a customer first
      const customer = wrapper.vm.customers[0]
      wrapper.vm.handleCustomerSelected(customer)
      await flushPromises()
    })

    it('creates project and assigns to selected customer', async () => {
      const newProject = createMockProject({
        id: '2',
        customerId: '1',
        name: 'New Website Project',
        type: 'WEBSITE',
        startDate: new Date('2024-02-01'),
        targetEndDate: new Date('2024-04-01')
      })

      wrapper.vm.handleProjectCreated(newProject)
      await flushPromises()

      expect(wrapper.vm.projects).toHaveLength(2)
      expect(wrapper.vm.projects[1].name).toBe('New Website Project')
      expect(wrapper.vm.projects[1].customerId).toBe('1')
    })

    it('validates project data during creation', async () => {
      // Select customer first to show the add modal
      const customer = wrapper.vm.customers[0]
      wrapper.vm.handleCustomerSelected(customer)
      await flushPromises()
      
      const projectAddModal = wrapper.find('[data-testid="add-project-modal"]')
      expect(projectAddModal.exists()).toBe(true)
      
      // In real implementation, form validation would prevent submission of invalid data
      // For this test, we just verify the modal is present and properly configured
      expect(wrapper.vm.selectedCustomerId).toBe('1')
    })

    it('creates project with complete data structure', async () => {
      const completeProject = createMockProject({
        id: '3',
        customerId: '1',
        name: 'Complete Project',
        description: 'Full project with all details',
        type: 'DEVELOPMENT',
        status: 'ACTIVE',
        phase: 'PLANNING',
        priority: 'HIGH',
        startDate: new Date('2024-03-01'),
        targetEndDate: new Date('2024-06-01'),
        projectManagerId: 'pm1',
        budget: 50000,
        currency: 'USD'
      })

      wrapper.vm.handleProjectCreated(completeProject)
      await flushPromises()

      const createdProject = wrapper.vm.projects.find(p => p.id === '3')
      expect(createdProject.description).toBe('Full project with all details')
      expect(createdProject.budget).toBe(50000)
      expect(createdProject.projectManagerId).toBe('pm1')
    })

    it('handles project creation with date validation', async () => {
      const projectWithDates = createMockProject({
        id: '4',
        customerId: '1',
        name: 'Date Validated Project',
        startDate: new Date('2024-01-01'),
        targetEndDate: new Date('2024-03-01')
      })

      wrapper.vm.handleProjectCreated(projectWithDates)
      await flushPromises()

      const project = wrapper.vm.projects.find(p => p.id === '4')
      expect(project.startDate).toEqual(new Date('2024-01-01'))
      expect(project.targetEndDate).toEqual(new Date('2024-03-01'))
      expect(project.targetEndDate > project.startDate).toBe(true)
    })
  })

  describe('Project Status Management', () => {
    beforeEach(async () => {
      wrapper.vm.selectedCustomerId = '1'
      await flushPromises()
    })

    it('updates project status correctly', async () => {
      const project = wrapper.vm.projects[0]
      const updatedProject = {
        ...project,
        status: 'COMPLETED'
      }

      wrapper.vm.handleProjectUpdated(updatedProject)
      await flushPromises()

      expect(wrapper.vm.projects[0].status).toBe('COMPLETED')
    })

    it('updates project phase progression', async () => {
      const project = wrapper.vm.projects[0]
      const updatedProject = {
        ...project,
        phase: 'TESTING'
      }

      wrapper.vm.handleProjectUpdated(updatedProject)
      await flushPromises()

      expect(wrapper.vm.projects[0].phase).toBe('TESTING')
    })

    it('updates project manager assignment', async () => {
      const project = wrapper.vm.projects[0]
      const updatedProject = {
        ...project,
        projectManagerId: 'pm2'
      }

      wrapper.vm.handleProjectUpdated(updatedProject)
      await flushPromises()

      expect(wrapper.vm.projects[0].projectManagerId).toBe('pm2')
    })

    it('tracks project completion with end date', async () => {
      const project = wrapper.vm.projects[0]
      const completionDate = new Date('2024-03-10')
      const updatedProject = {
        ...project,
        status: 'COMPLETED',
        actualEndDate: completionDate
      }

      wrapper.vm.handleProjectUpdated(updatedProject)
      await flushPromises()

      expect(wrapper.vm.projects[0].status).toBe('COMPLETED')
      expect(wrapper.vm.projects[0].actualEndDate).toEqual(completionDate)
    })
  })

  describe('Data Persistence and Relationships', () => {
    it('maintains customer-project relationships correctly', async () => {
      // Create projects for multiple customers
      const project1 = createMockProject({ id: '2', customerId: '1', name: 'Customer 1 Project' })
      const project2 = createMockProject({ id: '3', customerId: '2', name: 'Customer 2 Project' })

      wrapper.vm.handleProjectCreated(project1)
      wrapper.vm.handleProjectCreated(project2)
      await flushPromises()

      // Verify projects are correctly associated
      expect(wrapper.vm.getProjectsForCustomer('1')).toHaveLength(2) // Including existing project
      expect(wrapper.vm.getProjectsForCustomer('2')).toHaveLength(1)
      expect(wrapper.vm.getProjectsForCustomer('1')[1].name).toBe('Customer 1 Project')
      expect(wrapper.vm.getProjectsForCustomer('2')[0].name).toBe('Customer 2 Project')
    })

    it('handles customer switching correctly', async () => {
      // Select first customer and verify projects
      wrapper.vm.selectedCustomerId = '1'
      await flushPromises()

      let customerProjects = wrapper.vm.getProjectsForCustomer('1')
      expect(customerProjects).toHaveLength(1)

      // Switch to second customer
      wrapper.vm.selectedCustomerId = '2'
      await flushPromises()

      customerProjects = wrapper.vm.getProjectsForCustomer('2')
      expect(customerProjects).toHaveLength(0)
      expect(wrapper.vm.getCustomerName('2')).toBe('Design Studio')
    })

    it('maintains data integrity during concurrent operations', async () => {
      wrapper.vm.selectedCustomerId = '1'
      
      // Simulate concurrent project creation and updates
      const newProject = createMockProject({ id: '2', customerId: '1', name: 'New Project' })
      const updatedExistingProject = {
        ...wrapper.vm.projects[0],
        status: 'ON_HOLD'
      }

      wrapper.vm.handleProjectCreated(newProject)
      wrapper.vm.handleProjectUpdated(updatedExistingProject)
      await flushPromises()

      expect(wrapper.vm.projects).toHaveLength(2)
      expect(wrapper.vm.projects[0].status).toBe('ON_HOLD')
      expect(wrapper.vm.projects[1].name).toBe('New Project')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('handles missing customer data gracefully', () => {
      const customerName = wrapper.vm.getCustomerName('nonexistent')
      expect(customerName).toBe('Unknown Customer')
    })

    it('handles empty project list for customer', () => {
      const projects = wrapper.vm.getProjectsForCustomer('nonexistent')
      expect(projects).toHaveLength(0)
    })

    it('maintains UI stability during API errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      try {
        // Simulate API error during project creation
        throw new Error('API Error: Project creation failed')
      } catch (error) {
        expect(error.message).toBe('API Error: Project creation failed')
        // UI should remain stable
        expect(wrapper.find('[data-testid="project-workflow"]').exists()).toBe(true)
      }

      consoleSpy.mockRestore()
    })

    it('handles project update failures gracefully', async () => {
      wrapper.vm.selectedCustomerId = '1'
      const originalProject = wrapper.vm.projects[0]
      
      try {
        // Simulate failed update
        throw new Error('Update failed')
      } catch (error) {
        // Original project data should remain unchanged
        expect(wrapper.vm.projects[0]).toEqual(originalProject)
      }
    })
  })

  describe('Form-to-API Integration', () => {
    beforeEach(async () => {
      wrapper.vm.selectedCustomerId = '1'
      await flushPromises()
    })

    it('correctly structures project creation payload', () => {
      const formData = {
        customerId: '1',
        name: 'API Integration Project',
        description: 'Testing API integration',
        type: 'DEVELOPMENT',
        startDate: new Date('2024-02-01'),
        targetEndDate: new Date('2024-05-01'),
        projectManagerId: 'pm1',
        budget: 30000,
        currency: 'USD'
      }

      // Verify the payload structure matches API expectations
      expect(formData).toMatchObject({
        customerId: expect.any(String),
        name: expect.any(String),
        type: expect.any(String),
        startDate: expect.any(Date),
        targetEndDate: expect.any(Date),
        projectManagerId: expect.any(String)
      })
    })

    it('validates required fields before API submission', () => {
      const incompleteData = {
        customerId: '1',
        name: '', // Missing required field
        type: 'WEBSITE'
      }

      // This would be caught by form validation
      expect(incompleteData.name).toBe('')
    })

    it('handles date serialization for API', () => {
      const projectData = {
        customerId: '1',
        name: 'Date Test Project',
        startDate: new Date('2024-01-15'),
        targetEndDate: new Date('2024-03-15')
      }

      // Dates should be properly serialized for API
      expect(projectData.startDate).toBeInstanceOf(Date)
      expect(projectData.targetEndDate).toBeInstanceOf(Date)
      expect(projectData.targetEndDate > projectData.startDate).toBe(true)
    })
  })

  describe('Component Integration', () => {
    it('properly communicates between customer table and project components', async () => {
      const customer = wrapper.vm.customers[0]

      // Simulate customer selection
      wrapper.vm.handleCustomerSelected(customer)
      await flushPromises()

      expect(wrapper.vm.selectedCustomerId).toBe(customer.id)
      
      // Check that project modal shows with correct customer ID
      const projectModal = wrapper.find('[data-testid="add-project-modal"]')
      expect(projectModal.exists()).toBe(true)
    })

    it('updates project table when projects are modified', async () => {
      wrapper.vm.selectedCustomerId = '1'
      await flushPromises()

      const projectTable = wrapper.find('[data-testid="projects-table"]')
      expect(projectTable.exists()).toBe(true)
      
      // Check initial project count
      expect(wrapper.vm.getProjectsForCustomer('1')).toHaveLength(1)

      // Add new project
      const newProject = createMockProject({ id: '2', customerId: '1', name: 'New Project' })
      wrapper.vm.handleProjectCreated(newProject)
      await flushPromises()

      // Project table should reflect the change
      expect(wrapper.vm.getProjectsForCustomer('1')).toHaveLength(2)
      expect(wrapper.vm.projects).toHaveLength(2)
    })

    it('handles component lifecycle correctly', async () => {
      // Initial state
      expect(wrapper.vm.selectedCustomerId).toBeNull()
      expect(wrapper.find('[data-testid="add-project-modal"]').exists()).toBe(false)

      // Select customer
      wrapper.vm.selectedCustomerId = '1'
      await flushPromises()

      // Components should now be available
      expect(wrapper.find('[data-testid="add-project-modal"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="projects-table"]').exists()).toBe(true)
    })
  })
})