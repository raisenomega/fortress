import type Database from 'better-sqlite3'
import { beforeEach, describe, expect, it } from 'vitest'
import { useConstruirStore } from '../stores/construir-store'
import { escribirUser, finishDraftPersistido } from './hilo-activo'
import { contadorDeListas, filasDe, rigDelHilo } from './hilo-activo-rig'
import { alMorirElDraft, rehidratar } from './rehidratar-el-hilo'

/** PASO 110: la saltada jamas se pierde — al morir el draft, el par ACTUAL. */
const A = { projectId: 'p1', modo: 'plan' } as const
const B = { projectId: 'p2', modo: 'plan' } as const
let db: Database.Database
beforeEach(() => void (db = rigDelHilo()))

describe('la secuencia asesina del 109, hecha test', () => {
  it('cambio de par DURANTE el draft + cierre: la vista queda en B, no en A', async () => {
    await escribirUser(A, 'pregunta en HF')
    useConstruirStore.setState({ draft: 'llegando...' })
    await rehidratar(B) // la guarda salta — y DEBE dejar la senal
    finishDraftPersistido('respuesta larga del plan')
    await alMorirElDraft(B) // lo que el effect hara al morir el draft
    expect(useConstruirStore.getState().messages).toEqual([])
    expect(useConstruirStore.getState().hiloActivo).toBeNull()
  })

  it('la respuesta fue al hilo de A, no al par B de la vista', async () => {
    await escribirUser(A, 'pregunta en HF')
    useConstruirStore.setState({ draft: 'llegando...' })
    await rehidratar(B)
    finishDraftPersistido('la respuesta')
    await new Promise((r) => setTimeout(r, 0)) // la escritura async del cajon
    const filas = filasDe(db)
    expect(filas).toHaveLength(2)
    expect(new Set(filas.map((f) => f.chat_id)).size).toBe(1)
  })

  it('MULTI-CAMBIO: A→B→C durante el draft; al morir queda el ACTUAL (C)', async () => {
    await escribirUser(A, 'x')
    await escribirUser(B, 'en B tambien hubo algo') // hilo B con contenido
    useConstruirStore.setState({ draft: 'llegando...', hiloActivo: null })
    await rehidratar(A)
    await rehidratar(B)
    const C = { projectId: null, modo: 'libre' } as const
    useConstruirStore.setState({ draft: null })
    await alMorirElDraft(C)
    expect(useConstruirStore.getState().messages).toEqual([])
    expect(useConstruirStore.getState().hiloActivo).toBeNull()
  })

  it('muerte por ERROR: el cierre con "No se pudo" tambien re-rehidrata', async () => {
    await escribirUser(A, 'x')
    useConstruirStore.setState({ draft: 'llegando...' })
    await rehidratar(B)
    finishDraftPersistido('No se pudo: se interrumpio')
    await alMorirElDraft(B)
    expect(useConstruirStore.getState().messages).toEqual([])
  })
})

describe('lo que NO cambia', () => {
  it('CAMINO FELIZ: sin salto no hay recarga espuria (una sola carga)', async () => {
    await rehidratar(A)
    const cargas = contadorDeListas()
    await escribirUser(A, 'hola')
    finishDraftPersistido('respuesta')
    await alMorirElDraft(A)
    expect(contadorDeListas()).toBe(cargas)
  })

  it('cambio de par SIN draft: rehidrata directo y la senal queda apagada', async () => {
    await escribirUser(A, 'hola')
    await rehidratar(B)
    expect(useConstruirStore.getState().rehidratacionPendiente).toBe(false)
  })
})
