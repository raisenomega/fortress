import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * PASO 172a: "Auditar calidad" mide la salud de CUALQUIER proyecto (FORTRESS y
 * clientes). El error (a) del 170 —gatear quality:run por repo propio— NO se
 * repite: el handler no mira esRepoPropio/isFortressRepo.
 */
describe('quality:run sigue UNIVERSAL', () => {
  it('quality-handlers NO gatea por repo propio', () => {
    const src = readFileSync('src/infrastructure/ipc/quality-handlers.ts', 'utf8')
    expect(src).not.toContain('esRepoPropio')
    expect(src).not.toContain('isFortressRepo')
  })
})
