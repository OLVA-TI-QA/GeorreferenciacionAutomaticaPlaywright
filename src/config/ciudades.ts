export const typeCiudad = {
  Lima: { idSede: 43, idOficina: 39 },
  Cusco: { idSede: 174, idOficina: 342 }
} as const

export type TipoCiudad = keyof typeof typeCiudad
