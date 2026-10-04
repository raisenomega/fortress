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

  it('dirigir pasa por el MISMO estreno que la cola, y la escalera ya esta completa', () => {
    // El guard sigue siendo isDebutEligible: que el operador pregunte no
    // acumula confianza. Lo que cambio es el terreno, dos veces con firma:
    // ADR-106 metio HIGH, y la enmienda del 2026-10-04 metio CRITICAL con la
    // condicion de §3.3 cumplida (9f69a37c/2655c77). Hoy no queda severidad
    // fuera; si DEBUT volviera a recortarse, dirigir volveria a negarse solo.
    expect(dirigirA(candidato('HIGH'))).not.toBeNull()
    expect(dirigirA(candidato('CRITICAL'))).not.toBeNull()
  })
})
