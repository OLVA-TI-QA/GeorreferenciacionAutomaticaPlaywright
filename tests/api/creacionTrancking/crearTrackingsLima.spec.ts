import { test, expect } from '@playwright/test'
import { EnvioRest } from '@/apiProviders/envioRest'
import crearEnvioBodyJson from '@/testData/archivosJson/crearEnvioBody.json'
import * as XLSX from 'xlsx'
import { TipoCiudad, typeCiudad } from '@/config/ciudades'

let envioRest: EnvioRest

// Configura tu base para códigoOptitrack
const baseCodigoOptitrack = 50000 // puedes cambiar este valor

// Obtener los IDs de la ciudad actual
const ciudadActual: TipoCiudad = 'Lima'
const idSede = typeCiudad[ciudadActual].idSede
const idOficina = typeCiudad[ciudadActual].idOficina

// Ruta y nombre de la hoja de Excel
const excelPath = './testData/direcciones.xlsx'
const sheetName = 'Hoja1'

// Función para leer Excel
function leerDatosDesdeExcel(path: string, sheet: string) {
  const workbook = XLSX.readFile(path)
  const hoja = workbook.Sheets[sheet]
  return XLSX.utils.sheet_to_json(hoja)
}

// 🧪 Setup antes de cada test
test.beforeEach(async () => {
  const currentEnvioRest = new EnvioRest()
  envioRest = await currentEnvioRest.init()
})

// 🧪 Test principal con múltiples envíos
test('Crear trackings en la sede de Lima, 1 request por body (Iterativo)', async () => {
  // Paso 1: Login
  const loginResponse = await envioRest.postLogin('olvati', 'J&_Mv9]H^2Vx')
  expect(loginResponse.status()).toBe(200)

  const authBody = await loginResponse.json()
  const token = authBody.token
  expect(token).toBeDefined()
  console.log(`🔐 Token obtenido: ${token}`)

  // Paso 2: Leer Excel
  const datos = leerDatosDesdeExcel(excelPath, sheetName)

  for (let i = 0; i < datos.length; i++) {
    const fila: any = datos[i]

    const direccion = fila['DIRECCIONES']
    const idUbigeo = parseInt(fila['IDUBIGEO']) || 0
    const codigoOptitrack = baseCodigoOptitrack + i - 1

    // Puedes ajustar los demás parámetros si quieres que también vengan del Excel
    const crearEnvioResponse = await envioRest.postCrearEnvio(
      token,
      codigoOptitrack,
      idSede,
      idOficina,
      direccion,
      'Pruebas Alem Origen Lima',
      idUbigeo
    )

    expect(crearEnvioResponse.status()).toBe(201)

    const crearEnvioBody = await crearEnvioResponse.json()

    expect('estado' in crearEnvioBody).toBe(true)
    expect('remito' in crearEnvioBody).toBe(true)

    console.log(`✅ [${i + 1}] Envío creado: remito=${crearEnvioBody.remito}, emision=${crearEnvioBody.emision}, dirección="${direccion}"`)
  }
})

test('Crear trackings en la sede Lima en una sola petición (batch)', async () => {
  // Paso 1: Login
  const loginResponse = await envioRest.postLogin('olvati', 'J&_Mv9]H^2Vx')
  expect(loginResponse.status()).toBe(200)

  const authBody = await loginResponse.json()
  const token = authBody.token
  expect(token).toBeDefined()
  console.log(`🔐 Token obtenido: ${token}`)

  // Paso 2: Leer Excel
  const datos = leerDatosDesdeExcel(excelPath, sheetName)

  // Paso 3: Crear array de envíos
  const listaEnvios = datos.map((fila: any, i: number) => {
    const body = structuredClone(crearEnvioBodyJson)

    body.codigoOptitrack = baseCodigoOptitrack + i - 1
    body.idSede = idSede
    body.idOficina = idOficina
    body.direccionEntrega = fila['DIRECCIONES']
    body.consignado = 'Pruebas Alem Origen Lima'
    body.idUbigeo = parseInt(fila['IDUBIGEO']) || 0

    return body
  })

  // Paso 4: Enviar todos los envíos en un solo POST
  const response = await envioRest.postCrearMultiplesEnvios(token, listaEnvios)

  expect(response.status()).toBe(201)

  const responseBody = await response.json()
  console.log('📦 Respuesta del envío múltiple:', responseBody)

  // Validar por ejemplo que venga una lista de respuestas
  expect(Array.isArray(responseBody)).toBe(true)
  responseBody.forEach((envio: any, idx: number) => {
    console.log(`🔖 Envío #${idx + 1}: emision = ${envio.emision}, remito = ${envio.remito}`)
  })
})
