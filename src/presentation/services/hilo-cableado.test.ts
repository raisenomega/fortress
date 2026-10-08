import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it } from 'vitest'
import { useConstruirStore } from '../stores/construir-store'
import { escribirUser, rehidratar } from './hilo-activo'
import { rigDelHilo } from './hilo-activo-rig'

/** B1, el cableado: la guarda del draft y los pins de INVOCACION (la clase
 *  del 91/96: un import suelto no es un cable). */
beforeEach(() => void rigDelHilo())

describe('la guarda del draft en vuelo', () => {
  it('rehidratar NO pisa un turno que esta llegando', async () => {
    await escribirUser({ projectId: 'p1', modo: 'plan' }, 'antes')
    useConstruirStore.setState({ messages: [{ role: 'user', text: 'en memoria' }], draft: 'llegando...' }) // prettier-ignore
    await rehidratar({ projectId: 'p1', modo: 'plan' })
    expect(useConstruirStore.getState().messages).toEqual([{ role: 'user', text: 'en memoria' }])
  })
})

describe('las bocas estan cableadas (pins a la invocacion)', () => {
  const fuente = (r: string): string => readFileSync(r, 'utf8')

  it('los tres servicios de envio escriben por las bocas PERSISTIDAS', () => {
    for (const f of ['construir-service', 'construir-libre', 'construir-execute']) {
      const src = fuente(`src/presentation/services/${f}.ts`)
      expect(src).toContain('pushUserPersistido(')
      expect(src).toContain('finishDraftPersistido(')
    }
  })

  it('la vista rehidrata al montar/cambiar de par, con el par de la vista', () => {
    const vista = fuente('src/presentation/components/construir/ConstruirView.tsx')
    expect(vista).toContain('rehidratar(parDeLaVista(')
    expect(vista).toContain('useEffect(')
  })
})
