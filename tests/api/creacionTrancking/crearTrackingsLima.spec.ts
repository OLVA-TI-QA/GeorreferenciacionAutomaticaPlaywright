import { test, expect } from '@playwright/test'
import { EnvioRest } from '@/apiProviders/envioRest'
import crearEnvioBodyJson from '@/testData/archivosJson/crearEnvioBody.json'
import { TipoCiudad, typeCiudad } from '@/config/ciudades'
import { leerDatosDesdeExcel } from '@/utils/helpers'
import { validarDatosExcel } from '@/utils/validadores'

let envioRest: EnvioRest

// Configura tu base para códigoOptitrack
const baseCodigoOptitrack = 50000 // puedes cambiar este valor

// Obtener los IDs de la ciudad actual
const ciudadActual: TipoCiudad = 'Lima'
const idSede = typeCiudad[ciudadActual].idSede
const idOficina = typeCiudad[ciudadActual].idOficina

// Ruta y nombre de la hoja de Excel
const excelPath = './src/testData/archivosExcel/DireccionesTrackingUbigeosTodosLosCasos.xlsx'
const sheetName = 'DireccionesUbigeoPrimero'

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
  // Validar que el archivo de datos existe y tiene datos
  validarDatosExcel(datos, sheetName)

  for (let i = 0; i < datos.length; i++) {
    const fila: any = datos[i]

    const direccion = fila['DIRECCIONES']

    const codUbigeo = fila['IDUBIGEO'].toString().padStart(6, '0')
    expect(codUbigeo.length).toBe(6)
    const idUbigeo = parseInt(codUbigeo) || 0

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

    const codUbigeo = fila['IDUBIGEO'].toString().padStart(6, '0')
    expect(codUbigeo.length).toBe(6)
    body.idUbigeo = parseInt(codUbigeo) || 0

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
