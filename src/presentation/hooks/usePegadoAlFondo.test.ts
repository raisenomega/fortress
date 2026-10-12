import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { pegarAlFondo } from './usePegadoAlFondo'

const read = (p: string): string => readFileSync(p, 'utf8')

describe('auto-scroll compartido como el Terminal (PASO 174)', () => {
  it('pegarAlFondo pega la vista al pie con {block:end} —el gesto del Terminal', () => {
    const scrollIntoView = vi.fn()
    pegarAlFondo({ scrollIntoView } as unknown as HTMLElement)
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'end' })
  })

  it('sin elemento (ref vacio) no revienta', () => {
    expect(() => pegarAlFondo(null)).not.toThrow()
  })

  it('T1: el chat usa el hook siguiendo hilo Y borrador, con div al pie', () => {
    const src = read('src/presentation/components/construir/ConstruirMessages.tsx')
    expect(src).toContain('usePegadoAlFondo(draft ?? messages)')
    expect(src).toContain('ref={bottomRef}')
  })

  it('regresion: el Terminal usa el MISMO hook (mismo gesto, no se toca su UX)', () => {
    const src = read('src/presentation/components/chat/ChatMessageList.tsx')
    expect(src).toContain('usePegadoAlFondo(messages)')
    expect(src).toContain('ref={bottomRef}')
    // El scroll ya no vive inline: es el hook compartido el que lo hace.
    expect(src).not.toContain('scrollIntoView')
  })
})
