import { MySqlContainer } from '@testcontainers/mysql'
import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

export class TestDatabase {
  private static _instance: TestDatabase
  private _container?: MySqlContainer
  private _prismaClient?: PrismaClient
  private _connectionString?: string

  private constructor() {}

  static async getInstance(): Promise<TestDatabase> {
    if (!this._instance) {
      this._instance = new TestDatabase()
      await this._instance.init()
    }
    return this._instance
  }

  async init(): Promise<void> {
    // Start MySQL testcontainer
    this._container = await new MySqlContainer('mysql:8.0')
      .withReuse()
      .start()

    // Get connection string
    this._connectionString = this._container.getConnectionUri()

    // Update env with test database URL
    process.env.TEST_DATABASE_URL = this._connectionString

    // Push schema to test database (since we don't have migrations)
    try {
      execSync('npx prisma db push --accept-data-loss', { 
        env: { ...process.env, DATABASE_URL: this._connectionString },
        stdio: 'ignore' // Suppress output
      })
    } catch (error) {
      console.error('Schema push failed:', error)
      // Try migrate deploy as fallback
      try {
        execSync('npx prisma migrate deploy', { 
          env: { ...process.env, DATABASE_URL: this._connectionString },
          stdio: 'ignore'
        })
      } catch (migrateError) {
        console.error('Both schema push and migrate deploy failed')
        throw error
      }
    }

    // Create Prisma client for test database
    this._prismaClient = new PrismaClient({
      datasources: {
        db: {
          url: this._connectionString
        }
      }
    })
  }

  async reset(): Promise<void> {
    if (!this._prismaClient) {
      throw new Error('Test database not initialized')
    }

    // Delete records in the correct order to handle foreign key constraints
    // This order is based on the schema relationships
    try {
      await this._prismaClient.$transaction([
        // Delete child records first
        this._prismaClient.projectTeamMember.deleteMany(),
        this._prismaClient.note.deleteMany(),
        this._prismaClient.address.deleteMany(),
        this._prismaClient.socialMediaProfile.deleteMany(),
        this._prismaClient.businessProfile.deleteMany(),
        this._prismaClient.customerContact.deleteMany(),
        this._prismaClient.project.deleteMany(),
        this._prismaClient.customer.deleteMany(),
        this._prismaClient.user.deleteMany(),
        this._prismaClient.auditLog.deleteMany(),
        this._prismaClient.plan.deleteMany(),
        this._prismaClient.question.deleteMany(),
        this._prismaClient.document.deleteMany(),
      ])
    } catch (error) {
      console.error('Error resetting test database:', error)
      // If the transaction fails, try disabling foreign key checks and delete all
      try {
        await this._prismaClient.$executeRaw`SET FOREIGN_KEY_CHECKS = 0`
        
        const modelNames = ['projectTeamMember', 'note', 'address', 'socialMediaProfile', 
          'businessProfile', 'customerContact', 'project', 'customer', 'user', 
          'auditLog', 'plan', 'question', 'document']
        
        for (const modelName of modelNames) {
          try {
            await (this._prismaClient as any)[modelName].deleteMany()
          } catch (modelError) {
            // Ignore errors for models that might not exist
            console.warn(`Could not delete from ${modelName}:`, modelError)
          }
        }
        
        await this._prismaClient.$executeRaw`SET FOREIGN_KEY_CHECKS = 1`
      } catch (fallbackError) {
        console.error('Fallback reset also failed:', fallbackError)
        throw error
      }
    }
  }

  get prisma(): PrismaClient {
    if (!this._prismaClient) {
      throw new Error('Test database not initialized')
    }
    return this._prismaClient
  }

  async teardown(): Promise<void> {
    if (this._container) {
      await this._container.stop()
    }
  }
}