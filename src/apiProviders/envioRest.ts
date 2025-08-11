import { request, APIRequestContext } from '@playwright/test'
import { environment } from '@config/environment'
import crearEnvioBodyJson from '@/testData/archivosJson/crearEnvioBody.json'
import { CrearEnvioBody } from '@/types/crearEnvioInterfaces'

export class EnvioRest {
  private baseUrl?: APIRequestContext

  async init() {
    this.baseUrl = await request.newContext({
      extraHTTPHeaders: {
        'Content-Type': 'application/json'
      },
      baseURL: environment.apiBaseUrlEnvioRestDev
    })

    return this
  }

  public async postLogin(usuario: string, clave: string) {
    return await this.baseUrl!.get('/usuario/login', {
      data: {
        usuario,
        clave
      }
    })
  }

  public async postCrearEnvio(
    token: string,
    codigoOptitrack: number,
    idSede: number,
    idOficina: number,
    direccion: string,
    consignado: string,
    idUbigeo: number
  ) {
    // Clonar el JSON para evitar mutaciones globales
    const body = { ...crearEnvioBodyJson }

    // Sobrescribir solo los campos necesarios
    body.codigoOptitrack = codigoOptitrack
    body.idSede = idSede
    body.idOficina = idOficina
    body.direccionEntrega = direccion
    body.consignado = consignado
    body.idUbigeo = idUbigeo

    const getResponse = await this.baseUrl!.get('/envio/crear', {
      headers: {
        Authorization: `Bearer ${token}`
      },
      data: body
    })

    return getResponse
  }

  public async postCrearMultiplesEnvios(token: string, listaDeEnvios: CrearEnvioBody[]) {
    return await this.baseUrl!.post('/envio/crear', {
      data: listaDeEnvios,
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  }
}
