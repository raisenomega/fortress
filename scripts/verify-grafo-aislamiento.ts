import { mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { graphSlug } from '../src/domain/graph/graph-slug.ts'
import { copiarAlFence, correrCrudo, raizTemporal, repoTiny } from './grafo-aislamiento-arnes.ts'

/**
 * ARNES VIVO del aislamiento del grafo (Sello B.2), FUERA del gate. Indexa dos
 * repos de VERDAD (A y B), fencea a B (un solo .db) y afirma lo que el 144
 * midio: el turno de B no alcanza a A, y pedir A solo puede nombrar a B en
 * `available_projects` (jamas a A). Caro —indexa de verdad— y de proceso: por
 * eso NO va en `npm test`; se corre a mano, como `verify:cabecera`.
 *
 * Uso: npm run verify:grafo-aislamiento   (verde = aisla, rojo = fuga)
 */
function ultimoJson(texto: string): Record<string, unknown> {
  const linea = texto.split('\n').filter((l) => l.trim().startsWith('{')).pop() // prettier-ignore
  return linea === undefined ? {} : (JSON.parse(linea) as Record<string, unknown>)
}

function main(): number {
  const raiz = raizTemporal()
  const cache = join(raiz, 'cache')
  mkdirSync(cache, { recursive: true })
  const fence = join(raiz, 'fence')
  try {
    const a = repoTiny(raiz, 'repoA', 'funcionAlfa')
    const b = repoTiny(raiz, 'repoB', 'funcionBeta')
    correrCrudo(cache, 'index_repository', { repo_path: a }, a)
    correrCrudo(cache, 'index_repository', { repo_path: b }, b)
    const slugA = graphSlug(a)
    const slugB = graphSlug(b)
    copiarAlFence(cache, fence, slugB)

    const lista = ultimoJson(correrCrudo(fence, 'list_projects', {}).stdout)
    const visibles = (lista.projects as { name: string }[]).map((p) => p.name)
    const leeB = correrCrudo(fence, 'get_architecture', { project: slugB, aspects: ['overview'] })
    const leeA = correrCrudo(fence, 'get_architecture', { project: slugA, aspects: ['overview'] })
    const dispo = (ultimoJson(leeA.stderr).available_projects ?? []) as string[]

    const soloB = visibles.length === 1 && visibles[0] === slugB
    const errSoloB = JSON.stringify(dispo) === JSON.stringify([slugB])
    const noNombraA = !leeA.stderr.includes(slugA)
    const ok = soloB && leeB.rc === 0 && leeA.rc !== 0 && errSoloB && noNombraA

    console.log(`visibles en el fence: ${JSON.stringify(visibles)} (solo B: ${soloB})`)
    console.log(`B alcanza su grafo: ${leeB.rc === 0} · A NO alcanza: ${leeA.rc !== 0}`)
    console.log(`error de A -> available_projects: ${JSON.stringify(dispo)} (solo B: ${errSoloB}, no nombra A: ${noNombraA})`) // prettier-ignore
    console.log(`\nGRAFO ${ok ? 'AISLA' : 'FUGA'} — el turno de B jamas alcanza a A`)
    return ok ? 0 : 1
  } finally {
    rmSync(raiz, { recursive: true, force: true })
  }
}

process.exit(main())
