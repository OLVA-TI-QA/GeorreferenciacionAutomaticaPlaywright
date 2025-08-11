import { expect } from '@playwright/test'

/**
 * Valida que una lista de datos leída desde un archivo Excel no esté vacía.
 */
export function validarDatosExcel(datos: any[], sheetName: string) {
  expect(datos).not.toBeNull()
  expect(Array.isArray(datos)).toBe(true)
  expect(datos.length).toBeGreaterThan(0)

  console.log(`✅ Excel '${sheetName}' tiene ${datos.length} registros.`)
}
