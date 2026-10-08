import type Database from 'better-sqlite3'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useBarraStore } from '../stores/barra-store'
import { useConstruirStore } from '../stores/construir-store'
import { elegirHilo } from './barra-del-chat'
import { _inyectarConfirmador } from './confirmador'
import { borrarCarpetaConTodo, borrarCarpetaMoviendo, renombrarCarpeta } from './gestionar-carpetas' // prettier-ignore
import { elPuerto } from './hilo-activo'
import { filasDe, rigDelHilo } from './hilo-activo-rig'

/** Revision B (PASO 121): el ⋯ de una carpeta — renombrar y borrar con ELECCION. */
const MSG = { role: 'user', content: 'x', agentId: null, mode: 'supervisado', engine: 'claude-code' } as const // prettier-ignore
let db: Database.Database
const carpetaConHilo = async (): Promise<{ cid: string; hid: string }> => {
  const c = await elPuerto().crearCarpeta('salud')
  const h = await elPuerto().createHilo({ projectId: null, titulo: 'dieta', modo: 'libre', carpetaId: c.id }) // prettier-ignore
  await elPuerto().addToHilo(h.id, MSG)
  return { cid: c.id, hid: h.id }
}
beforeEach(() => {
  db = rigDelHilo()
  useBarraStore.setState({ seleccion: null, expandidas: [], refresco: 0 })
  _inyectarConfirmador(() => true)
})
afterEach(() => _inyectarConfirmador(null))

describe('la gestion de la carpeta', () => {
  it('RENOMBRAR CARPETA: cambia el nombre', async () => {
    const { cid } = await carpetaConHilo()
    await renombrarCarpeta(cid, 'salud y dieta')
    expect((await elPuerto().listarCarpetas())[0]!.nombre).toBe('salud y dieta')
  })

  it('BORRAR MOVIENDO: los hilos van a Sin carpeta, NO se pierden', async () => {
    const { cid, hid } = await carpetaConHilo()
    expect(await borrarCarpetaMoviendo(cid, 'salud')).toBe(true)
    expect(await elPuerto().listarCarpetas()).toEqual([])
    expect((await elPuerto().listarSueltos()).map((h) => h.id)).toEqual([hid])
    expect(await elPuerto().listByHilo(hid)).toHaveLength(1)
  })

  it('BORRAR CON TODO: hilos + mensajes + carpeta fuera; el activo dentro -> limpia', async () => {
    const { cid, hid } = await carpetaConHilo()
    await elegirHilo((await elPuerto().hilosPorCarpeta(cid))[0]!)
    expect(await borrarCarpetaConTodo(cid, 'salud')).toBe(true)
    expect(await elPuerto().listarCarpetas()).toEqual([])
    expect(await elPuerto().listByHilo(hid)).toEqual([])
    expect(useConstruirStore.getState().hiloActivo).toBeNull()
    expect(useBarraStore.getState().seleccion).toBeNull()
  })

  it('CANCELAR no borra ni mueve nada', async () => {
    _inyectarConfirmador(() => false)
    const { cid } = await carpetaConHilo()
    expect(await borrarCarpetaMoviendo(cid, 'salud')).toBe(false)
    expect(await borrarCarpetaConTodo(cid, 'salud')).toBe(false)
    expect((await elPuerto().hilosPorCarpeta(cid))).toHaveLength(1)
  })

  it('AISLAMIENTO: repo y legado intactos tras borrar con todo', async () => {
    const { cid } = await carpetaConHilo()
    const repo = await elPuerto().createHilo({ projectId: 'p1', titulo: 'del repo', modo: 'plan' }) // prettier-ignore
    await elPuerto().addToHilo(repo.id, MSG)
    db.prepare("INSERT INTO chat_messages (id, project_id, chat_id, role, content, agent_id, mode, engine, created_at) VALUES ('m9','p1',NULL,'user','legado',NULL,'supervisado','claude-code','2026-10-08')").run() // prettier-ignore
    await borrarCarpetaConTodo(cid, 'salud')
    expect(await elPuerto().listByHilo(repo.id)).toHaveLength(1)
    expect(filasDe(db).filter((f) => f.content === 'legado')).toHaveLength(1)
  })
})
