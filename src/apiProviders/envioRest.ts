import crearEnvioBodyJson from '@/testData/archivosJson/crearEnvioBody.json'
import { CrearEnvioBody } from '@/types/crearEnvioInterfaces'
import { environment } from '@config/environment'
import { APIRequestContext, request } from '@playwright/test'

export class EnvioRest {
  private baseUrl?: APIRequestContext
  private fullBaseUrl: string

  constructor() {
    this.fullBaseUrl = environment.apiBaseUrlEnvioRestDev
  }

  async init() {
    this.baseUrl = await request.newContext({
      extraHTTPHeaders: {
        'Content-Type': 'application/json'
      }
    })

    return this
  }

  public async postLogin(usuario: string, clave: string) {
    const loginUrl = `${this.fullBaseUrl}/usuario/login`
    const loginResponse = await this.baseUrl!.post(loginUrl, {
      data: {
        usuario,
        clave
      }
    })

    return loginResponse
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
    const body = structuredClone(crearEnvioBodyJson)

    // Sobrescribir solo los campos necesarios
    body.codigoOptitrack = codigoOptitrack
    body.idSede = idSede
    body.idOficina = idOficina
    body.direccionEntrega = direccion
    body.consignado = consignado
    body.idUbigeo = idUbigeo

    const createUrl = `${this.fullBaseUrl}/envio/crear`
    const getResponse = await this.baseUrl!.post(createUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      data: body
    })

    return getResponse
  }

  public async postCrearMultiplesEnvios(token: string, listaDeEnvios: CrearEnvioBody[]) {
    const createUrl = `${this.fullBaseUrl}/envio/crear`
    return await this.baseUrl!.post(createUrl, {
      data: listaDeEnvios,
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  }
}
