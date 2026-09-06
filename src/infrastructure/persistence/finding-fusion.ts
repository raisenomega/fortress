import { identidadFusionada, planDeFusion } from '@domain/project/fusion-de-duplicados'
import { severidadDeLaSuperviviente, type FilaConSeveridad } from '@domain/project/severidad-al-fundir' // prettier-ignore
import { masUrgente } from '@domain/shared/severity'
import type { Db } from './database'
import { ELEVAR_SEVERIDAD, MARCAR_FUSIONADA, RECLASIFICAR_FINDING } from './finding-fusion-sql'

/** Lo que el backfill le pasa por cada fila que un agente acaba de clasificar. */
export interface Reclasificacion {
  readonly id: string
  readonly identidad: string
  readonly tipo: string
  readonly simbolo: string
}

export interface FindingFusion {
  /** Escribe tipo, simbolo e identidad nueva. NO fusiona: solo reclasifica. */
  reclasificar(filas: readonly Reclasificacion[]): void
  /** Fusiona las que compartan identidad. Devuelve cuantas quedaron absorbidas. */
  fusionar(filas: readonly FilaConSeveridad[]): number
}

/**
 * El colapso de duplicados, aparte del `sync` del escaneo y sin tocarlo: una
 * fila nueva sin duplicado se sigue insertando igual que hoy.
 *
 * Son dos pasos y no uno porque son dos decisiones: reclasificar la escribe un
 * agente, fusionar la decide la aritmetica de las fechas. Entre medias, y solo
 * entre medias, la base tiene dos filas con la misma clave.
 */
export function createFindingFusion(db: Db): FindingFusion {
  const reclasificarUna = db.prepare(RECLASIFICAR_FINDING)
  const marcar = db.prepare(MARCAR_FUSIONADA)
  const elevar = db.prepare(ELEVAR_SEVERIDAD)

  // A mano y no reenviando el objeto entero (como `toTouch`): asi no se cuela
  // por descuido un campo que tiene que quedarse quieto.
  const reclasificar = db.transaction((filas: readonly Reclasificacion[]) => {
    for (const f of filas) {
      reclasificarUna.run({ id: f.id, identity: f.identidad, tipo: f.tipo, simbolo: f.simbolo })
    }
  })

  // Indivisible: a medio camino quedarian dos filas con la misma clave y ningun
  // rastro de cual manda, que es exactamente el estado que esto viene a impedir.
  const fusionar = db.transaction((filas: readonly FilaConSeveridad[]): number => {
    const porId = new Map(filas.map((f) => [f.id, f.severity]))
    let absorbidas = 0
    for (const fusion of planDeFusion(filas)) {
      for (const id of fusion.absorbidas) {
        marcar.run({
          id,
          motivo: `fusionada-con-${fusion.ganadora}`,
          identity: identidadFusionada(fusion.ganadora, fusion.identidad)
        })
        absorbidas += 1
      }
      // Y la superviviente se queda con la MAXIMA: fundir no baja la gravedad.
      const maxima = severidadDeLaSuperviviente(fusion, porId, masUrgente)
      if (maxima !== porId.get(fusion.ganadora)) {
        elevar.run({ id: fusion.ganadora, severity: maxima })
      }
    }
    return absorbidas
  })

  return {
    reclasificar: (filas) => reclasificar(filas),
    fusionar: (filas) => fusionar(filas)
  }
}
