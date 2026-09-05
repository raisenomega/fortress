import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

/**
 * Todo spawn de FORTRESS acota su entorno, y eso se comprueba sobre el CODIGO:
 * verificarlo corriendo exigiria lanzar `claude`, `git merge` y el indexador de
 * verdad. Lo que se fija es el PUNTO DE LLAMADA —que la opcion `env` viaja— y
 * no que el fichero mencione `buildEnv`: la primera version de este test miraba
 * lo segundo y dos mutaciones lo pasaron en verde, porque quitar el `env` del
 * spawn dejaba intactos el import y el comentario.
 */
const SPAWNEA: readonly string[] = [
  'src/infrastructure/repair/graph-analyst.ts',
  'src/infrastructure/repair/graph-omega.ts',
  'src/infrastructure/repair/graph-generator.ts',
  'src/infrastructure/repair/git-merge-applier.ts',
  'src/infrastructure/graph/reindex-runner.ts',
  'src/infrastructure/graph/index-graph.ts',
  'src/infrastructure/graph/verify-graph.ts',
  'src/infrastructure/claude-code/claude-code-agent.ts'
]

/**
 * Los literales de opciones de un spawn: se reconocen por llevar `cwd`, que es
 * lo que siempre se le pasa. Los que van en una variable aparte quedan cubiertos
 * por las otras dos reglas — no hay forma de armar una sin `buildEnv` y sin
 * `...process.env` que herede nada.
 */
function opcionesInline(fuente: string): readonly string[] {
  return [...fuente.matchAll(/\{[^{}]*\bcwd\b[^{}]*\}/g)].map((m) => m[0])
}

describe('ningun spawn hereda el entorno del operador sin acotar', () => {
  it.each(SPAWNEA)('%s: todo literal de opciones lleva `env`', (fichero) => {
    for (const opciones of opcionesInline(readFileSync(fichero, 'utf8'))) {
      expect({ fichero, opciones, conEnv: /\benv\b/.test(opciones) }).toEqual({ fichero, opciones, conEnv: true }) // prettier-ignore
    }
  })

  it.each(SPAWNEA)('%s: el entorno sale de buildEnv', (fichero) => {
    expect(readFileSync(fichero, 'utf8')).toContain('buildEnv(')
  })

  it('ninguno reparte `...process.env` a pelo', () => {
    // La forma exacta del agujero en git-merge-applier: el entorno entero mas
    // dos variables de git, con las llaves de la sesion viva dentro.
    for (const f of SPAWNEA) {
      expect({ f, crudo: /\.\.\.process\.env/.test(readFileSync(f, 'utf8')) }).toEqual({ f, crudo: false }) // prettier-ignore
    }
  })
})
