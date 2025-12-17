// tests/api/geo/geo-batch-hardcoded.spec.ts
import { test, expect } from '@playwright/test'

test('Geo batch hardcoded: valida 200 y body exacto', async ({ request }) => {
  // Usa baseURL de tu playwright.config.ts
  const params = {
    'address[1]': 'alcides vigo mz m lt 9',
    'ubigeo[1]': '150101',
    'address[2]': 'jr los sauces 325',
    'ubigeo[2]': '150102',
    'address[3]': 'psje miraflores s/n',
    'ubigeo[3]': '150103'
  }

  const resp = await request.get('/api/v2/geo/code', { params })
  expect(resp.status()).toBe(200)

  const body = await resp.json()

  const expected = {
    items: {
      '1': {
        normalized_address: 'Alcides Vigo Manzana M Lote 9',
        problems_detected: ['ABREVIACIONES_DETECTADAS']
      },
      '2': {
        id: 60228,
        address: 'Ancon',
        aliases: [],
        coordinates: {
          altitude: 0,
          longitude: -77.17044,
          latitude: -11.77416
        },
        postalCode: '15123',
        ubigeo: '150102',
        georeference: 'true',
        polygon: null,
        office: false,
        geocodingConfidence: 40,
        officeData: {
          id: null,
          code: null,
          type: null
        },
        dangerous: false
      }
    },
    total: 2
  }

  // Igualdad estricta con el body esperado:
  expect(body).toEqual(expected)
})
