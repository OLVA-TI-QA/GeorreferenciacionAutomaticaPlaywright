import { OlvaTrackings } from '@prisma/client'
import { trackingData } from '../types/dataBaseInterfaces'
import { prisma } from './connection'

/**
 * Get all trackings by date (using greater than, like your SQL)
 */
export async function getTrakingsByDate(
  trackingData: trackingData
): Promise<Pick<OlvaTrackings, 'tracking' | 'address_id' | 'address' | 'address_normalized'>[]> {
  try {
    console.log('🔍 Executing query with parameters:')
    console.log(`   fecha_emision > ${trackingData.fecha_emision.toISOString()}`)
    console.log(`   emision = ${trackingData.emision}`)
    console.log(`   limit = ${trackingData.limit}`)

    return await prisma.olvaTrackings.findMany({
      where: {
        fecha_emision: {
          gt: trackingData.fecha_emision // Using 'gt' (greater than) instead of equality
        },
        emision: trackingData.emision
      },
      select: {
        tracking: true,
        address_id: true,
        address: true,
        address_normalized: true
      },
      orderBy: { tracking: 'desc' },
      take: trackingData.limit
    })
  } catch (error) {
    console.error('Error fetching trackings by date:', error)
    return []
  }
}

/**
 * Execute the exact same SQL query you're using in DBeaver
 *
 * Prisma Raw Query Options:
 *
 * 1. $queryRaw - For SELECT queries (returns array of objects)
 * 2. $executeRaw - For INSERT/UPDATE/DELETE (returns count)
 * 3. $queryRawUnsafe - When you need dynamic SQL (less safe)
 * 4. $executeRawUnsafe - For non-SELECT dynamic SQL
 */
export async function getTrakingsByDateRawSQL() {
  try {
    console.log('🔍 Executing raw SQL query (same as DBeaver):')

    // Option 1: Template literal (recommended - SQL injection safe)
    const result = await prisma.$queryRaw`
      SELECT t.tracking, t.address_id, t.address, t.address_normalized, t.address_problems
      FROM olva.trackings t
      WHERE t.fecha_emision > '2025-06-23T00:00:00.000Z'
        AND t.emision = '25'
      ORDER BY t.tracking DESC
      LIMIT 5
    `

    console.log(`Raw SQL returned ${Array.isArray(result) ? result.length : 0} records`)
    return result
  } catch (error) {
    console.error('Error executing raw SQL:', error)
    return []
  }
}

/**
 * Example with parameters (safer for dynamic values)
 */
export async function getTrakingsByDateWithParams(fechaDesde: Date, emisionValue: number, limitValue: number) {
  try {
    // Using parameters to prevent SQL injection
    const result = await prisma.$queryRaw`
      SELECT t.tracking, t.address_id, t.address, t.address_normalized, t.address_problems
      FROM olva.trackings t
      WHERE t.fecha_emision > ${fechaDesde}
        AND t.emision = ${emisionValue.toString()}
      ORDER BY t.tracking DESC
      LIMIT ${limitValue}
    `

    return result
  } catch (error) {
    console.error('Error executing parameterized raw SQL:', error)
    return []
  }
}

/**
 * Example for COUNT queries
 */
export async function getTrackingsCount(fechaDesde: Date, emisionValue: number) {
  try {
    const result = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count
      FROM olva.trackings t
      WHERE t.fecha_emision > ${fechaDesde}
        AND t.emision = ${emisionValue.toString()}
    `

    return Number(result[0].count)
  } catch (error) {
    console.error('Error executing count query:', error)
    return 0
  }
}
