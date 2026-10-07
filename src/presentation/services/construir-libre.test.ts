import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it } from 'vitest'
import { useConstruirStore } from '../stores/construir-store'
import { convertirAPlan } from './construir-libre'

/** PASO 91: libre conversa sin repo (powers-off) y «convertir a Plan» lleva la
 *  charla al trabajo — patron del Transferir: precargar + cambiar modo. */
describe('convertir a Plan', () => {
  beforeEach(() => useConstruirStore.setState({ messages: [], mode: 'libre', input: '' }))

  it('precarga la conversacion como pedido de plan Y cambia al modo plan', () => {
    const s = useConstruirStore.getState()
    s.push({ role: 'user', text: 'quiero cache con bloom filter' })
    s.push({ role: 'assistant', text: 'te conviene por X e Y' })
    convertirAPlan()
    const estado = useConstruirStore.getState()
    expect(estado.mode).toBe('plan')
    expect(estado.input).toContain('quiero cache con bloom filter')
    expect(estado.input).toContain('te conviene por X e Y')
  })

  it('sin conversacion no convierte nada: ni modo ni input se tocan', () => {
    convertirAPlan()
    const estado = useConstruirStore.getState()
    expect(estado.mode).toBe('libre')
    expect(estado.input).toBe('')
  })
})

describe('los gates, pineados en el fuente (molde de la casa)', () => {
  const fuente = (r: string): string => readFileSync(r, 'utf8')

  it('el carve-out de la vista vale SOLO para libre; la confianza sigue exigida', () => {
    const vista = fuente('src/presentation/components/construir/ConstruirView.tsx')
    expect(vista).toContain("'libre'")
    expect(vista).toContain('!project.trusted')
  })

  it('los otros tres modos siguen con su gate de proyecto en el runner', () => {
    // Se fija la LLAMADA, no la palabra: un import suelto no es un gate (el
    // primer pin lo dejo vivo un mutante que cambiaba solo la invocacion).
    expect(fuente('src/infrastructure/build/run-build-plan.ts')).toContain('resolveTarget(context') // prettier-ignore
    expect(fuente('src/infrastructure/build/run-investigate.ts')).toContain('resolveTarget(context') // prettier-ignore
    expect(fuente('src/infrastructure/build/run-build.ts')).toContain('resolveEditTarget(context')
  })

  it('el menu ofrece el modo libre', () => {
    expect(fuente('src/presentation/components/construir/ConstruirModeMenu.tsx')).toContain("'libre'") // prettier-ignore
  })
})
