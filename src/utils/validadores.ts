import { ExcelValidacionExportTrackings } from '@/types/excelInterfaces'
import { expect } from '@playwright/test'
import { OlvaTrackings } from '@prisma/client' // Importamos el tipo de dato de Prisma

// Definiciones de datos
const ciudadesConocidas = ['tacna', 'pocollay', 'lima', 'arequipa', 'miraflores', 'san isidro']
const manzanasLotes = ['lt', 'mz', 'lot', 'lte', 'manz', 'mzn', 'km', 'secto']
const caracteresEspeciales = ['!', '@', '#', '$', '%', '&', '*', '/', '\\', 'ª', 'º', '©', '³', '±']
const erroresTipograficos = new Map<string, string>([
  ['av', 'avenida'],
  ['jr', 'jiron'],
  ['clle', 'calle'],
  ['cl', 'calle'],
  ['cale', 'calle'],
  ['mz', 'manzana'],
  ['maz', 'manzana'],
  ['lte', 'lote'],
  ['urb', 'urbanizacion'],
  ['lt', 'lote']
])

/**
 * Valida que una lista de datos leída desde un archivo Excel no esté vacía.
 */
export function validarDatosExcel(datos: any[], sheetName: string) {
  expect(datos).not.toBeNull()
  expect(Array.isArray(datos)).toBe(true)
  expect(datos.length).toBeGreaterThan(0)

  console.log(`✅ Excel '${sheetName}' tiene ${datos.length} registros.`)
}

export function clasificarErrores(direccionOriginal: string, direccionNormalizada: string): string[] {
  const errores: string[] = []

  const original = direccionOriginal?.toLowerCase()?.trim() || ''
  const normalizada = direccionNormalizada?.toLowerCase()?.trim() || ''

  if (!original || original.length < 8) {
    return ['Dirección vacía o demasiado corta']
  }

  // === VALIDACIÓN DE GUION Y TEXTO POSTERIOR ===
  const palabrasClave = ['avenida', 'calle', 'jiron', 'jirón', 'manzana', 'lote', 'urbanización', 'jr', 'av', 'mz', 'ca.']

  let direccionBase = original
  let direccionNormalizadaBase = normalizada

  if (original.includes('-')) {
    const partes = original.split(/\s*-\s*/, 2)
    const parteIzquierda = partes[0]?.trim()
    const parteDerecha = partes.length > 1 ? partes[1]?.trim() : ''

    const contienePalabraClave = palabrasClave.some((palabra) => parteIzquierda.includes(palabra))

    if (contienePalabraClave && parteDerecha) {
      const normalizadaMinuscula = normalizada.toLowerCase()
      const textoPosterior = parteDerecha.toLowerCase()

      // 🛡️ EXCEPCIONES PERMITIDAS
      const excepcionesValidas = [
        /[a-záéíóúñ]+\-\d+/, // ej: manzana-4, lt-1, mz-4
        /\d+\-\d+/, // ej: 123-125
        /[a-záéíóúñ]+\-[a-záéíóúñ]+/ // ej: san-juan
      ]

      const esExcepcionValida = excepcionesValidas.some((regex) => normalizadaMinuscula.match(regex))

      const guionPersistente = normalizadaMinuscula.includes(' - ')
      const textoPersistente = textoPosterior.split(/\s+/).some((palabra) => normalizadaMinuscula.includes(palabra))

      if (!esExcepcionValida && (guionPersistente || textoPersistente)) {
        errores.push(`No se eliminó texto posterior al guion o el guion mismo: '- ${parteDerecha}'`)
      }

      if (!esExcepcionValida) {
        direccionBase = parteIzquierda
        const partesNormalizada = direccionNormalizada.split(/\s*-\s*/)
        direccionNormalizadaBase = partesNormalizada[0]?.trim()
      }
    }
  }

  // VALIDACIONES ADICIONALES
  if (direccionBase.includes('@') && direccionNormalizadaBase.includes('@')) {
    errores.push('Dirección con correo electrónico')
  }

  const phoneRegex = /\b\d{6,}\b/
  if (original.match(phoneRegex) && normalizada.match(phoneRegex)) {
    errores.push('Contiene número telefónico')
  }

  ciudadesConocidas.forEach((ciudad) => {
    if (original.startsWith(ciudad) && normalizada.startsWith(ciudad)) {
      errores.push(`Inicia con nombre de ciudad: ${ciudad}`)
    }
  })

  const institutionalRegex = /(aa\.?hh|asoc|a\.h\.|municipalid|ministeri|fiscali|condominio|cooperativ)/
  if (original.match(institutionalRegex) && normalizada.match(institutionalRegex)) {
    errores.push('Dirección institucional o de asentamiento')
  }

  manzanasLotes.forEach((termino) => {
    const pattern = new RegExp(`\\b${termino}\\b`, 'i')
    if (original.match(pattern) && normalizada.match(pattern)) {
      errores.push(`Contiene término de lote/manzana: ${termino}`)
    }
  })

  const noNumberRegex = /\b\d{1,4}\b/
  if (
    (original.includes('s/n') || original.includes('nro null') || !original.match(noNumberRegex)) &&
    (normalizada.includes('s/n') || normalizada.includes('nro null') || !normalizada.match(noNumberRegex))
  ) {
    errores.push('Dirección sin número')
  }

  const duplicatedRegex = /\b(\w+)\s+\1\b/
  if (original.match(duplicatedRegex) && normalizada.match(duplicatedRegex)) {
    errores.push('Palabra o número duplicado')
  }

  if (original.includes('referencia') && normalizada.includes('referencia')) {
    errores.push("Contiene palabra 'referencia'")
  }

  caracteresEspeciales.forEach((char) => {
    if (original.includes(char) && normalizada.includes(char)) {
      errores.push(`Caracter especial: ${char}`)
    }
  })

  erroresTipograficos.forEach((esperado, originalTypo) => {
    const patternOriginal = new RegExp(`\\b${originalTypo}\\b`, 'i')
    if (original.match(patternOriginal) && !normalizada.includes(esperado)) {
      errores.push(`No se normalizó '${originalTypo}' a '${esperado}'`)
    }
  })

  return errores
}

/**
 * Función principal para validar un array de trackings.
 * @param trackings - Array de objetos OlvaTrackings obtenidos de Prisma.
 * @returns Un array de resultados de validación.
 */
export function validarTrackings(
  trackings: Pick<OlvaTrackings, 'tracking' | 'address_id' | 'address' | 'address_normalized'>[]
): ExcelValidacionExportTrackings[] {
  const resultados: ExcelValidacionExportTrackings[] = []

  trackings.forEach((tracking) => {
    const errores: string[] = []

    const original = tracking.address?.toLowerCase()?.trim() || ''
    const normalizada = tracking.address_normalized?.toLowerCase()?.trim() || ''

    // === VALIDACIONES INICIALES (que me faltó incluir) ===
    if (tracking.address_id === 0) {
      errores.push('No georreferenciado')
    }
    if (original === normalizada) {
      errores.push('Sin normalización visible')
    }

    // Llama a la función de clasificación solo si la dirección tiene contenido
    if (original) {
      const erroresAdicionales = clasificarErrores(tracking.address, tracking.address_normalized)
      errores.push(...erroresAdicionales)
    } else {
      errores.push('Dirección vacía')
    }

    resultados.push({
      tracking: tracking.tracking,
      address_id: tracking.address_id,
      address: tracking.address || '',
      address_normalized: tracking.address_normalized || '',
      errores: errores.length > 0 ? errores.join('; ') : 'Correcta'
    })
  })

  return resultados
}
