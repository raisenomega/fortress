import { describe, expect, it } from 'vitest'
import { detectStack } from './stack'

const evidence = (
  files: string[],
  dependencies: string[] = []
): Parameters<typeof detectStack>[0] => ({ files, dependencies })

describe('detectStack', () => {
  it('devuelve cadena vacia cuando no reconoce nada', () => {
    expect(detectStack(evidence(['README.md']))).toBe('')
  })

  it('reconoce un framework por sus dependencias', () => {
    expect(detectStack(evidence(['package.json'], ['next', 'react']))).toContain('Next.js')
  })

  it('descarta Node.js generico cuando ya hay un framework', () => {
    expect(detectStack(evidence(['package.json'], ['next']))).toBe('Next.js')
  })

  it('mantiene Node.js si es la unica pista', () => {
    expect(detectStack(evidence(['package.json'], ['lodash']))).toBe('Node.js')
  })

  it('combina frontend y backend de distintos ecosistemas', () => {
    const stack = detectStack(evidence(['package.json', 'requirements.txt'], ['react', 'fastapi']))
    expect(stack).toContain('React')
    expect(stack).toContain('FastAPI')
  })

  it('no repite una etiqueta que llega por dos pistas', () => {
    const stack = detectStack(evidence(['pyproject.toml', 'requirements.txt'], []))
    expect(stack).toBe('Python')
  })

  it('ignora mayusculas en archivos y dependencias', () => {
    expect(detectStack(evidence(['Cargo.toml']))).toBe('Rust')
    expect(detectStack(evidence([], ['React']))).toBe('React')
  })

  it('limita la etiqueta a tres tecnologias', () => {
    const stack = detectStack(
      evidence(['package.json', 'go.mod'], ['next', 'react', 'express', 'prisma'])
    )
    expect(stack.split(' + ')).toHaveLength(3)
  })
})
