import { describe, expect, it } from 'vitest'
import type { Severity } from '../shared/severity'
import type { Candidate } from './select-target'
import { dirigirA } from './target-dirigido'

const candidato = (severity: Severity): Candidate => ({
  id: 'f1', severity, title: 'el canal no pasa por guardRun',
  file: 'src/infrastructure/ipc/graph-action-handlers.ts', line: 49,
  firstSeen: '2026-08-19T10:00:00Z', tipo: 'path-traversal', simbolo: 'handleverify'
}) // prettier-ignore

describe('el operador senala un hallazgo y el motor lo atiende', () => {
  it('un LOW dirigido sale como objetivo, sin competir con nadie', () => {
    expect(dirigirA(candidato('LOW'))?.target.id).toBe('f1')
  })

  it('la razon dice que fue dirigido, no que gano el orden', () => {
    // El libro de vida guarda POR QUE se ataco cada hallazgo. Si la razon
    // hablase de superficie estaria mintiendo: aqui no hubo seleccion.
    const reason = dirigirA(candidato('LOW'))?.reason ?? ''
    expect(reason).toContain('DIRIGIDO')
    expect(reason).not.toContain('superficie')
  })

  it('un MEDIUM dirigido se atiende: el estreno lo cubre aunque el cerco no', () => {
    // La politica de este repo solo auto-integra LOW. Dirigido igual se trabaja:
    // nace para firma humana, que es de lo que trata poder dirigir.
    expect(dirigirA(candidato('MEDIUM'))?.target.severity).toBe('MEDIUM')
  })

  it('un HIGH dirigido NO se atiende: dirigir no amplia el estreno', () => {
    // Que el operador pregunte no acumula confianza. Subir el estreno a HIGH es
    // una decision aparte, y un clic no puede tomarla de lado.
    expect(dirigirA(candidato('HIGH'))).toBeNull()
    expect(dirigirA(candidato('CRITICAL'))).toBeNull()
  })
})
