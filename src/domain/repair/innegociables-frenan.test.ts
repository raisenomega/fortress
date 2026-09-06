import { describe, expect, it } from 'vitest'
import { DEFAULT_BLACKLIST } from './auto-merge-blacklist'
import { evaluate, type ProposalDiff } from './auto-merge-evaluation'
import type { AutoMergePolicy } from './auto-merge-policy'

/** Politica permisiva a proposito: si algo frena, es la lista y no otra cosa. */
const ABIERTA: AutoMergePolicy = {
  enabled: true,
  severities: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
  maxDiffLines: 9999,
  maxFiles: 99,
  blacklist: [...DEFAULT_BLACKLIST]
} as AutoMergePolicy

const propuesta = (file: string): ProposalDiff =>
  ({
    severity: 'LOW',
    files: [file],
    insertions: 1,
    deletions: 0,
    lineasPorFichero: {}
  }) as ProposalDiff

const DEFENSAS = [
  'src/infrastructure/claude-code/build-env.ts',
  'src/infrastructure/git/git-env.ts',
  'src/domain/repair/scope-groups.ts',
  'src/domain/repair/glob-de-alcance.ts',
  'src/domain/shared/sanear-para-prompt.ts',
  'src/application/repair/carril-del-merge.ts',
  'src/infrastructure/loop/loop-fix.ts',
  'src/infrastructure/repair/motor-tools.ts',
  'src/domain/repair/auto-merge-blacklist.ts',
  'src/domain/repair/innegociables-defensa.ts',
  'src/domain/repair/allowed-files.ts',
  'src/infrastructure/electron/main-window.ts',
  'src/preload/index.ts'
]

describe('un fix a una defensa NO se integra solo: exige firma humana', () => {
  it.each(DEFENSAS)('%s frena la integracion automatica', (fichero) => {
    expect(evaluate(propuesta(fichero), ABIERTA)).toMatchObject({
      allowed: false,
      conditionFailed: 'blacklist'
    })
  })

  it('la lista que restringe al motor tampoco la edita el motor', () => {
    // Sin esto, una propuesta podria borrar su propia restriccion y abrir todo
    // lo demas en la siguiente vuelta.
    for (const f of ['auto-merge-blacklist.ts', 'innegociables-defensa.ts']) {
      const r = evaluate(propuesta(`src/domain/repair/${f}`), ABIERTA)
      expect({ f, permitido: r.allowed }).toEqual({ f, permitido: false })
    }
  })
})

describe('y el flujo normal sigue funcionando', () => {
  it.each(['src/presentation/components/system/MotorView.tsx', 'src/domain/chat/reply.ts'])(
    '%s se integra solo, como siempre',
    (fichero) => {
      expect(evaluate(propuesta(fichero), ABIERTA)).toMatchObject({ allowed: true })
    }
  )
})
