import { APIResponse, request } from '@playwright/test'
import { environment } from './src/config/environment'

async function debugApiCall() {
  console.log('\n🔍 === DEBUG API CALL ===\n')

  // 1. Verificar configuración
  console.log('📋 Configuración:')
  console.log(`   Base URL: ${environment.apiBaseUrlEnvioRestDev}`)
  console.log(`   Endpoint: /usuario/login`)
  console.log(`   Full URL: ${environment.apiBaseUrlEnvioRestDev}/usuario/login`)
  console.log(`   ¿URL termina con /? ${environment.apiBaseUrlEnvioRestDev.endsWith('/')}`)

  // 2. Crear contexto de request
  const context = await request.newContext({
    extraHTTPHeaders: {
      'Content-Type': 'application/json'
    }
  })

  // 3. Intentar login - Probar diferentes endpoints
  console.log('\n🔐 Intentando login...')

  const baseUrl = environment.apiBaseUrlEnvioRestDev
  const loginEndpoints = [
    `${baseUrl}/usuario/login`,
    `${baseUrl}/login`,
    `${baseUrl}/auth/login`,
    `${baseUrl}/usuario/autenticar`,
    `${baseUrl}/autenticar`
  ]

  let token: string | null = null
  let loginResponse: APIResponse | null = null

  for (const fullUrl of loginEndpoints) {
    console.log(`   Probando: ${fullUrl}`)
    loginResponse = await context.post(fullUrl, {
      data: {
        usuario: 'olvati',
        clave: 'J&_Mv9]H^2Vx'
      }
    })
    console.log(`      Status: ${loginResponse.status()}`)

    if (loginResponse.status() === 200) {
      const authBody = await loginResponse.json()
      token = authBody.token
      console.log(`   ✅ Login exitoso en: ${fullUrl}`)
      console.log(`   ✅ Token obtenido: ${token}`)
      break
    }
  }

  if (!token) {
    console.log('❌ Login falló en todos los endpoints')
    if (loginResponse) {
      console.log('   Última respuesta:', await loginResponse.text())
    }
    return
  }

  // 4. Intentar crear envío con body completo
  console.log('\n📦 Intentando crear envío...')

  // Body completo como en el archivo JSON
  const testBody = {
    parentOpti: null,
    codigoOptitrack: 50300,
    idRecojo: null,
    idSede: 1,
    idOficina: 1,
    direccionEntrega: 'Calle Test 123',
    decJurada: 0,
    decJuradaMonto: 5555,
    cargoAjuntoCant: 0,
    idPersJurArea: '314061',
    consignado: 'Test',
    consignadoTelf: '949078370',
    consignadoDni: '',
    codExterno: '950534987',
    idUbigeo: 150131,
    codPostal: '',
    createUser: 111,
    idTipoVia: 0,
    idTipoZona: 0,
    nombreVia: '0',
    nombreZona: '0',
    numero: '0',
    manzana: '0',
    lote: '0',
    latitud: -77.0696622743156,
    longitud: -12.042115838754475,
    poligono: null,
    idServicio: 35,
    codOperador: null,
    tipoGestion: null,
    envioArticulo: {
      pesoKgs: 10,
      ancho: 42,
      largo: 58,
      alto: 21,
      idContenedorArticulo: 19,
      idArticulo: 0
    },
    flgOficina: false,
    idOfiDest: null,
    montoBase: 16.25,
    montoExceso: 63,
    montoSeguro: 454,
    montoIgv: 95.985,
    precioVenta: 629.235,
    montoEmbalaje: 0,
    montoOtrosCostos: 0,
    montoTransporte: 0,
    entregaEnOficina: '0',
    numDocSeller: '',
    nombreSeller: '',
    codigoAlmacen: '',
    codUbigeo: '',
    direccionSeller: '',
    referenciaSeller: '',
    contacto: '',
    telefono: '',
    observacion: '',
    nroPiezas: 10
  }

  console.log('   Body enviado (primeros 500 caracteres):', JSON.stringify(testBody, null, 2).substring(0, 500))

  const createUrl = `${baseUrl}/envio/crear`
  console.log(`   URL: ${createUrl}`)

  const createResponse = await context.post(createUrl, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    data: testBody
  })

  console.log(`   Status: ${createResponse.status()}`)
  const responseText = await createResponse.text()
  console.log('   Response:', responseText.substring(0, 500))

  // 5. Comparar con Postman
  console.log('\n📊 Comparación con Postman:')
  console.log('   ¿Usas la misma URL base en Postman?')
  console.log('   ¿Usas el mismo token?')
  console.log('   ¿Usas el mismo body?')
  console.log('   ¿Incluyes el header Authorization?')

  await context.dispose()
}

debugApiCall().catch(console.error)
