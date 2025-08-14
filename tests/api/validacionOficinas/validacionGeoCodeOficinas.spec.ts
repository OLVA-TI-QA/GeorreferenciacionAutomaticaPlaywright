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
    const direccion = fila['DIRECCIONES'] ?? ''
    if (!direccion) {
      console.warn(`Fila ${nro} sin DIRECCIONES válida`)
      continue
    }

    const codUbigeoRaw = fila['CODUBIGEO'] ?? ''
    const codUbigeo = codUbigeoRaw.toString().padStart(6, '0')
    expect(codUbigeo.length).toBe(6)

    const nombreOficina = fila['NOMBREOFICINA'] ?? ''
    const idAddress = fila['IDADDRESS'] ?? ''

    console.log(`✅ Procesando registro #${nro}: ${direccion}`)
    const geoReverseResponse = await geo.getGeoCode(direccion, codUbigeo)

    expect([200, 204]).toContain(geoReverseResponse.status())
    let bodyResponse = null
    if (geoReverseResponse.status() === 200) {
      bodyResponse = await geoReverseResponse.json()
    }

    const isBodyEmpty = !bodyResponse || (typeof bodyResponse === 'object' && Object.keys(bodyResponse).length === 0)

    if (!isBodyEmpty) {
      console.log(`✅ Status code 200 para registro #${nro}`)
      if (!bodyResponse.address) {
        console.warn(`⚠️ Respuesta incompleta para registro #${nro}. No se encontró address.`)
        resultadosValidacion.push({
          nro,
          direccionEnviada: direccion,
          direccionObtenida: 'SIN RESULTADOS',
          codUbigeoEnviado: codUbigeo,
          codUbigeoObtenido: 'SIN RESULTADOS',
          isOficina: 'false',
          idAddress: idAddress,
          nombreOficina: nombreOficina
        })
        continue
      }

      const codUbigeoObtenido = bodyResponse.ubigeo
      const direccionObtenida = bodyResponse.address
      const isOficina = bodyResponse.office.toString()

      resultadosValidacion.push({
        nro,
        direccionEnviada: direccion,
        direccionObtenida: direccionObtenida,
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
        direccionEnviada: direccion,
        direccionObtenida: 'SIN RESULTADOS',
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
    nombreBase: 'resultados_validacion_oficinas_direccionUbigeo',
    headers: [
      'NRO',
      'DIRECCIÓN ENVIADA',
      'DIRECCIÓN OBTENIDA',
      'CODUBIGEO ENVIADO',
      'CODUBIGEO OBTENIDO',
      'ES OFICINA?',
      'ID ADDRESS',
      'NOMBRE OFICINA'
    ],
    extraerCampos: [
      (r) => r.nro,
      (r) => r.direccionEnviada,
      (r) => r.direccionObtenida,
      (r) => r.codUbigeoEnviado,
      (r) => r.codUbigeoObtenido,
      (r) => r.isOficina,
      (r) => r.idAddress,
      (r) => r.nombreOficina
    ]
  })

  expect(exitosos).toBe(totalRegistros)
})
