import { BLOQUE_DE_TIPOS } from './bloque-de-tipos'
import { REGLA_DEL_SIMBOLO } from './report-contract'

export interface CandidataEnElPrompt {
  readonly id: string
  readonly line: number | null
  readonly tipo: string
  readonly title: string
}

export interface ItemAReclasificar {
  readonly id: string
  readonly file: string
  readonly line: number | null
  readonly title: string
  readonly severity: string
  readonly candidata: CandidataEnElPrompt | null
}

/**
 * El prompt de la Fase B (backfill de identidades, ADR-084 / ADR-071).
 *
 * Manda la REGLA DE ELECCION entera —cada tipo con su definicion y los
 * desempates— porque ADR-081 (c) lo exige: un agente que elige por el nombre
 * clasifica inconsistente y la fusion, que funde solo por identidad completa,
 * no colapsa nada. Es el MISMO bloque que lee el escaner, emitido, no copiado.
 *
 * SOLO pide tipo, simbolo y gemela. Ni titulo ni severidad: el titulo se
 * reescribe cada corrida y la severidad mueve el score — una pieza que viene a
 * estabilizar identidades no toca el tablero de paso.
 */
export function promptDeReclasificacion(items: readonly ItemAReclasificar[]): string {
  return [
    `Clasifica ${items.length} hallazgos que YA existen en la base de FORTRESS y siguen con`,
    'una identidad antigua. Para cada uno devuelve su tipo, su simbolo y si es el MISMO',
    'defecto que su candidata. Lee el fichero y la linea indicados antes de decidir.',
    'NO cambies el titulo ni la severidad.',
    '',
    '- tipo: ELIGE uno de la lista, con su definicion, y desempata como se indica. Si de',
    '  verdad no encaja, pon "otro": es preferible a forzar un tipo que no es.',
    BLOQUE_DE_TIPOS,
    REGLA_DEL_SIMBOLO,
    '- gemela: cuando se indica una CANDIDATA —una fila que el escaner de hoy dejo en el',
    '  mismo sitio— decide si es el MISMO defecto (el mismo agujero, no solo la misma',
    '  clase). Si lo es, devuelve su id en "gemela" y usa SU tipo; si no, "gemela": null.',
    '',
    'LOS HALLAZGOS:',
    JSON.stringify(items, null, 1),
    '',
    'Termina con UN bloque ```json {"clasificados":[{"id":"…","tipo":"…","simbolo":"…",',
    '"gemela":"id-de-la-candidata-o-null"}]}``` y nada despues.'
  ].join('\n')
}
