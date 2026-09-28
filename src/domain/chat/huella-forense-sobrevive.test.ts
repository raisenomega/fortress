import { describe, expect, it } from 'vitest'
import { redactSecrets } from './tool-detail'

/**
 * El comodin del hash nacio para la linea EN VIVO, y su commit lo dice:
 * «Solo en vivo por onChunk: NO se persiste». Hoy `redactSecrets` tiene 17
 * llamadas en 15 modulos y la mayoria SI persisten —el recibo, el resumen de
 * actividad, las observaciones, la evidencia, el registro del escaneo y el de
 * fallos—, asi que el comodin acabo borrando la huella que un auditor necesita.
 *
 * Y no protegia nada propio: ningun test nombra un secreto que solo el tapara.
 * Los tres que tapaba por accidente los cubre ahora `secreto-por-contexto`.
 */
const FORENSE = [
  ['identificador de commit', 'git show 3810e5cbbd048c9a1f2e3d4c5b6a7980f1e2d3c4'],
  ['dos identificadores', 'git diff 3810e5cbbd048c9a1f2e3d4c5b6a7980f1e2d3c4..bbd048cdb9e1a4847226eafd398a44d4041206b3'],
  ['resumen de 64', `npm WARN tarball sha512 ${'c'.repeat(64)}`],
  ['resumen de 32', 'md5sum: d41d8cd98f00b204e9800998ecf8427e  fichero.txt'],
  ['digest de imagen', `docker pull node@sha256:${'f'.repeat(64)}`],
  ['color largo', `color #${'f'.repeat(32)}`]
] // prettier-ignore

describe('la huella forense sobrevive al tachado', () => {
  it.each(FORENSE)('%s queda intacto', (_clase, texto) => {
    expect(redactSecrets(texto)).toBe(texto)
  })
})

describe('y lo que el comodin tapaba por accidente sigue tapado', () => {
  it.each([
    [`curl -u api:${'d'.repeat(32)} https://x`, 'd'.repeat(32)],
    [`psql "postgresql://u:${'e'.repeat(32)}@h/db"`, 'e'.repeat(32)],
    [`Authorization: ${'f'.repeat(40)}`, 'f'.repeat(40)]
  ])('%s no deja rastro', (linea, rastro) => {
    expect(redactSecrets(linea)).not.toContain(rastro)
  })
})
