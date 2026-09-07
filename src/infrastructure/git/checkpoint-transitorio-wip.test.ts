import { afterEach, describe, expect, it } from 'vitest'
import { abrirCheckpoint } from './checkpoint-transitorio'
import { asuntos, crearRepo, escribir, existe, leer, limpiar, porcelain } from './checkpoint-fixture' // prettier-ignore

const dirs: string[] = []
afterEach(() => limpiar(dirs))

/**
 * El caso que justifica el `add -A` del snapshot: el operador tiene trabajo a
 * medias —un fichero tocado sin stagear y otro nuevo sin seguimiento— cuando el
 * agente entra. Ese trabajo no puede perderse por ninguna de las dos puertas.
 */
function repoConTrabajoAMedias(): string {
  const dir = crearRepo()
  dirs.push(dir)
  escribir(dir, 'a.txt', 'wip\n')
  escribir(dir, 'c.txt', 'del operador\n')
  return dir
}

function elAgenteEdita(dir: string): void {
  escribir(dir, 'a.txt', 'wip\nagente\n')
  escribir(dir, 'd.txt', 'del agente\n')
}

describe('con trabajo a medias del operador', () => {
  it('exito: su trabajo y las ediciones del agente conviven, sin checkpoint en el historial', () => {
    const dir = repoConTrabajoAMedias()
    const cp = abrirCheckpoint(dir)
    elAgenteEdita(dir)

    expect(cp!.conservar()).toBe(true)

    expect(leer(dir, 'a.txt')).toBe('wip\nagente\n')
    expect(existe(dir, 'c.txt')).toBe(true)
    expect(existe(dir, 'd.txt')).toBe(true)
    expect(asuntos(dir)).toEqual(['base'])
  })

  it('el efecto lateral escrito en el ADR: lo del operador queda stageado; lo del agente, no', () => {
    const dir = repoConTrabajoAMedias()
    const cp = abrirCheckpoint(dir)
    elAgenteEdita(dir)
    cp!.conservar()

    // Primera columna = indice, segunda = arbol. El `reset --soft` deja el
    // indice como el SNAPSHOT: el WIP del operador (a.txt, c.txt) stageado, y
    // lo que el agente hizo despues sin stagear — la M del arbol en a.txt y
    // el d.txt sin seguimiento. `git diff` a secas es lo que hizo el agente.
    const filas = porcelain(dir).trim().split('\n').sort()
    expect(filas).toEqual(['?? d.txt', 'A  c.txt', 'MM a.txt'])
  })

  it('revert: solo sobrevive el trabajo del operador, untracked incluido', () => {
    const dir = repoConTrabajoAMedias()
    const cp = abrirCheckpoint(dir)
    elAgenteEdita(dir)

    expect(cp!.revertir()).toBe(true)

    // Sin el `add -A` del snapshot, c.txt no estaria en el commit y el
    // `clean -fd` se lo habria llevado con d.txt.
    expect(leer(dir, 'a.txt')).toBe('wip\n')
    expect(existe(dir, 'c.txt')).toBe(true)
    expect(existe(dir, 'd.txt')).toBe(false)
    expect(asuntos(dir)).toEqual(['base'])
  })
})
