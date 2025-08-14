import { PrismaClient } from '@prisma/client'
import { environment as config } from '../config/environment'

/**
 * Database connection singleton
 * Manages the Prisma client instance for database operations
 */
class DatabaseConnection {
  private static instance: DatabaseConnection
  private prisma: PrismaClient

  private constructor() {
    this.prisma = new PrismaClient({
      log: config.environment === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
      datasources: {
        db: {
          url: config.database.url
        }
      }
    })
  }

  /**
   * Get the singleton instance of DatabaseConnection
   */
  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection()
    }
    return DatabaseConnection.instance
  }

  /**
   * Get the Prisma client instance
   */
  public getClient(): PrismaClient {
    return this.prisma
  }

  /**
   * Connect to the database
   */
  public async connect(): Promise<void> {
    try {
      await this.prisma.$connect()
      console.log('✅ Database connected successfully')
    } catch (error) {
      console.error('❌ Database connection failed:', error)
      throw error
    }
  }

  /**
   * Disconnect from the database
   */
  public async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect()
      console.log('✅ Database disconnected successfully')
    } catch (error) {
      console.error('❌ Database disconnection failed:', error)
      throw error
    }
  }

  /**
   * Check database connection health
   */
  public async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return true
    } catch (error) {
      console.error('❌ Database health check failed:', error)
      return false
    }
  }
}

// Export singleton instance
export const database = DatabaseConnection.getInstance()
export const prisma = database.getClient()
