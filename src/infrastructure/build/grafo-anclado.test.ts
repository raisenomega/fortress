import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { marcoDeGrafo } from '@domain/build/marco-de-grafo'
import { parseOverview } from '../graph/leer-overview-del-grafo'
import { parseTrace } from '../graph/impacto-crudo'

/**
 * LA LEY DEL GRAFO del CTO (Sellos B.2/B.4), clavada a la fuente: el grafo del
 * proyecto anclado entra como DATO, de UNA copia fenced, y jamas filtra a nadie.
 * Pines del CAMINO: un cambio de una linea rompe el aislamiento sin que ningun
 * proyecto de prueba lo note. La custodia A/B y el fence vivo prueban el resto.
 */
const errJson = JSON.stringify({ error: 'project not found', available_projects: ['home-jojo-ensayo-fail-closed'], count: 1 }) // prettier-ignore
const src = readFileSync('src/infrastructure/build/rebanada-del-libro.ts', 'utf8')
const overview = readFileSync('src/infrastructure/graph/leer-overview-del-grafo.ts', 'utf8')
const runner = readFileSync('src/infrastructure/graph/correr-cli-grafo.ts', 'utf8')
const orquestador = readFileSync('src/infrastructure/graph/leer-grafo-del-turno.ts', 'utf8')
const impacto = readFileSync('src/infrastructure/graph/leer-impacto-del-grafo.ts', 'utf8')

describe('Sello B.2: overview aislado y subordinado', () => {
  it('(i) UN solo fence por turno: prepararGrafoDelTurno UNA vez, graphSlug del path', () => {
    expect((orquestador.match(/prepararGrafoDelTurno\(/g) ?? []).length).toBe(1)
    expect(orquestador).toContain('graphSlug(project.path)')
    expect(orquestador).not.toContain('CACHE_REAL_DEL_GRAFO')
    expect(runner).toContain('CBM_CACHE_DIR: cacheDir')
    expect(runner).not.toContain('CACHE_REAL_DEL_GRAFO')
  })
  it('(ii) el error del overview sale VACIO, sin filtrar available_projects', () => {
    expect(parseOverview(errJson)).toBeNull()
    expect(marcoDeGrafo(parseOverview(errJson)).texto).toBe('')
    expect(runner).toContain('child.stdout.on')
    expect(runner).not.toContain('child.stderr')
  })
  it('(iii) el grafo cuelga del target de LECTURA; overview acotado a ["overview"]', () => {
    expect(src).toContain('leerGrafoDelTurno(target.value')
    expect(overview).not.toContain('resolveEditTarget')
    expect(overview).toContain("aspects: ['overview']")
    expect(overview).not.toContain("'all'")
  })
})

describe('Sello B.4: el radio de impacto, mismo fence y fail-safe sin fuga', () => {
  it('(iv) M2: el impacto REUSA el fence; NO abre un 2o .db ni mira el cache real', () => {
    expect(impacto).not.toContain('prepararGrafoDelTurno(')
    expect(impacto).not.toContain('CACHE_REAL_DEL_GRAFO')
  })
  it('(T2/T2b) la traza fallida -> null, sin filtrar available_projects', () => {
    expect(parseTrace(errJson)).toBeNull()
    expect(parseTrace('no es json')).toBeNull()
  })
  it('(seleccion) rebanada traza solo el top CRITICAL/HIGH acotado', () => {
    expect(src).toContain('topCriticosYAltos(vivos, TOP_IMPACTO)')
  })
})
