import { test, expect } from '@playwright/test'
import { Geo } from '../../../src/apiProviders/geo'
import { exportarResultadosValidarAddressIdAExcel, leerDatosDesdeExcel } from '@/utils/helpers'
import { validarDatosExcel } from '@/utils/validadores'
import { ExcelValidacion } from '@/types/excelInterfaces'

let geo: Geo
const excelPath = './src/testData/archivosExcel/DireccionesNoGeoreferenciadasAddressId.xlsx'
const sheetName = 'Hoja 1'
const resultadosValidacion: ExcelValidacion[] = []

test.beforeEach(async () => {
  const currentGeo = new Geo()
  geo = await currentGeo.init()
})

test('Validar direcciónes no georreferenciadas (address_id = 0)', async () => {
  test.setTimeout(600000) // esto se debe colocar solo si se desea colocar más tiempo de prueba en cada test

  const datos = leerDatosDesdeExcel(excelPath, sheetName)
  validarDatosExcel(datos, sheetName)

  for (let i = 0; i < datos.length; i++) {
    const fila: any = datos[i]
    const nro = fila['NRO'] ?? null
    const direccion = fila['DIRECCIONES'] ?? ''
    if (!direccion) {
      console.warn(`Fila ${nro} sin DIRECCIONES válida`)
      continue
    }

    const codUbigeoRaw = fila['CODUBIGEO'] ?? ''
    const codUbigeo = codUbigeoRaw.toString().padStart(6, '0')
    expect(codUbigeo.length).toBe(6)

    const tracking = fila['TRACKING'] ?? ''
    const servicioCodigo = fila['SERVICIOCODIGO'] ?? ''
    const nombreCliente = fila['NOMBRECLIENTE'] ?? ''

    console.log(`✅ Procesando registro #${nro}: ${direccion}`)
    const geoCodeResponse = await geo.getGeoCode(direccion, codUbigeo)

    expect(geoCodeResponse.status()).toBe(200)
    const bodyResponse = await geoCodeResponse.json()

    const isBodyEmpty =
      !bodyResponse ||
      (typeof bodyResponse === 'object' && Object.keys(bodyResponse).length === 0) ||
      ('problems_detected' in bodyResponse && Array.isArray(bodyResponse.problems_detected) && bodyResponse.problems_detected.length === 0)

    if (!isBodyEmpty) {
      console.log(`✅ Status code 200 para registro #${nro}`)
      if (!bodyResponse.address || !bodyResponse.polygon) {
        console.warn(`⚠️ Respuesta incompleta para registro #${nro}. No se encontró address o polygon.`)
        resultadosValidacion.push({
          nro,
          direccionEnviada: direccion,
          direccionObtenida: 'SIN RESULTADOS',
          ubigeo: codUbigeo,
          poligonoObtenido: 'SIN RESULTADOS',
          tracking,
          servicioCodigo,
          nombreCliente
        })
        continue
      }

      resultadosValidacion.push({
        nro,
        direccionEnviada: direccion,
        direccionObtenida: bodyResponse.address,
        ubigeo: codUbigeo,
        poligonoObtenido: bodyResponse.polygon,
        tracking,
        servicioCodigo,
        nombreCliente
      })
    } else {
      console.warn(`⚠️ No se obtuvo contenido para registro #${nro}`)
      resultadosValidacion.push({
        nro,
        direccionEnviada: direccion,
        direccionObtenida: 'SIN RESULTADOS',
        ubigeo: codUbigeo,
        poligonoObtenido: 'SIN RESULTADOS',
        tracking,
        servicioCodigo,
        nombreCliente
      })
    }
  }

  const totalRegistros = resultadosValidacion.length
  const direccionesNoEncontradas = resultadosValidacion.filter((item) => item.direccionObtenida === 'SIN RESULTADOS').length
  const exitosos = totalRegistros - direccionesNoEncontradas

  console.log(`📊 Resumen: ${totalRegistros} procesados, ${exitosos} encontrados, ${direccionesNoEncontradas} no encontradas`)
  console.log(`Hay ${exitosos} de ${totalRegistros} direcciones con address_id = 0 que fueron georreferenciadas correctamente.`)
  // ✅ Exportar al final
  exportarResultadosValidarAddressIdAExcel(resultadosValidacion, 'resultados_validacion_address_id')

  expect(direccionesNoEncontradas).toBe(totalRegistros)
})
