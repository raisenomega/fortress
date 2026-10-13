import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { describe, expect, it } from 'vitest'
import { EMPTY_SNAPSHOT } from '@domain/cognition/cognition-log'
import { readCognitionLog } from './read-cognition-log'

const FILE = 'COGNITION-LOG.md'
const CONTENIDO = '# COGNITION LOG\n\nGeneracion: 3\n'

function proyecto(): string {
  return mkdtempSync(join(tmpdir(), 'fcc-cognition-'))
}

describe('readCognitionLog', () => {
  it('lee el COGNITION-LOG.md del propio proyecto', () => {
    const repo = proyecto()
    writeFileSync(join(repo, FILE), CONTENIDO)
    expect(readCognitionLog(repo).present).toBe(true)
  })

  it('sin archivo: snapshot vacio, sin lanzar', () => {
    expect(readCognitionLog(proyecto())).toEqual(EMPTY_SNAPSHOT)
  })

  it('un enlace que sale de la raiz no se sigue: snapshot vacio', () => {
    const repo = proyecto()
    const fuera = join(proyecto(), 'secreto.md')
    writeFileSync(fuera, CONTENIDO)
    symlinkSync(fuera, join(repo, FILE))
    expect(readCognitionLog(repo)).toEqual(EMPTY_SNAPSHOT)
  })

  it('un enlace colgante: snapshot vacio', () => {
    const repo = proyecto()
    symlinkSync(join(repo, 'no-existe.md'), join(repo, FILE))
    expect(readCognitionLog(repo)).toEqual(EMPTY_SNAPSHOT)
  })

  it('un enlace DENTRO del proyecto sigue funcionando', () => {
    const repo = proyecto()
    writeFileSync(join(repo, 'real.md'), CONTENIDO)
    symlinkSync(join(repo, 'real.md'), join(repo, FILE))
    expect(readCognitionLog(repo).present).toBe(true)
  })

  it('un directorio con ese nombre no se abre: snapshot vacio', () => {
    const repo = proyecto()
    mkdirSync(join(repo, FILE))
    expect(readCognitionLog(repo)).toEqual(EMPTY_SNAPSHOT)
  })
})
