import type { HiloDeChat } from '@domain/chat/hilo-de-chat'
import { afterEach, describe, expect, it } from 'vitest'
import { conAlmacen } from './almacen-de-la-barra.test'
import { useBarraStore } from './barra-store'
import { useConstruirStore } from './construir-store'

/** PASO 116/120: el store de la barra — toggle y acordeon persisten. */

afterEach(() => void Reflect.deleteProperty(globalThis, 'localStorage'))

const HILO: HiloDeChat = { id: 'h1', projectId: null, titulo: 'vivo', modo: 'libre', carpetaId: null, createdAt: '2026-10-08', updatedAt: '2026-10-08' } // prettier-ignore

describe('el store de la barra', () => {
  it('toggle voltea el estado y lo persiste', () => {
    const celdas: Record<string, string> = {}
    conAlmacen(celdas)
    useBarraStore.setState({ abierta: true })
    useBarraStore.getState().toggle()
    expect(useBarraStore.getState().abierta).toBe(false)
    expect(celdas['fortress-barra-del-chat']).toBe('cerrada')
  })

  it('ACORDEON: toggleCarpeta despliega, persiste, y el segundo clic pliega', () => {
    const celdas: Record<string, string> = {}
    conAlmacen(celdas)
    useBarraStore.setState({ expandidas: [] })
    useBarraStore.getState().toggleCarpeta('c1')
    expect(useBarraStore.getState().expandidas).toEqual(['c1'])
    expect(celdas['fortress-carpetas-expandidas']).toBe('["c1"]')
    useBarraStore.getState().toggleCarpeta('c1')
    expect(useBarraStore.getState().expandidas).toEqual([])
    expect(celdas['fortress-carpetas-expandidas']).toBe('[]')
  })

  it('ACORDEON NO ENTRA AL CHAT: ni el activo ni la seleccion se tocan', () => {
    conAlmacen({})
    useBarraStore.setState({ seleccion: 'h1', expandidas: [] })
    useConstruirStore.setState({ hiloActivo: HILO, messages: [{ role: 'user', text: 'hola' }] })
    useBarraStore.getState().toggleCarpeta('c9')
    expect(useConstruirStore.getState().hiloActivo?.id).toBe('h1')
    expect(useConstruirStore.getState().messages).toHaveLength(1)
    expect(useBarraStore.getState().seleccion).toBe('h1')
  })
})
