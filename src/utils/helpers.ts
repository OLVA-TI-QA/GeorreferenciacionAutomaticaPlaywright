import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'
import { ExportConfig } from '../types/excelInterfaces'

export function parseNumber(value: string | undefined, defaultValue: number): number {
  const parsed = Number(value)
  return isNaN(parsed) ? defaultValue : parsed
}

export function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  return value === 'true' || value === '1' || value === 'on' ? true : value === 'false' || value === '0' || value === 'off' ? false : defaultValue
}

// Función para leer Excel
export function leerDatosDesdeExcel(path: string, sheet: string) {
  const workbook = XLSX.readFile(path)
  const hoja = workbook.Sheets[sheet]
  return XLSX.utils.sheet_to_json(hoja)
}

function getTimestamp(): string {
  const now = new Date()

  const yyyy = now.getFullYear()
  const MM = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')

  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')

  return `${yyyy}${MM}${dd}_${hh}${mm}${ss}`
}

export function exportarResultadosGenerico<T>(config: ExportConfig<T>) {
  const { data, nombreBase, headers, extraerCampos, nombreHoja = 'Resultados' } = config

  // 1. Crear libro y hoja
  const libro = XLSX.utils.book_new()
  const hoja = XLSX.utils.aoa_to_sheet([headers])

  // 2. Filas de datos
  const rows = data.map((item) => extraerCampos.map((fn) => fn(item)))
  XLSX.utils.sheet_add_aoa(hoja, rows, { origin: 'A2' })

  // 3. Ajustar anchos
  hoja['!cols'] = headers.map((h) => ({ wch: Math.max(h.length, 20) }))

  // 4. Adjuntar hoja al libro
  XLSX.utils.book_append_sheet(libro, hoja, nombreHoja)

  // 5. Guardar archivo
  if (!fs.existsSync('resultados-exportados')) fs.mkdirSync('resultados-exportados')
  const timestamp = getTimestamp()
  const nombreArchivo = `${nombreBase}_${timestamp}.xlsx`
  const ruta = path.join('resultados-exportados', nombreArchivo)
  XLSX.writeFile(libro, ruta)

  console.log(`✅ Resultados exportados a: ${ruta}`)
}
