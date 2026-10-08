import type Database from 'better-sqlite3'
import { beforeEach, describe, expect, it } from 'vitest'
import { useBarraStore } from '../stores/barra-store'
import { useConstruirStore } from '../stores/construir-store'
import { elPuerto } from './hilo-activo'
import { filasDe, rigDelHilo } from './hilo-activo-rig'
import { _resetBarrido, barrerVaciosUnaVez } from './limpiar-vacios'
import { pintarHilo } from './rehidratar-el-hilo'

/** Revision A (PASO 120): el «cerrar» del contrato — los vacios de la sesion
 *  anterior se barren al ARRANCAR; los vivos y lo ajeno, jamas. */
const MSG = { role: 'user', content: 'x', agentId: null, mode: 'supervisado', engine: 'claude-code' } as const // prettier-ignore
let db: Database.Database
beforeEach(() => {
  db = rigDelHilo()
  _resetBarrido()
  useBarraStore.setState({ seleccion: null })
})

describe('el barrido al abrir', () => {
  it('LIMPIA AL ABRIR: el vacio de ayer se barre; el que tiene mensajes queda', async () => {
    await elPuerto().createHilo({ projectId: null, titulo: 'vacio de ayer', modo: 'libre' })
    const vivo = await elPuerto().createHilo({ projectId: null, titulo: 'con vida', modo: 'libre' }) // prettier-ignore
    await elPuerto().addToHilo(vivo.id, MSG)
    await barrerVaciosUnaVez()
    expect((await elPuerto().listHilos(null)).map((h) => h.id)).toEqual([vivo.id])
  })

  it('RESPETA A LOS VIVOS: el activo y la seleccion no se barren ni vacios', async () => {
    const h = await elPuerto().createHilo({ projectId: null, titulo: 'Nuevo chat', modo: 'libre' }) // prettier-ignore
    pintarHilo(h, [])
    useBarraStore.getState().setSeleccion(h.id)
    await barrerVaciosUnaVez()
    expect((await elPuerto().listHilos(null)).map((x) => x.id)).toContain(h.id)
  })

  it('UNA VEZ ES UNA: tras el arranque, un vacio nuevo NO se re-barre', async () => {
    await barrerVaciosUnaVez()
    const eager = await elPuerto().createHilo({ projectId: null, titulo: 'Nuevo chat', modo: 'libre' }) // prettier-ignore
    await barrerVaciosUnaVez() // otro cambio de par: ya no corre
    expect((await elPuerto().listHilos(null)).map((x) => x.id)).toContain(eager.id)
  })

  it('AISLAMIENTO: repo y legado intactos — el barrido solo ve el plano de libre', async () => {
    const repo = await elPuerto().createHilo({ projectId: 'p1', titulo: 'del repo', modo: 'plan' })
    db.prepare("INSERT INTO chat_messages (id, project_id, chat_id, role, content, agent_id, mode, engine, created_at) VALUES ('m1','p1',NULL,'user','legado',NULL,'supervisado','claude-code','2026-10-08')").run() // prettier-ignore
    useConstruirStore.setState({ hiloActivo: null })
    await barrerVaciosUnaVez()
    expect((await elPuerto().listHilos('p1')).map((x) => x.id)).toContain(repo.id)
    expect(filasDe(db).filter((f) => f.content === 'legado')).toHaveLength(1)
  })
})
