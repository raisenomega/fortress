import type { Carpeta } from '@domain/chat/carpeta-de-chat'
import type { ChatRepository } from '@domain/chat/chat-repository'
import { newId, nowIso } from '@domain/shared/id'
import { aHilo, type HiloRow } from './sqlite-chats-hilos'
import type { Db } from './database'

interface CarpetaRow {
  readonly id: string
  readonly nombre: string
  readonly instrucciones: string
  readonly created_at: string
  readonly updated_at: string
}

const aCarpeta = (r: CarpetaRow): Carpeta => ({
  id: r.id,
  nombre: r.nombre,
  instrucciones: r.instrucciones,
  createdAt: r.created_at,
  updatedAt: r.updated_at
})

type OpsDeCarpetas = Pick<
  ChatRepository,
  | 'crearCarpeta' | 'listarCarpetas' | 'renombrarCarpeta' | 'borrarCarpeta'
  | 'borrarCarpetaConHilos' | 'moverHilo' | 'renombrarHilo'
  | 'listarHilosPorCarpeta' | 'listarHilosSueltos'
> // prettier-ignore

/** Carpetas del organizador de LIBRE (PASO 114): misma familia que los hilos
 *  de B0, otro modulo por el techo de lineas. Borrar carpeta NO borra hilos
 *  (SET NULL por esquema); llevarselos es el gesto APARTE, en transaccion.
 *  RENAME MANDA: el titulo solo nace automatico; aqui nada lo recalcula. */
export function carpetasDeChat(db: Db): OpsDeCarpetas {
  const insertar = db.prepare('INSERT INTO carpetas (id, nombre, instrucciones, created_at, updated_at) VALUES (?, ?, ?, ?, ?)') // prettier-ignore
  const todas = db.prepare('SELECT * FROM carpetas ORDER BY nombre ASC')
  const renombrar = db.prepare('UPDATE carpetas SET nombre = ?, updated_at = ? WHERE id = ?')
  const borrar = db.prepare('DELETE FROM carpetas WHERE id = ?')
  const borrarHilos = db.prepare('DELETE FROM chats WHERE carpeta_id = ?')
  const mover = db.prepare('UPDATE chats SET carpeta_id = ? WHERE id = ?')
  const titular = db.prepare('UPDATE chats SET titulo = ? WHERE id = ?')
  const porCarpeta = db.prepare('SELECT * FROM chats WHERE carpeta_id = ? ORDER BY updated_at DESC') // prettier-ignore
  const sueltos = db.prepare('SELECT * FROM chats WHERE project_id IS NULL AND carpeta_id IS NULL ORDER BY updated_at DESC') // prettier-ignore

  return {
    crearCarpeta: (nombre) => {
      const ahora = nowIso()
      const carpeta: Carpeta = { id: newId(), nombre, instrucciones: '', createdAt: ahora, updatedAt: ahora } // prettier-ignore
      insertar.run(carpeta.id, nombre, '', ahora, ahora)
      return carpeta
    },
    listarCarpetas: () => (todas.all() as CarpetaRow[]).map(aCarpeta),
    renombrarCarpeta: (id, nombre) => void renombrar.run(nombre, nowIso(), id),
    borrarCarpeta: (id) => void borrar.run(id),
    borrarCarpetaConHilos: db.transaction((id: string) => {
      borrarHilos.run(id)
      borrar.run(id)
    }),
    moverHilo: (hiloId, carpetaId) => void mover.run(carpetaId, hiloId),
    renombrarHilo: (hiloId, titulo) => void titular.run(titulo, hiloId),
    listarHilosPorCarpeta: (carpetaId) => (porCarpeta.all(carpetaId) as HiloRow[]).map(aHilo),
    listarHilosSueltos: () => (sueltos.all() as HiloRow[]).map(aHilo)
  }
}
