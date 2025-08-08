import { test, expect } from '@playwright/test'
import { EnvioRest } from '@/apiProviders/envioRest'
import { TipoCiudad, typeCiudad } from '@/config/ciudades'

let envioRest: EnvioRest

const codigoOptitrack = 50000 // editar deacuerdo a lo que se necesita

// Obtener los IDs de la ciudad actual
const ciudadActual: TipoCiudad = 'Lima'
const idSede = typeCiudad[ciudadActual].idSede
const idOficina = typeCiudad[ciudadActual].idOficina

// Setup de provider before all test
test.beforeEach(async () => {
  const currentEnvioRest = new EnvioRest()
  envioRest = await currentEnvioRest.init()
})

test('Crear un tracking', async () => {
  // Paso 1: Login para obtener el token

  const loginResponse = await envioRest.postLogin('olvati', 'J&_Mv9]H^2Vx') // ver la forma de guardar estas credenciales

  expect(loginResponse.status()).toBe(200)
  const authBody = await loginResponse.json()
  const token = authBody.token
  expect(token).toBeDefined()
  console.log(`🔐 Token obtenido: ${token}`)

  // Paso 2: Crear Envío usando el token
  const crearEnvioResponse = await envioRest.postCrearEnvio(
    token,
    codigoOptitrack,
    idSede,
    idOficina,
    'LA PAZ MZ 246 LT 13, YARINACOCHA, CORONEL PORTILLO, UCAYALI',
    'TIENDA OECHSLE - CUSCO   ANDREA SILVA  DIGNA CONDORI',
    1648
  )

  expect(crearEnvioResponse.status()).toBe(201)
  const crearEnvioBody = await crearEnvioResponse.json()
  expect('estado' in crearEnvioBody).toBe(true)
  expect('remito' in crearEnvioBody).toBe(true)

  // Paso 3: Mostrar emision y tracking

  console.log(`✅ El envío fue creado correctamente: emision = ${crearEnvioBody.emision}, remito = ${crearEnvioBody.remito}`)
})
