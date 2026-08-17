import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterAll, describe, expect, it } from 'vitest'
import type { Project } from '@domain/project/project'
import { checkCorpusConfig } from './check-corpus-config'

const raiz = mkdtempSync(join(tmpdir(), 'fortress-health-'))
afterAll(() => rmSync(raiz, { recursive: true, force: true }))

/** Un proyecto en disco; con `config` le escribe ese texto en su .fortress/config. */
function proyecto(name: string, config?: string): Project {
  const path = join(raiz, name)
  mkdirSync(join(path, '.fortress'), { recursive: true })
  if (config !== undefined) writeFileSync(join(path, '.fortress', 'config'), config)
  return { id: name, name, path } as Project
}

const VALIDO = '{ "corpus": { "directories": ["docs/"] } }'
const ROTO = '{ "corpus": 42 }'

describe('checkCorpusConfig', () => {
  it('sin proyectos no hay nada que avisar', () => {
    expect(checkCorpusConfig([]).level).toBe('ok')
  })

  it('un proyecto que no declara corpus no es defecto: declararlo es opcional', () => {
    expect(checkCorpusConfig([proyecto('sin-config')]).level).toBe('ok')
  })

  it('una declaracion legible tampoco', () => {
    expect(checkCorpusConfig([proyecto('bien', VALIDO)]).level).toBe('ok')
  })

  it('una ilegible es advertencia, y nombra al proyecto, el fichero y la razon', () => {
    const check = checkCorpusConfig([proyecto('roto', ROTO)])
    expect(check.level).toBe('warning')
    expect(check.detail).toContain('roto (.fortress/config)')
    expect(check.detail).toContain('corpus: objeto con docs y/o directories')
    expect(check.fix).not.toBeNull()
  })

  it('varias ilegibles se listan todas', () => {
    const check = checkCorpusConfig([proyecto('roto-a', ROTO), proyecto('roto-b', '{')])
    expect(check.detail).toContain('roto-a')
    expect(check.detail).toContain('roto-b')
  })

  it('en una mezcla solo se nombra a las ilegibles', () => {
    const check = checkCorpusConfig([proyecto('ok-1', VALIDO), proyecto('ok-2'), proyecto('mal', ROTO)]) // prettier-ignore
    expect(check.level).toBe('warning')
    expect(check.detail).toContain('mal')
    expect(check.detail).not.toContain('ok-1')
    expect(check.detail).not.toContain('ok-2')
  })
})
