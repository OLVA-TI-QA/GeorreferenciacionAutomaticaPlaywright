import { test, expect } from '@playwright/test'
import { Geo } from '../../../src/apiProviders/geo'
import { exportarResultadosGenerico, leerDatosDesdeExcel } from '@/utils/helpers'
import { validarDatosExcel } from '@/utils/validadores'
import { ExcelValidacion } from '@/types/excelInterfaces'
import { devNull } from 'os'

let geo: Geo
const excelPath = './src/testData/archivosExcel/DireccionesConPoligonosDesarrollo.xlsx'
const sheetName = 'PoligonosZonaPeligrosa'
const resultadosValidacion: ExcelValidacion[] = []

test.beforeEach(async () => {
  const currentGeo = new Geo()
  geo = await currentGeo.init()
})

test('Validar polígonos por dirección más ubigeo', async ({ request }) => {
  test.setTimeout(600000) // esto se debe colocar solo si se desea colocar más tiempo de prueba en cada test

  const datos = leerDatosDesdeExcel(excelPath, sheetName)
  validarDatosExcel(datos, sheetName)

  let addressIdSuggested = ''
  for (let i = 0; i < datos.length; i++) {
    const fila: any = datos[i]
    const nro = fila['NRO'] ?? null
    const direccion = fila['DIRECCIONES'] ?? ''
    if (!direccion) {
      console.warn(`Fila ${nro} sin DIRECCIONES válida`)
      continue
    }

    const poligonoEsperado = fila['POLIGONO'] ?? ''

    console.log(`✅ Procesando registro #${nro}: ${direccion}`)

    const addressSuggestedResponse = await request.get('https://apis.geodir.co/places/autocomplete/v1/json', {
      params: {
        search: direccion,
        key: 'e06bc536-47da-46d7-a795-b12bb1aa1141'
      }
    })

    expect(addressSuggestedResponse.status()).toBe(200)

    let addressSuggestedResponseJson = null
    if (addressSuggestedResponse.status() === 200) {
      addressSuggestedResponseJson = await addressSuggestedResponse.json()
    }

    const isAddressSuggestedBodyResponseEmpty =
      !addressSuggestedResponseJson || (typeof addressSuggestedResponseJson === 'object' && Object.keys(addressSuggestedResponseJson).length === 0)

    if (!isAddressSuggestedBodyResponseEmpty) {
      if (
        addressSuggestedResponseJson.status === 'ZERO_RESULTS' ||
        !addressSuggestedResponseJson.predictions ||
        addressSuggestedResponseJson.predictions.length !== 0
      ) {
        console.warn(`⚠️ No se obtuvo contenido para registro #${nro}: ${direccion}`)

        resultadosValidacion.push({
          nro,
          direccionEnviada: direccion,
          direccionObtenida: 'SIN RESULTADOS',
          poligonoEsperado: poligonoEsperado,
          poligonoObtenido: 'SIN RESULTADOS',
          coincidePoligono: false
        })

        continue
      }

      addressIdSuggested = addressSuggestedResponseJson.predictions[0].place_id
    } else {
      console.warn(`⚠️ No se obtuvo contenido para registro #${nro}`)

      resultadosValidacion.push({
        nro,
        direccionEnviada: direccion,
        direccionObtenida: 'SIN RESULTADOS',
        poligonoEsperado: poligonoEsperado,
        poligonoObtenido: 'SIN RESULTADOS',
        coincidePoligono: false
      })

      continue
    }

    const geoCodeIdResponse = await geo.getGeoCodeId(addressIdSuggested)

    expect([200, 204]).toContain(geoCodeIdResponse.status())
    let geoCodeIdbodyResponse = null
    if (geoCodeIdResponse.status() === 200) {
      geoCodeIdbodyResponse = await geoCodeIdResponse.json()
    }

    const isBodyEmpty = !geoCodeIdbodyResponse || (typeof geoCodeIdbodyResponse === 'object' && Object.keys(geoCodeIdbodyResponse).length === 0)

    if (!isBodyEmpty) {
      console.log(`✅ Status code 200 para registro #${nro}`)
      if (!geoCodeIdbodyResponse.address) {
        console.warn(`⚠️ Respuesta incompleta para registro #${nro}. No se encontró address.`)
        resultadosValidacion.push({
          nro,
          direccionEnviada: direccion,
          direccionObtenida: 'SIN RESULTADOS',
          poligonoEsperado: poligonoEsperado,
          poligonoObtenido: 'SIN RESULTADOS',
          coincidePoligono: false
        })
        continue
      }

      const direccionObtenida = geoCodeIdbodyResponse.address

      if (!geoCodeIdbodyResponse.polygon) {
        console.warn(`⚠️ Respuesta incompleta para registro #${nro}. No se encontró polygon.`)

        resultadosValidacion.push({
          nro,
          direccionEnviada: direccion,
          direccionObtenida: direccionObtenida,
          poligonoEsperado: poligonoEsperado,
          poligonoObtenido: 'SIN RESULTADOS',
          coincidePoligono: false
        })
        continue
      }

      const poligonoObtenido = geoCodeIdbodyResponse.polygon
      const coincidePoligono: boolean = poligonoEsperado === poligonoObtenido ? true : false

      resultadosValidacion.push({
        nro,
        direccionEnviada: direccion,
        direccionObtenida: direccionObtenida,
        poligonoEsperado: poligonoEsperado,
        poligonoObtenido: poligonoObtenido,
        coincidePoligono: coincidePoligono
      })

      if (coincidePoligono) {
        console.log(`✅ Polígono coincide para registro #${nro}`)
      } else {
        console.warn(`⚠️ Polígono NO coincide para registro #${nro}. Esperado: ${poligonoEsperado}, Obtenido: ${poligonoObtenido}`)
      }
    } else {
      console.warn(`⚠️ No se obtuvo contenido para registro #${nro}`)
      resultadosValidacion.push({
        nro,
        direccionEnviada: direccion,
        direccionObtenida: 'SIN RESULTADOS',
        poligonoEsperado: poligonoEsperado,
        poligonoObtenido: 'SIN RESULTADOS',
        coincidePoligono: false
      })
    }
  }

  const totalRegistros = resultadosValidacion.length
  const exitosos = resultadosValidacion.filter((item) => item.coincidePoligono === true).length
  const fallidos = totalRegistros - exitosos

  console.log(`📊 Resumen: ${totalRegistros} procesados, ${exitosos} oficinas validadas correctamente, ${fallidos} oficinas validadas incorrectas`)
  console.log(`Hay ${exitosos} de ${totalRegistros} oficinas que fueron validadas correctamente.`)
  // ✅ Exportar al final
  exportarResultadosGenerico<ExcelValidacion>({
    data: resultadosValidacion,
    nombreBase: 'resultados_validacion_poligonos_direccionSugerida',
    headers: ['NRO', 'DIRECCIÓN ENVIADA', 'DIRECCIÓN OBTENIDA', 'POLÍGONO ESPERADO', 'POLÍGONO OBTENIDO', 'COINCIDE EL POLÍGONO?'],
    extraerCampos: [
      (r) => r.nro,
      (r) => r.direccionEnviada,
      (r) => r.direccionObtenida,
      (r) => r.poligonoEsperado,
      (r) => r.poligonoObtenido,
      (r) => r.coincidePoligono
    ]
  })

  expect(exitosos).toBe(totalRegistros)
})
