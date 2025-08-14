import { test, expect } from '@playwright/test'
import { getTrakingsByDate, getTrakingsByDateRawSQL } from '../../../src/database/testDataHelpers'
import { database } from '../../../src/database/connection'

test.describe('Pruebas con base de datos', () => {
  // Configure no retries for this test suite
  test.describe.configure({ retries: 0 })

  test.beforeAll(async () => {
    await database.connect()
  })

  test.afterAll(async () => {
    await database.disconnect()
  })

  test('Consulta de trackings utilizando Prisma ORM', async () => {
    console.log('\n=== Testing Prisma ORM query ===')
    // Create a proper ISO-8601 datetime string for the database query
    const fechaConsulta = new Date('2025-06-23T00:00:00.000Z')
    const limit = 5
    const trackings = await getTrakingsByDate({ fecha_emision: fechaConsulta, emision: 25, limit })
    console.log(`Prisma ORM found ${trackings.length} trackings`)

    // ✅ Validaciones para Prisma ORM
    expect(trackings).toBeInstanceOf(Array)
    expect(trackings.length).toBeGreaterThan(0) // Al menos 1 tracking

    // ✅ Validar estructura de datos de Prisma
    if (trackings.length > 0) {
      const firstTracking = trackings[0]

      // Verificar propiedades del tipo Prisma
      expect(firstTracking).toHaveProperty('tracking')
      expect(firstTracking).toHaveProperty('address_id')
      expect(firstTracking).toHaveProperty('address')
      expect(firstTracking).toHaveProperty('address_normalized')
    }
  })

  test('Consulta de trackings utilizando Raw SQL', async () => {
    console.log('\n=== Testing Raw SQL query (same as DBeaver) ===')
    const rawResults = await getTrakingsByDateRawSQL()
    console.log(`Raw SQL found ${Array.isArray(rawResults) ? rawResults.length : 0} trackings`)

    if (Array.isArray(rawResults) && rawResults.length > 0) {
      console.log('Sample raw result:', rawResults[0])
    }

    // ✅ Validaciones básicas de cantidad
    expect(rawResults).toBeInstanceOf(Array)
    const results = rawResults as any[] // Type assertion para trabajar con el array
    expect(results.length).toBeGreaterThan(0) // Al menos 1 tracking
    expect(results.length).toBeLessThanOrEqual(5) // No más del límite

    // ✅ Validación exacta si sabes cuántos esperas
    // expect(rawResults.length).toBe(5) // Exactamente 5 trackings

    // ✅ Validaciones de estructura de datos
    if (results.length > 0) {
      const firstResult = results[0] as any

      // Verificar que tiene las propiedades esperadas
      expect(firstResult).toHaveProperty('tracking')
      expect(firstResult).toHaveProperty('address_id')
      expect(firstResult).toHaveProperty('address')
      expect(firstResult).toHaveProperty('address_normalized')
      expect(firstResult).toHaveProperty('address_problems')

      // Verificar tipos de datos
      expect(typeof firstResult.tracking).toBe('bigint') // PostgreSQL BIGINT
      expect(typeof firstResult.address_id).toBe('number')
      expect(typeof firstResult.address).toBe('string')
      expect(firstResult.address.length).toBeGreaterThan(0) // No vacío

      // Verificar que tracking es un número válido
      expect(Number(firstResult.tracking)).toBeGreaterThan(0)
      expect(firstResult.address_id).toBeGreaterThan(0)
    }

    // ✅ Validar que todos los resultados tienen datos válidos
    results.forEach((result: any, index: number) => {
      expect(result.tracking, `Tracking en índice ${index} debe existir`).toBeDefined()
      expect(result.address_id, `Address ID en índice ${index} debe ser mayor a 0`).toBeGreaterThan(0)
      expect(result.address, `Address en índice ${index} no debe estar vacío`).toBeTruthy()
    })
  })

  test('Comparar resultados entre Prisma ORM y Raw SQL', async () => {
    console.log('\n=== Comparing Prisma ORM vs Raw SQL ===')

    const fechaConsulta = new Date('2025-06-23T00:00:00.000Z')
    const limit = 3 // Usar un límite menor para la comparación

    // Ejecutar ambas queries
    const prismaResults = await getTrakingsByDate({ fecha_emision: fechaConsulta, emision: 25, limit })
    const rawResults = (await getTrakingsByDateRawSQL()) as any[]

    console.log(`Prisma: ${prismaResults.length} results, Raw SQL: ${rawResults.length} results`)

    // ✅ Ambos deben devolver datos
    expect(prismaResults.length).toBeGreaterThan(0)
    expect(rawResults.length).toBeGreaterThan(0)

    // ✅ Comparar que ambos devuelven el mismo número de registros (si usan el mismo límite)
    // Note: Raw SQL usa LIMIT 5, Prisma usa el parámetro limit
    expect(prismaResults.length).toBeLessThanOrEqual(limit)
    expect(rawResults.length).toBeLessThanOrEqual(5)

    // ✅ Verificar que ambos devuelven los mismos trackings (al menos los primeros)
    if (prismaResults.length > 0 && rawResults.length > 0) {
      const prismaFirst = prismaResults[0]
      const rawFirst = rawResults[0]

      // Los trackings deben coincidir (ambos ordenados por tracking DESC)
      expect(prismaFirst.tracking).toBe(rawFirst.tracking.toString())
      expect(prismaFirst.address_id).toBe(rawFirst.address_id)
      expect(prismaFirst.address).toBe(rawFirst.address)
    }

    // ✅ Validar que los datos están ordenados correctamente (DESC)
    if (prismaResults.length > 1) {
      for (let i = 0; i < prismaResults.length - 1; i++) {
        const current = BigInt(prismaResults[i].tracking)
        const next = BigInt(prismaResults[i + 1].tracking)
        expect(current).toBeGreaterThanOrEqual(next)
      }
    }
  })
})
