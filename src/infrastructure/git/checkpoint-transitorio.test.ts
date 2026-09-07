import { afterEach, describe, expect, it } from 'vitest'
import { abrirCheckpoint } from './checkpoint-transitorio'
import { asuntos, crearCarpetaSinGit, crearRepo, crearRepoSinHistoria, escribir, existe, head, leer, limpiar, subcarpeta } from './checkpoint-fixture' // prettier-ignore

const dirs: string[] = []
const repo = (): string => {
  const dir = crearRepo()
  dirs.push(dir)
  return dir
}
afterEach(() => limpiar(dirs))

/** Lo que haria el agente en el turno: toca un fichero y crea otro. */
function elAgenteEdita(dir: string): void {
  escribir(dir, 'a.txt', 'editado\n')
  escribir(dir, 'b.txt', 'nuevo\n')
}

describe('checkpoint transitorio: exito', () => {
  it('conserva las ediciones y el commit del checkpoint NO queda en el historial', () => {
    const dir = repo()
    const antes = head(dir)
    const cp = abrirCheckpoint(dir)
    expect(cp).not.toBeNull()
    elAgenteEdita(dir)

    expect(cp!.conservar()).toBe(true)

    expect(leer(dir, 'a.txt')).toBe('editado\n')
    expect(existe(dir, 'b.txt')).toBe(true)
    // La mutacion que importa: sin el `reset --soft`, aqui aparece
    // 'checkpoint transitorio' y HEAD ya no es el de antes.
    expect(asuntos(dir)).toEqual(['base'])
    expect(head(dir)).toBe(antes)
  })
})

describe('checkpoint transitorio: revert', () => {
  it('descarta las ediciones —el fichero nuevo incluido— y tampoco deja checkpoint', () => {
    const dir = repo()
    const antes = head(dir)
    const cp = abrirCheckpoint(dir)
    elAgenteEdita(dir)

    expect(cp!.revertir()).toBe(true)

    expect(leer(dir, 'a.txt')).toBe('base\n')
    // `reset --hard` solo no lo quitaria: es el `clean -fd` el que lo hace.
    expect(existe(dir, 'b.txt')).toBe(false)
    expect(asuntos(dir)).toEqual(['base'])
    expect(head(dir)).toBe(antes)
  })
})

describe('sin red posible: devuelve null, la senal para degradar', () => {
  it('una carpeta sin git', () => {
    const dir = crearCarpetaSinGit()
    dirs.push(dir)
    expect(abrirCheckpoint(dir)).toBeNull()
  })

  it('una subcarpeta de un repo: no es la raiz, y un add -A ahi tocaria al padre', () => {
    expect(abrirCheckpoint(subcarpeta(repo()))).toBeNull()
  })

  it('un repo sin ningun commit: no hay puntero al que volver', () => {
    const dir = crearRepoSinHistoria()
    dirs.push(dir)
    expect(abrirCheckpoint(dir)).toBeNull()
  })
})
