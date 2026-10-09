import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * PASO 133 — pin de REGRESION, no de estreno: el guard existe desde a7368bc
 * (lo puso el propio Motor reparando el hallazgo 8ad2ea05). Este test no nacio
 * en rojo porque el fix es anterior; lo que hace es que NADIE lo quite sin que
 * una red lo grite — el template se DISTRIBUYE, y un control evadible ahi
 * viaja a cada operador que lo despliegue.
 */
const template = (): string => readFileSync('templates/fortress-orchestrator.sh', 'utf8')

describe('el orquestador RECHAZA la rama evasiva: fallo cerrado, nunca sanear', () => {
  it("una rama/campo con '|' o control chars no entra a repos.conf", () => {
    const sh = template()
    expect(sh).toContain(`*'|'*`)
    expect(sh).toContain('[[:cntrl:]]')
    expect(sh).toContain('Rechazar, nunca sanear')
  })

  it('la confianza sigue siendo el campo 5 LITERAL, declarado por el operador', () => {
    const sh = template()
    expect(sh).toContain('get_repo_field "$1" 5')
    expect(sh).toContain('= "trusted"')
    expect(sh).toContain('--trust')
  })
})
