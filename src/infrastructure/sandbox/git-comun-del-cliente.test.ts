import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { gitComunDe } from './lo-que-ve-la-caja'

const raiz = mkdtempSync(join(tmpdir(), 'fortress-git-comun-'))
afterAll(() => rmSync(raiz, { recursive: true, force: true }))

const repo = join(raiz, 'repo')
mkdirSync(join(repo, '.git', 'worktrees', 'w1'), { recursive: true })
mkdirSync(join(raiz, 'otro'), { recursive: true })

/** Un proyecto cuyo `.git` es un FICHERO con el texto que se le diga. */
const conGitdir = (nombre: string, texto: string): string => {
  const dir = join(raiz, nombre)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, '.git'), `gitdir: ${texto}\n`)
  return dir
}

/**
 * El `.git` lo escribe el REPO AUDITADO, que es el cliente: no es fuente de
 * verdad. Medido el 2026-09-29 con un bwrap real: el texto salia de aqui sin
 * validar hacia la lista de ESCRITURA de la caja, y un `gitdir: /home/jojo/
 * worktrees/x` ponia el HOME entero en un `--bind` posterior al `--tmpfs` que lo
 * tapa. Dentro de la caja el HOME quedaba visible y escribible de verdad.
 *
 * La cota de anchura niega el HOME, pero NO la variante cruzada —un gitdir que
 * apunta al repo de OTRO cliente—: eso solo lo caza exigir que el worktree
 * EXISTA, porque ese directorio el atacante no lo puede crear ahi.
 */
describe('el .git del cliente no es fuente de verdad', () => {
  it('un worktree de verdad da su .git comun', () => {
    const wt = conGitdir('bueno', join(repo, '.git', 'worktrees', 'w1'))
    expect(gitComunDe(wt)).toEqual([join(repo, '.git')])
  })

  it('un gitdir cuyo worktree no existe no monta nada', () => {
    const wt = conGitdir('vector', join(raiz, 'inventado', 'worktrees', 'x'))
    expect(gitComunDe(wt)).toEqual([])
  })

  it('CRUZADO: un gitdir hacia otro repo no monta ese otro repo', () => {
    const wt = conGitdir('cruzado', join(raiz, 'otro', 'worktrees', 'w1'))
    expect(gitComunDe(wt)).toEqual([])
  })

  it('un repo normal —con `.git` de carpeta— y uno sin `.git` no aportan nada', () => {
    expect(gitComunDe(repo)).toEqual([])
    expect(gitComunDe(join(raiz, 'otro'))).toEqual([])
  })
})
