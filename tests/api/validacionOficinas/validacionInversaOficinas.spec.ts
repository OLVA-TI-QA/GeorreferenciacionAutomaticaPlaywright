import { test, expect } from '@playwright/test'
import { Geo } from '../../../src/apiProviders/geo'
import { exportarResultadosGenerico, leerDatosDesdeExcel } from '../../../src/utils/helpers'
import { validarDatosExcel } from '@/utils/validadores'
import { ExcelValidacion } from '@/types/excelInterfaces'

let geo: Geo
const excelPath = './src/testData/archivosExcel/DataDeOficinasLima.xlsx'
const sheetName = 'DireccionesOficinas'
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
    const longitude = fila['LONGITUD'] ?? ''
    if (!longitude) {
      console.warn(`Fila ${nro} sin LONGITUD válida`)
      continue
    }

    const latitude = fila['LATITUD'] ?? ''
    if (!latitude) {
      console.warn(`Fila ${nro} sin LATITUD válida`)
      continue
    }

    const direccion = fila['DIRECCIONES'] ?? ''
    const codUbigeo = fila['CODUBIGEO'] ?? ''
    const nombreOficina = fila['NOMBREOFICINA'] ?? ''
    const idAddress = fila['IDADDRESS'] ?? ''

    console.log(`✅ Procesando registro #${nro}: ${direccion}`)
    const geoReverseResponse = await geo.getGeoReverse(longitude, latitude)

    expect([200, 204]).toContain(geoReverseResponse.status())
    let bodyResponse = null
    if (geoReverseResponse.status() === 200) {
      bodyResponse = await geoReverseResponse.json()
    }

    const isBodyEmpty = !bodyResponse || (typeof bodyResponse === 'object' && Object.keys(bodyResponse).length === 0)

    if (!isBodyEmpty) {
      console.log(`✅ Status code 200 para registro #${nro}`)
      if (!bodyResponse.address || !bodyResponse.coordinates.longitude || !bodyResponse.coordinates.latitude) {
        console.warn(`⚠️ Respuesta incompleta para registro #${nro}. No se encontró address o longitude o latitude.`)
        resultadosValidacion.push({
          nro,
          longitudeEnviada: longitude,
          longitudeObtenida: 'SIN RESULTADOS',
          latitudeEnviada: latitude,
          latitudeObtenida: 'SIN RESULTADOS',
          direccionEnviada: direccion,
          codUbigeoEnviado: codUbigeo,
          codUbigeoObtenido: 'SIN RESULTADOS',
          isOficina: 'false',
          idAddress: idAddress,
          nombreOficina: nombreOficina
        })
        continue
      }

      const codUbigeoObtenido = bodyResponse.ubigeo
      const { longitude: longitudeObtenida, latitude: latitudeObtenida } = bodyResponse.coordinates
      const isOficina = bodyResponse.office.toString()

      resultadosValidacion.push({
        nro,
        longitudeEnviada: longitude,
        longitudeObtenida: longitudeObtenida,
        latitudeEnviada: latitude,
        latitudeObtenida: latitudeObtenida,
        direccionEnviada: direccion,
        codUbigeoEnviado: codUbigeo,
        codUbigeoObtenido: codUbigeoObtenido,
        isOficina: isOficina,
        idAddress: idAddress,
        nombreOficina: nombreOficina
      })
    } else {
      console.warn(`⚠️ No se obtuvo contenido para registro #${nro}`)
      resultadosValidacion.push({
        nro,
        longitudeEnviada: longitude,
        longitudeObtenida: 'SIN RESULTADOS',
        latitudeEnviada: latitude,
        latitudeObtenida: 'SIN RESULTADOS',
        direccionEnviada: direccion,
        codUbigeoEnviado: codUbigeo,
        codUbigeoObtenido: 'SIN RESULTADOS',
        isOficina: 'false',
        idAddress: idAddress,
        nombreOficina: nombreOficina
      })
    }
  }

  const totalRegistros = resultadosValidacion.length
  const exitosos = resultadosValidacion.filter((item) => item.isOficina === 'true').length
  const fallidos = totalRegistros - exitosos

  console.log(`📊 Resumen: ${totalRegistros} procesados, ${exitosos} oficinas validadas correctamente, ${fallidos} oficinas validadas incorrectas`)
  console.log(`Hay ${exitosos} de ${totalRegistros} oficinas que fueron validadas correctamente.`)
  // ✅ Exportar al final
  exportarResultadosGenerico<ExcelValidacion>({
    data: resultadosValidacion,
    nombreBase: 'resultados_validacion_oficinas_lonLat',
    headers: [
      'NRO',
      'LONGITUD ENVIADA',
      'LONGITUD OBTENIDA',
      'LATITUD ENVIADA',
      'LATITUD OBTENIDA',
      'DIRECCIONES',
      'CODUBIGEO ENVIADO',
      'CODUBIGEO OBTENIDO',
      'ES OFICINA?',
      'ID ADDRESS',
      'NOMBRE OFICINA'
    ],
    extraerCampos: [
      (r) => r.nro,
      (r) => r.longitudeEnviada,
      (r) => r.longitudeObtenida,
      (r) => r.latitudeEnviada,
      (r) => r.latitudeObtenida,
      (r) => r.direccionEnviada,
      (r) => r.codUbigeoEnviado,
      (r) => r.codUbigeoObtenido,
      (r) => r.isOficina,
      (r) => r.idAddress,
      (r) => r.nombreOficina
    ]
  })
  expect(exitosos).toBe(totalRegistros)
})
