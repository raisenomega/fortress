import type Database from 'better-sqlite3'
import { beforeEach, describe, expect, it } from 'vitest'
import { useBarraStore } from '../stores/barra-store'
import { useConstruirStore } from '../stores/construir-store'
import { borrarHiloYLimpiar, cargarListas, elegirHilo, nuevoHiloSuelto } from './barra-del-chat'
import { elPuerto, escribirUser } from './hilo-activo'
import { rigDelHilo } from './hilo-activo-rig'
import { parDeLaVista, rehidratar, alMorirElDraft } from './rehidratar-el-hilo'

/** PASO 116: con varios hilos de libre, la seleccion de la barra MANDA. */
const LIBRE = parDeLaVista(null, 'libre')
let db: Database.Database
const dosHilos = async (): Promise<{ a: { id: string }; b: { id: string } }> => {
  const a = await elPuerto().createHilo({ projectId: null, titulo: 'A', modo: 'libre' })
  const b = await elPuerto().createHilo({ projectId: null, titulo: 'B', modo: 'libre' })
  await elPuerto().addToHilo(b.id, { role: 'user', content: 'b es el reciente', agentId: null, mode: 'supervisado', engine: 'claude-code' }) // prettier-ignore
  return { a, b }
}

beforeEach(() => {
  db = rigDelHilo()
  void db
  useBarraStore.setState({ seleccion: null })
})

describe('la seleccion de la barra gana', () => {
  it('TEST ESTRELLA: clic en A, cambiar de vista y volver -> sigue A, no el reciente', async () => {
    const { a } = await dosHilos()
    await elegirHilo((await elPuerto().listHilos(null)).find((h) => h.id === a.id)!)
    await rehidratar(LIBRE) // volver a la vista: el par ya no decide, manda el clic
    expect(useConstruirStore.getState().hiloActivo?.id).toBe(a.id)
  })

  it('GEMELO: con draft en vuelo, al morir el draft sigue EL ELEGIDO', async () => {
    const { a } = await dosHilos()
    await elegirHilo((await elPuerto().listHilos(null)).find((h) => h.id === a.id)!)
    useConstruirStore.setState({ draft: 'llegando...' })
    await rehidratar(parDeLaVista('p1', 'plan')) // cambiar de vista: la guarda senala
    useConstruirStore.setState({ draft: null })
    await alMorirElDraft(LIBRE)
    expect(useConstruirStore.getState().hiloActivo?.id).toBe(a.id)
  })

  it('NUEVO = ACTIVO: pantalla limpia y el primer mensaje crea el hilo que manda', async () => {
    await dosHilos()
    nuevoHiloSuelto()
    expect(useConstruirStore.getState().messages).toEqual([])
    await escribirUser(LIBRE, 'primero del nuevo')
    const nuevo = useConstruirStore.getState().hiloActivo
    await rehidratar(LIBRE)
    expect(useConstruirStore.getState().hiloActivo?.id).toBe(nuevo?.id)
  })

  it('BORRAR ACTIVO = LIMPIA: sin seleccion, sin activo, pantalla limpia', async () => {
    const { a } = await dosHilos()
    await elegirHilo((await elPuerto().listHilos(null)).find((h) => h.id === a.id)!)
    await borrarHiloYLimpiar(a.id)
    expect(useBarraStore.getState().seleccion).toBeNull()
    expect(useConstruirStore.getState().hiloActivo).toBeNull()
    expect(useConstruirStore.getState().messages).toEqual([])
  })

  it('RENDER: las listas de la barra son SOLO libre suelto (ni repo ni carpeta)', async () => {
    const { a, b } = await dosHilos()
    await elPuerto().createHilo({ projectId: 'p1', titulo: 'de repo', modo: 'plan' })
    db.prepare("INSERT INTO carpetas VALUES ('c1','T','','2026-10-08','2026-10-08')").run()
    await elPuerto().createHilo({ projectId: null, titulo: 'en carpeta', modo: 'libre', carpetaId: 'c1' }) // prettier-ignore
    const listas = await cargarListas()
    expect(listas.sueltos.map((h) => h.id).sort()).toEqual([a.id, b.id].sort())
    expect(listas.carpetas.map((c) => c.nombre)).toEqual(['T'])
  })
})
