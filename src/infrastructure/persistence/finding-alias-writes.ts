import type { Db } from './database'
import * as SQL from './finding-alias-sql'

export interface Superviviente {
  readonly id: string
  readonly identity: string
}

interface FilaDelAlias {
  readonly id: string
  readonly project_id: string
  readonly identity: string
  readonly extinct_reason: string | null
}

export interface AliasWrites {
  /** La fila a la que lleva una clave, o null. Un alias hacia una fila que no
   *  existe o hacia una ABSORBIDA no manda: se retira y se dice null. */
  resolver(projectId: string, clave: string): Superviviente | null
  registrar(projectId: string, clave: string, findingId: string, origen: string, at: string): void
  /** Antes de marcar una absorbida: su clave pasa a ser alias de la ganadora y
   *  lo que apuntaba a ella tambien. Lee la clave AHORA, que el centinela la borra. */
  retirarClave(absorbida: string, ganadora: string, origen: string, at: string): void
}

const absorbida = (f: FilaDelAlias): boolean =>
  (f.extinct_reason ?? '').startsWith('fusionada-con-')

/**
 * Las escrituras de alias (ADR-101, palanca 2). Fail-closed en la lectura: un
 * alias solo redirige a una superviviente; si lleva a nadie o a una absorbida,
 * se borra —queda dicho en la propia tabla— y el sync inserta como siempre.
 */
export function createAliasWrites(db: Db): AliasWrites {
  const buscar = db.prepare(SQL.SELECT_ALIAS)
  const fila = db.prepare(SQL.SELECT_SUPERVIVIENTE)
  const insertar = db.prepare(SQL.REGISTRAR_ALIAS)
  const reapuntar = db.prepare(SQL.REAPUNTAR_ALIAS)
  const borrar = db.prepare(SQL.BORRAR_ALIAS)
  const registrar = (projectId: string, clave: string, findingId: string, origen: string, at: string): void => void insertar.run({ projectId, clave, findingId, origen, at }) // prettier-ignore
  return {
    resolver: (projectId, clave) => {
      const alias = buscar.get(projectId, clave) as { finding_id: string } | undefined
      if (alias === undefined) return null
      const f = fila.get(alias.finding_id) as FilaDelAlias | undefined
      if (f === undefined || f.project_id !== projectId || absorbida(f)) { borrar.run(projectId, clave); return null } // prettier-ignore
      return { id: f.id, identity: f.identity }
    },
    registrar,
    retirarClave: (id, ganadora, origen, at) => {
      const f = fila.get(id) as FilaDelAlias | undefined
      if (f === undefined) return
      registrar(f.project_id, f.identity, ganadora, origen, at)
      reapuntar.run({ projectId: f.project_id, absorbida: id, ganadora })
    }
  }
}
