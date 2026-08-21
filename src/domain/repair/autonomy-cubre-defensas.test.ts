import { existsSync } from 'fs'
import { describe, expect, it } from 'vitest'
import { AUTONOMY_RULES_FILES } from './auto-merge-blacklist'
import { evaluate } from './auto-merge-evaluation'
import { DEFAULT_POLICY } from './auto-merge-policy'

const ACTIVA = { ...DEFAULT_POLICY, enabled: true }
const fix = (file: string): Parameters<typeof evaluate>[0] => ({
  severity: 'LOW', files: [file], insertions: 1, deletions: 0
}) // prettier-ignore

/** Las defensas que las piezas de la raiz A y del entorno del gate crearon. */
const NUEVAS: readonly string[] = [
  'src/domain/project/project-path.ts',
  'src/domain/newproject/target-path.ts',
  'src/domain/connectors/graph-mcp.ts',
  'src/domain/posture/private-host.ts',
  'src/domain/repair/confianza.ts',
  'src/domain/settings/modo-efectivo.ts',
  'src/application/repair/gate-guards.ts',
  'src/infrastructure/repair/gate-env.ts',
  'src/infrastructure/system/self-project.ts',
  'src/domain/repair/scope-check.ts',
  'src/domain/repair/auto-merge-evaluation.ts',
  'src/domain/repair/auto-merge-config.ts'
]

describe('la lista innegociable cubre las defensas nuevas', () => {
  it('un fix minimo sobre cada una NO se integra solo', () => {
    for (const file of NUEVAS) {
      const r = evaluate(fix(file), ACTIVA)
      expect(r.conditionFailed, file).toBe('blacklist')
    }
  })

  it('quien decide una integracion esta cubierto, no solo quien la declara', () => {
    // La proteccion seguia al nombre del archivo: `auto-merge-policy` estaba,
    // pero la evaluacion vive en otro modulo desde que se partio.
    expect(evaluate(fix('src/domain/repair/auto-merge-evaluation.ts'), ACTIVA).allowed).toBe(false)
    expect(evaluate(fix('src/domain/repair/auto-merge-policy.ts'), ACTIVA).allowed).toBe(false)
  })

  it('cada entrada de la lista existe en disco: una ruta muerta no protege nada', () => {
    for (const entrada of AUTONOMY_RULES_FILES) {
      if (entrada.includes('*')) continue
      expect(existsSync(entrada), entrada).toBe(true)
    }
  })

  it('no-regresion: el cerco normal sigue dejando pasar un fichero corriente', () => {
    expect(evaluate(fix('src/domain/project/finding-identity.ts'), ACTIVA).allowed).toBe(true)
  })

  it('las dos mitades de una misma guarda entran juntas o no entra ninguna', () => {
    // `project-path` decide que ruta vale y `target-path` es quien rechaza el
    // "..": proteger una sola dejaria la defensa abierta por el otro lado, que
    // es como este hueco aparecio las tres veces.
    expect(evaluate(fix('src/domain/project/project-path.ts'), ACTIVA).allowed).toBe(false)
    expect(evaluate(fix('src/domain/newproject/target-path.ts'), ACTIVA).allowed).toBe(false)
  })
})

describe('el candidato de la primera auto-reparacion sigue siendo integrable', () => {
  it('run-accumulator NO quedo bloqueado por ampliar la lista', () => {
    // Ampliar las defensas no puede cerrar de paso lo que si debe poder
    // integrarse solo: si esto se pusiera en rojo, la primera auto-reparacion
    // se habria bloqueado sin que nadie lo decidiera.
    const r = evaluate(fix('src/infrastructure/claude-code/run-accumulator.ts'), ACTIVA)
    expect(r.allowed).toBe(true)
  })
})
