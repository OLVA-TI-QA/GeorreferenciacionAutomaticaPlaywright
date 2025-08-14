import { test, expect } from '@playwright/test'
import { getTrakingsByDate } from '../../../src/database/testDataHelpers'
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

  test('Consulta de usuarios', async () => {
    // Create a proper ISO-8601 datetime string for the database query
    const fechaConsulta = new Date('2025-06-23T00:00:00.000Z')
    const trackings = await getTrakingsByDate({ fecha_emision: fechaConsulta, emision: 25, limit: 5 })
    console.log(`Found ${trackings.length} trackings`)
    // expect(trackings.length).toBeGreaterThan(0)
  })
})
