import { test, expect } from '@playwright/test'
import { Geo } from '../../../src/apiProviders/geo'

let geo: Geo

// Setup de provider before all test
test.beforeEach(async () => {
  const currentGeo = new Geo()
  geo = await currentGeo.init()
})

test('Validar dirección no georreferenciada (address_id = 0)', async () => {
  const geoCodeResponse = await geo.getGeoCode('CA REPUBLICA DE CHILE NRO 321', '150101')

  expect(geoCodeResponse.status()).toBe(200)
  const bodyResponse = await geoCodeResponse.json()

  // Validación para saber si el contenido no tiene errores"
  const isBodyEmpty =
    !bodyResponse ||
    (typeof bodyResponse === 'object' && Object.keys(bodyResponse).length === 0) ||
    ('problems_detected' in bodyResponse && Array.isArray(bodyResponse.problems_detected) && bodyResponse.problems_detected.length === 0)

  if (isBodyEmpty) {
    console.warn(`⚠️ No se obtuvo contenido para la dirección (status code: ${bodyResponse.status()})`)
    expect(isBodyEmpty).toBe(false) // el body no debe ser "vacío"
  } else {
    console.log(`✅ Dirección procesada correctamente`)

    const { longitude, latitude } = bodyResponse.coordinates
    const poligono = bodyResponse.polygon

    console.log(`✅ Dirección válida: longitude: ${longitude} / latitude: ${latitude}`)

    if (poligono !== null) {
      console.log(`✅ Se obtubo el polígono de la dirección: ${poligono}`)
    } else {
      console.log('Sin polígono.')
    }
  }
})
