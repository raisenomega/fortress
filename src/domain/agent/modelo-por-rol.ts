import { MODELO_DE_OMEGA, type Peldano } from './escalera-de-modelos'

/**
 * El modelo de cada agente que NO pasa por el catalogo de ADR-078 (enmienda del
 * 2026-10-05): la UNICA fuente. Antes estos agentes no declaraban nada y
 * heredaban el modelo del CLI — medido: Fable una noche, Opus a otra hora.
 *
 * En ALIAS, nunca un id fijo: cada uno sube solo con el siguiente modelo de su
 * familia (el molde de ADR-078). El criterio es el de ADR-078 —juzgar → opus,
 * ejecutar → sonnet, barrer → haiku— con UNA excepcion deliberada: el
 * GENERADOR va en opus, porque es el equivalente del Productor del Terminal
 * (que la escalera pone en opus) y lo que produce se juzga despues por OMEGA.
 */
export const MODELO_POR_ROL = {
  analista: 'opus',
  critico: 'opus',
  generador: 'opus',
  omega: MODELO_DE_OMEGA,
  construir: 'opus',
  configuracion: 'sonnet',
  borrador: 'sonnet',
  episodio: 'sonnet',
  grafo: 'sonnet',
  chatApi: 'opus',
  /** El chat LIBRE (PASO 91): conversa sin repo, powers-off. Opus como el
   *  productor y chatApi: es conversacion de primera linea, no un barrido. */
  libre: 'opus'
} as const satisfies Record<string, Peldano>

export type RolConModelo = keyof typeof MODELO_POR_ROL
