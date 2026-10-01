import { describe, expect, it } from 'vitest'
import { createGitMergeApplier } from './git-merge-applier'
import { AL_CARGAR_SIN_CAJA, conPath, repoDeUnUso } from './merge-sin-caja-fixture'

/**
 * `target-branch-detached` cubre DOS cosas: que el HEAD este suelto de verdad, y
 * que la consulta de la rama no se pudiera hacer. La etiqueta sola se leyo como
 * diagnostico y mintio el 2026-10-01 —la primera firma del operador la archivo
 * con `main` en su rama—, asi que el motivo viaja con el fallo (DEUDAS §14).
 */
describe('la caja que no levanta NO es un HEAD suelto, y el asiento lo dice', () => {
  it('el motivo viaja con el fallo, no se queda en la etiqueta', async () => {
    const repo = repoDeUnUso()
    try {
      const outcome = await conPath(AL_CARGAR_SIN_CAJA, () =>
        createGitMergeApplier().apply({
          projectPath: repo.dir,
          sourceBranch: 'fix',
          commitMessage: 'merge: integracion de prueba'
        })
      )
      expect(outcome).toMatchObject({ ok: false, kind: 'target-branch-detached' })
      expect(outcome.ok ? '' : outcome.gitOutput).toMatch(/^sin-caja:/)
    } finally {
      repo.borrar()
    }
  })
})
