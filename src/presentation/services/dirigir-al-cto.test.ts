import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { Finding } from '@domain/project/project'
import { useConstruirStore } from '../stores/construir-store'
import { useLazoStore } from '../stores/lazo-store'
import { useScanStore } from '../stores/scan-store'
import { dirigirAlCto } from './dirigir-al-cto'

const PID = 'p1'
const vivos = (): readonly Finding[] =>
  [{ id: 'Y', title: 'Subida anonima', file: 'x.sql', line: 39 }] as unknown as readonly Finding[]

beforeEach(() => {
  useLazoStore.getState().parar()
  useScanStore.setState({ byProject: {} })
  useConstruirStore.getState().setInput('')
})

afterEach(() => {
  useLazoStore.getState().parar()
  useConstruirStore.getState().setInput('')
})

describe('dirigirAlCto: antepone la cabeza al input del CTO (ATERRIZAJE-3)', () => {
  it('MUTANTE: con cabeza Y -> antepone la direccion que NOMBRA a Y (id + fichero:linea)', () => {
    useLazoStore.getState().congelarCola(['Y'])
    useScanStore.setState({ byProject: { [PID]: vivos() } })
    useConstruirStore.getState().setInput('REPORTE del Terminal')
    dirigirAlCto(PID)
    const input = useConstruirStore.getState().input
    expect(input).toContain('Y')
    expect(input).toContain('x.sql:39')
    expect(input).toContain('REPORTE del Terminal') // se antepone, NO reemplaza
  })

  it('sin cabeza (cola vacia) -> input intacto (direccion generica)', () => {
    useLazoStore.getState().congelarCola([])
    useConstruirStore.getState().setInput('REPORTE')
    dirigirAlCto(PID)
    expect(useConstruirStore.getState().input).toBe('REPORTE')
  })

  it('cabeza que no esta entre los vivos -> input intacto', () => {
    useLazoStore.getState().congelarCola(['GHOST'])
    useScanStore.setState({ byProject: { [PID]: [] } })
    useConstruirStore.getState().setInput('REPORTE')
    dirigirAlCto(PID)
    expect(useConstruirStore.getState().input).toBe('REPORTE')
  })
})
