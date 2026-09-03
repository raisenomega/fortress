import {
  esRechazada,
  MOTIVOS_DE_RECHAZO,
  validarEntrada,
  type EntradaAtendida,
  type Rechazada
} from './atendidos-contrato'

export interface RegistroLeido {
  readonly validas: readonly EntradaAtendida[]
  readonly rechazadas: readonly Rechazada[]
}

const VACIO: RegistroLeido = { validas: [], rechazadas: [] }

/** Los ids que aparecen mas de una vez. Ver abajo por que no se resuelve el empate. */
function duplicados(entradas: readonly EntradaAtendida[]): ReadonlySet<string> {
  const vistos = new Set<string>()
  const repetidos = new Set<string>()
  for (const e of entradas) {
    if (vistos.has(e.id)) repetidos.add(e.id)
    vistos.add(e.id)
  }
  return repetidos
}

/**
 * Lee el registro que alguien dejo fuera de la app. TOLERANTE por diseno: lo que
 * no cumple sale con su motivo y nunca se lanza, porque el fichero puede estar a
 * medio escribir y una excepcion aqui perderia tambien las entradas buenas.
 *
 * Un id REPETIDO invalida sus dos entradas, no gana la ultima: dos cierres
 * distintos para la misma observacion son una intencion ambigua, y elegir una
 * seria inventarla. El operador lo ve en el resumen y arregla el fichero.
 *
 * Lo que NO se valida aqui es que el id exista: eso lo sabe la base, y
 * preguntarselo dos veces seria consultar antes de escribir sin necesidad.
 */
export function leerRegistro(raw: unknown): RegistroLeido {
  if (!Array.isArray(raw)) return VACIO

  const validadas = raw.map(validarEntrada)
  const buenas = validadas.filter((v): v is EntradaAtendida => !esRechazada(v))
  const repetidos = duplicados(buenas)

  return {
    validas: buenas.filter((e) => !repetidos.has(e.id)),
    rechazadas: [
      ...validadas.filter(esRechazada),
      ...buenas
        .filter((e) => repetidos.has(e.id))
        .map((e) => ({ id: e.id, motivo: MOTIVOS_DE_RECHAZO.ID_DUPLICADO }))
    ]
  }
}

/** El JSON crudo, sin que un fichero roto llegue como excepcion. */
export function parsearRegistro(contenido: string): RegistroLeido {
  try {
    return leerRegistro(JSON.parse(contenido))
  } catch {
    return VACIO
  }
}
