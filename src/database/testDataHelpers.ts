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
          gt: trackingData.fecha_emision // Usar 'gt' (greater than) en lugar de igual
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
 * Ejecuta exactamente la misma consulta SQL que estás usando en DBeaver
 *
 * Opciones de consultas en crudo (Raw Query) de Prisma:
 *
 * 1. $queryRaw - Para consultas SELECT (devuelve un arreglo de objetos)
 * 2. $executeRaw - Para INSERT/UPDATE/DELETE (devuelve un conteo)
 * 3. $queryRawUnsafe - Cuando necesitas SQL dinámico (menos seguro)
 * 4. $executeRawUnsafe - Para SQL dinámico que no sea SELECT
 */
export async function getTrakingsByDateRawSQL() {
  try {
    console.log('🔍 Executing raw SQL query (same as DBeaver):')

    // Template literal (recomendado - seguro contra inyecciones SQL)
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
    // User parameters para prevenir SQL injection
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
