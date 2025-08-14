import { test, expect } from '@playwright/test'
import { Geo } from '../../../src/apiProviders/geo'
import { exportarResultadosGenerico, leerDatosDesdeExcel } from '../../../src/utils/helpers'
import { validarDatosExcel } from '@/utils/validadores'
import { ExcelValidacion } from '@/types/excelInterfaces'

let geo: Geo
const excelPath = './src/testData/archivosExcel/DireccionesConPoligonosDesarrollo.xlsx'
const sheetName = 'PoligonosZonaPeligrosa'
const resultadosValidacion: ExcelValidacion[] = []

test.beforeEach(async () => {
  const currentGeo = new Geo()
  geo = await currentGeo.init()
})

test('Validar polígonos por dirección más ubigeo', async () => {
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

    const poligonoEsperado = fila['POLIGONO'] ?? ''

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
          codUbigeoEnviado: codUbigeo,
          direccionEnviada: direccion,
          direccionObtenida: 'SIN RESULTADOS',
          poligonoEsperado: poligonoEsperado,
          poligonoObtenido: 'SIN RESULTADOS',
          coincidePoligono: false,
          isZonaPeligrosa: 'false'
        })
        continue
      }

      const isZonaPeligrosa = bodyResponse.dangerous.toString()
      const direccionObtenida = bodyResponse.address

      if (!bodyResponse.polygon) {
        console.warn(`⚠️ Respuesta incompleta para registro #${nro}. No se encontró polygon.`)

        resultadosValidacion.push({
          nro,
          codUbigeoEnviado: codUbigeo,
          direccionEnviada: direccion,
          direccionObtenida: direccionObtenida,
          poligonoEsperado: poligonoEsperado,
          poligonoObtenido: 'SIN RESULTADOS',
          coincidePoligono: false,
          isZonaPeligrosa: isZonaPeligrosa
        })
        continue
      }

      const poligonoObtenido = bodyResponse.polygon
      const coincidePoligono: boolean = poligonoEsperado === poligonoObtenido ? true : false

      resultadosValidacion.push({
        nro,
        codUbigeoEnviado: codUbigeo,
        direccionEnviada: direccion,
        direccionObtenida: direccionObtenida,
        poligonoEsperado: poligonoEsperado,
        poligonoObtenido: poligonoObtenido,
        coincidePoligono: coincidePoligono,
        isZonaPeligrosa: isZonaPeligrosa
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
        codUbigeoEnviado: codUbigeo,
        direccionEnviada: direccion,
        direccionObtenida: 'SIN RESULTADOS',
        poligonoEsperado: poligonoEsperado,
        poligonoObtenido: 'SIN RESULTADOS',
        coincidePoligono: false,
        isZonaPeligrosa: 'false'
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
    nombreBase: 'resultados_validacion_poligonos_direccionUbigeo',
    headers: [
      'NRO',
      'CODUBIGEO',
      'DIRECCIÓN ENVIADA',
      'DIRECCIÓN OBTENIDA',
      'POLÍGONO ESPERADO',
      'POLÍGONO OBTENIDO',
      'COINCIDE EL POLÍGONO?',
      'ES ZONA PELIGROSA?'
    ],
    extraerCampos: [
      (r) => r.nro,
      (r) => r.codUbigeoEnviado,
      (r) => r.direccionEnviada,
      (r) => r.direccionObtenida,
      (r) => r.poligonoEsperado,
      (r) => r.poligonoObtenido,
      (r) => r.coincidePoligono,
      (r) => r.isZonaPeligrosa
    ]
  })

  expect(exitosos).toBe(totalRegistros)
})
