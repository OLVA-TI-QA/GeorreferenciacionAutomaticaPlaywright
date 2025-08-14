export interface ExcelValidacion {
  nro: number
  direccionEnviada?: string
  direccionObtenida?: string
  ubigeo?: string
  poligonoEsperado?: string
  poligonoObtenido?: string
  coincidePoligono?: boolean
  isZonaPeligrosa?: string
  tracking?: string
  servicioCodigo?: number
  nombreCliente?: string
  longitudeEnviada?: string
  longitudeObtenida?: string
  latitudeEnviada?: string
  latitudeObtenida?: string
  codUbigeoEnviado?: string
  codUbigeoObtenido?: string
  isOficina?: string
  idAddress?: string
  nombreOficina?: string
}

export interface ExportConfig<T> {
  data: T[]
  nombreBase: string
  headers: string[]
  nombreHoja?: string
  extraerCampos: CampoExtractor<T>[]
}

export type CampoExtractor<T> = (item: T) => string | number | boolean | undefined

// Interfaz para el Excel, adaptada a tu función exportarResultadosGenerico
export interface ExcelValidacionExportTrackings {
  tracking: number
  address_id: number
  address: string
  address_normalized: string
  errores: string
}
