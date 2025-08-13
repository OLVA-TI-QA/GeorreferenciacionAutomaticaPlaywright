import { request, APIRequestContext } from '@playwright/test'
import { environment } from '@config/environment'

export class Geo {
  private baseUrl?: APIRequestContext

  async init() {
    this.baseUrl = await request.newContext({
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
        'x-api-key': environment.geoXApiKey
      },
      baseURL: environment.apiBaseUrlGeoDev
    })

    return this
  }

  public async getGeoCode(address: string, ubigeo: string) {
    const geoCodeResponse = await this.baseUrl!.get('/api/v2/geo/code', {
      params: {
        address,
        ubigeo
      }
    })

    return geoCodeResponse
  }

  public async getGeoReverse(lon: string, lat: string) {
    const geoReverseResponse = await this.baseUrl!.get('/api/v2/geo/reverse', {
      params: {
        lon,
        lat
      }
    })

    return geoReverseResponse
  }

  public async getGeoCodeId(addressId: string) {
    const geoCodeIdResponse = await this.baseUrl!.get('/api/v2/geo/code', {
      params: {
        addressId
      }
    })

    return geoCodeIdResponse
  }
}
