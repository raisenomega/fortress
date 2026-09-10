import { decidir, type Caja } from './cascada-de-modulos'
import { SIN_DECLARACION, type DeclaracionDeModulos } from './declaracion-de-modulos'
import { MODULOS_AUDITORIA, type ModuloAuditoria } from './modulo-auditoria'
import { modulosDetectados, type EvidenciaDeModulos } from './modulos-detectados'
import { MODULOS_A_JUICIO, type VeredictoAplicabilidad } from './veredicto-de-aplicabilidad'

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

type Cajas = Record<Caja, ModuloConRazon[]>

/**
 * Que modulos de la campana aplican a este proyecto (ADR-083). Puro: la
 * evidencia la reune la infraestructura y el juicio lo trae YA RESUELTO quien
 * pudo gastar un proceso. Aqui solo se decide, y por eso se prueba con objetos
 * en memoria y sin lanzar nada.
 *
 * No recorta: al contrario que `detectStack`, que se queda con tres etiquetas,
 * aqui salen los DOCE, cada uno en su caja y con su razon. Un hueco seria un
 * descuido, no una decision (decision 4).
 */
export function modulosAplicables(
  evidencia: EvidenciaDeModulos,
  declaracion: DeclaracionDeModulos = SIN_DECLARACION,
  veredictos: readonly VeredictoAplicabilidad[] = []
): VeredictoDeModulos {
  const detectados = modulosDetectados(evidencia)
  const cajas: Cajas = { aplicables: [], descartados: [], sinConstancia: [] }

  for (const modulo of MODULOS_AUDITORIA) {
    const { caja, razon } = decidir({
      modulo,
      declarado: declaracion[modulo],
      detectado: detectados.has(modulo),
      veredicto: veredictos.find((v) => v.modulo === modulo)
    })
    cajas[caja].push({ modulo, razon })
  }

  return {
    aplicables: cajas.aplicables.map((m) => m.modulo),
    descartados: cajas.descartados,
    sinConstancia: cajas.sinConstancia
  }
}

/**
 * Los que quedan sin resolver GRATIS y justifican el spawn. Se calcula con la
 * misma cascada que decide —no con una copia de sus reglas— para que ahorrar
 * un juicio y concederlo no puedan discrepar nunca.
 */
export function pendientesDeJuicio(
  evidencia: EvidenciaDeModulos,
  declaracion: DeclaracionDeModulos = SIN_DECLARACION
): readonly ModuloAuditoria[] {
  const { sinConstancia } = modulosAplicables(evidencia, declaracion)
  return sinConstancia.map((m) => m.modulo).filter((m) => MODULOS_A_JUICIO.includes(m))
}
