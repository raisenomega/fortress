import { beforeEach, describe, expect, it } from 'vitest'
import { useBarraStore } from '../stores/barra-store'
import { useConstruirStore } from '../stores/construir-store'
import { elegirHilo, nuevoHiloSuelto } from './barra-del-chat'
import { elPuerto, escribirUser, finishDraftPersistido } from './hilo-activo'
import { rigDelHilo } from './hilo-activo-rig'
import { parDeLaVista } from './rehidratar-el-hilo'

/** Revision B (PASO 121): cambiar de hilo con un turno en vuelo NO desvia la
 *  respuesta — cae en el hilo del TURNO, como claude.ai. Medido en rojo. */
const LIBRE = parDeLaVista(null, 'libre')
const MSG = { role: 'user', content: 'x', agentId: null, mode: 'supervisado', engine: 'claude-code' } as const // prettier-ignore
const espera = (): Promise<void> => new Promise((r) => setTimeout(r, 0))
const textosDe = async (id: string): Promise<string[]> =>
  (await elPuerto().listByHilo(id)).map((m) => m.content)

beforeEach(() => {
  rigDelHilo()
  useBarraStore.setState({ seleccion: null, expandidas: [] })
})

describe('el turno pertenece a su hilo', () => {
  it('CLIC CON DRAFT: la respuesta cae en SU hilo, no en el nuevo; la vista ajena ni se entera', async () => {
    const a = await nuevoHiloSuelto()
    useConstruirStore.getState().push({ role: 'user', text: 'pregunta' })
    await escribirUser(LIBRE, 'pregunta') // el turno nace en A
    useConstruirStore.setState({ draft: 'llegando...' })
    const b = await elPuerto().createHilo({ projectId: null, titulo: 'B', modo: 'libre' })
    await elPuerto().addToHilo(b.id, MSG)
    await elegirHilo(b) // cambio EN PLENA CORRIDA
    finishDraftPersistido('la respuesta')
    await espera()
    expect(await textosDe(a.id)).toContain('la respuesta')
    expect(await textosDe(b.id)).not.toContain('la respuesta')
    const vista = useConstruirStore.getState()
    expect(vista.messages.map((m) => m.text)).not.toContain('la respuesta')
    expect(vista.draft).toBeNull()
  })

  it('CAMINO FELIZ: sin cambio, la respuesta se pega a la vista y al mismo hilo', async () => {
    const a = await nuevoHiloSuelto()
    useConstruirStore.getState().push({ role: 'user', text: 'pregunta' })
    await escribirUser(LIBRE, 'pregunta')
    useConstruirStore.setState({ draft: 'llegando...' })
    finishDraftPersistido('la respuesta')
    await espera()
    expect(await textosDe(a.id)).toContain('la respuesta')
    expect(useConstruirStore.getState().messages.map((m) => m.text)).toContain('la respuesta')
    expect(useConstruirStore.getState().draft).toBeNull()
  })
})
