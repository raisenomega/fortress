import { existsSync, mkdtempSync, symlinkSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { describe, expect, it } from 'vitest'
import { writeScan } from '../cognition/write-cognition-log'
import { rutaContenida } from './ruta-contenida'

const tmp = (p: string): string => mkdtempSync(join(tmpdir(), p))

const escaneo = (projectPath: string): Parameters<typeof writeScan>[0] => ({
  projectPath,
  projectName: 'P',
  findings: [],
  resolved: [],
  score: 100,
  counts: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
  at: '2026-09-20T00:00:00Z'
})

/**
 * El enlace COLGANTE: apunta a un fichero que todavia no existe.
 *
 * `existsSync` SIGUE los enlaces, asi que ante uno colgante contesta «no existe»
 * y la ruta se trataba como una escritura nueva: se resolvia solo su carpeta —que
 * si esta dentro— y se devolvia como contenida. `writeFileSync` sigue el enlace y
 * CREA el destino fuera de la raiz. El enlace a un fichero existente ya estaba
 * tapado; este era su gemelo, y basta con que el repo auditado lo commitee.
 *
 * Alcanzable en el PRIMER escaneo de un repo clonado: `writeScan` no tiene puerta
 * de confianza.
 */
describe('el enlace colgante: crea fuera de la raiz lo que aun no existe', () => {
  it('COGNITION-LOG.md -> un fichero que no existe NO lo crea fuera', () => {
    const victima = join(tmp('fcc-victima-'), 'authorized_keys')
    const repo = tmp('fcc-repo-')
    symlinkSync(victima, join(repo, 'COGNITION-LOG.md'))

    writeScan(escaneo(repo))

    expect(existsSync(victima)).toBe(false)
  })

  it('rutaContenida lo niega: no poder resolver un enlace no es permiso', () => {
    const repo = tmp('fcc-r-')
    symlinkSync(join(tmp('fcc-fuera-'), 'no-existe.txt'), join(repo, 'x.md'))

    expect(rutaContenida(repo, 'x.md')).toBeNull()
  })

  it('tambien cuando cuelga hacia DENTRO: un enlace roto no se escribe a ciegas', () => {
    const repo = tmp('fcc-r-')
    symlinkSync(join(repo, 'no-existe.md'), join(repo, 'x.md'))

    expect(rutaContenida(repo, 'x.md')).toBeNull()
  })

  it('y el fichero nuevo de verdad, sin enlace, se sigue pudiendo crear', () => {
    const repo = tmp('fcc-r-')

    expect(rutaContenida(repo, 'nuevo.md')).toBe(join(repo, 'nuevo.md'))
  })
})
