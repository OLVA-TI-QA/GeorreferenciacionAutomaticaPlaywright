import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'
import { ExcelValidacion } from '@/types/excelInterfaces'

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

export function exportarResultadosValidarAddressIdAExcel(data: ExcelValidacion[], nombreBase: string) {
  // 1. Crear libro y hoja
  const libro = XLSX.utils.book_new()
  const hoja = XLSX.utils.aoa_to_sheet([]) // hoja vacía para llenarla a mano

  // 2. Encabezados (orden manual)
  const headers = ['NRO', 'DIRECCIÓN ENVIADA', 'DIRECCIÓN OBTENIDA', 'UBIGEO', 'POLÍGONO OBTENIDO', 'TRACKING', 'SERVICIO CÓDIGO', 'NOMBRE CLIENTE']
  XLSX.utils.sheet_add_aoa(hoja, [headers], { origin: 'A1' })

  // 3. Filas de datos (orden manual)
  const rows = data.map((r: ExcelValidacion) => [
    r.nro,
    r.direccionEnviada,
    r.direccionObtenida,
    r.ubigeo,
    r.poligonoObtenido,
    r.tracking,
    r.servicioCodigo,
    r.nombreCliente
  ])
  XLSX.utils.sheet_add_aoa(hoja, rows, { origin: 'A2' })

  // 4. Ajustar anchos
  const colWidths = headers.map((h) => ({ wch: Math.max(h.length, 20) }))
  hoja['!cols'] = colWidths

  // 5. Adjuntar hoja al libro
  XLSX.utils.book_append_sheet(libro, hoja, 'Resultados Validación')

  // 6. Guardar archivo
  if (!fs.existsSync('resultados-exportados')) fs.mkdirSync('resultados-exportados')
  const timestamp = getTimestamp()
  const nombreArchivo = `${nombreBase}_${timestamp}.xlsx`
  const ruta = path.join('resultados-exportados', nombreArchivo)
  XLSX.writeFile(libro, ruta)
  console.log(`✅ Resultados exportados a: ${ruta}`)
}

export function exportarResultadosValidarOficinasAExcel(data: ExcelValidacion[], nombreBase: string) {
  // 1. Crear libro y hoja
  const libro = XLSX.utils.book_new()
  const hoja = XLSX.utils.aoa_to_sheet([]) // hoja vacía para llenarla a mano

  // 2. Encabezados (orden manual)
  const headers = [
    'NRO',
    'LONGITUD ENVIADA',
    'LONGITUD OBTENIDA',
    'LATITUD ENVIADA',
    'LATITUD OBTENIDA',
    'DIRECCIONES',
    'CODUBIGEO ENVIADO',
    'CODUBIGEO OBTENIDO',
    'ES OFICINA?',
    'ID ADDRESS',
    'NOMBRE OFICINA'
  ]
  XLSX.utils.sheet_add_aoa(hoja, [headers], { origin: 'A1' })

  // 3. Filas de datos (orden manual)
  const rows = data.map((r: ExcelValidacion) => [
    r.nro,
    r.longitudeEnviada,
    r.longitudeObtenida,
    r.latitudeEnviada,
    r.latitudeObtenida,
    r.direccionEnviada,
    r.codUbigeoEnviado,
    r.codUbigeoObtenido,
    r.isOficina,
    r.idAddress,
    r.nombreOficina
  ])
  XLSX.utils.sheet_add_aoa(hoja, rows, { origin: 'A2' })

  // 4. Ajustar anchos
  const colWidths = headers.map((h) => ({ wch: Math.max(h.length, 20) }))
  hoja['!cols'] = colWidths

  // 5. Adjuntar hoja al libro
  XLSX.utils.book_append_sheet(libro, hoja, 'Resultados Validación Oficinas')

  // 6. Guardar archivo
  if (!fs.existsSync('resultados-exportados')) fs.mkdirSync('resultados-exportados')
  const timestamp = getTimestamp()
  const nombreArchivo = `${nombreBase}_${timestamp}.xlsx`
  const ruta = path.join('resultados-exportados', nombreArchivo)
  XLSX.writeFile(libro, ruta)
  console.log(`✅ Resultados exportados a: ${ruta}`)
}
