import { MODULOS_AUDITORIA, type ModuloAuditoria } from './modulo-auditoria'
import { SIN_DECLARACION, type DeclaracionDeModulos } from './declaracion-de-modulos'
import { modulosDetectados, type EvidenciaDeModulos } from './modulos-detectados'
import { razonDeclaradoNo, razonNoSeDecide, razonSinSenal } from './razon-de-modulo'
import { MODULOS_CON_SENAL } from './senales-de-modulo'

/** Un modulo que NO entra, con la razon por la que no entra. Nunca sin ella. */
export interface ModuloConRazon {
  readonly modulo: ModuloAuditoria
  readonly razon: string
}

/**
 * El veredicto sobre los doce. TRES listas y no dos, porque hay tres estados y
 * no dos: el vocabulario de ADR-083 es `aplica: si|no|no-consta`, y meter el
 * «no consta» de M8/M3 en los descartados afirmaria que no aplican —que es
 * precisamente lo que nadie ha comprobado todavia—.
 */
export interface VeredictoDeModulos {
  readonly aplicables: readonly ModuloAuditoria[]
  readonly descartados: readonly ModuloConRazon[]
  readonly sinConstancia: readonly ModuloConRazon[]
}

interface Cajas {
  readonly aplicables: ModuloAuditoria[]
  readonly descartados: ModuloConRazon[]
  readonly sinConstancia: ModuloConRazon[]
}

/**
 * Un modulo cae en UNA caja, y siempre en alguna: no hay salida sin veredicto.
 *
 * La declaracion se mira ANTES que la deteccion, en los dos sentidos. Si el
 * operador dice que no, no importa que haya un `.tsx`: el que sabe si esa UI
 * entra en el alcance es el, y una senal de fichero no puede desdecirle. Ese es
 * el orden de `readCorpusConfig`, que sustituye lo descubierto y no al reves.
 */
function repartir(
  cajas: Cajas,
  modulo: ModuloAuditoria,
  detectado: boolean,
  declarado: boolean | undefined
): void {
  if (declarado === false) cajas.descartados.push({ modulo, razon: razonDeclaradoNo(modulo) })
  else if (declarado === true || detectado) cajas.aplicables.push(modulo)
  else if (MODULOS_CON_SENAL.includes(modulo))
    cajas.descartados.push({ modulo, razon: razonSinSenal(modulo) })
  else cajas.sinConstancia.push({ modulo, razon: razonNoSeDecide(modulo) })
}

/**
 * Que modulos de la campana aplican a este proyecto (ADR-083, Fase 1). Puro:
 * la evidencia la reune la infraestructura, aqui solo se decide.
 *
 * La declaracion del operador SUSTITUYE lo descubierto, en los dos sentidos
 * —tambien para decir que no—: es la doctrina de `readCorpusConfig`, quien
 * declara sabe mejor. Y no recorta: al contrario que `detectStack`, que se
 * queda con tres etiquetas, aqui salen los DOCE, cada uno en su caja y con su
 * razon. Un hueco seria un descuido, no una decision (decision 4).
 */
export function modulosAplicables(
  evidencia: EvidenciaDeModulos,
  declaracion: DeclaracionDeModulos = SIN_DECLARACION
): VeredictoDeModulos {
  const detectados = modulosDetectados(evidencia)
  const cajas: Cajas = { aplicables: [], descartados: [], sinConstancia: [] }

  for (const modulo of MODULOS_AUDITORIA) {
    repartir(cajas, modulo, detectados.has(modulo), declaracion[modulo])
  }
  return cajas
}
