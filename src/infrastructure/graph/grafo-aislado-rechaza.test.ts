import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { graphSlug } from '@domain/graph/graph-slug'
import { prepararGrafoDelTurno } from './grafo-del-turno'
import { cliAislado, esLaFijada, repoIndexado } from './grafo-rechaza-fixture'

const raiz = mkdtempSync(join(tmpdir(), 'grafo-rechaza-'))
const cli = cliAislado(raiz)
afterAll(() => rmSync(raiz, { recursive: true, force: true }))

describe.skipIf(!esLaFijada)(
  'con la copia del turno, el servidor RECHAZA lo que no esta y no lo calla (casilla 4)',
  () => {
    it('ve el proyecto de la copia; a otro cliente lo rechaza con error legible y solo lista lo que tiene', async () => {
      const cache = join(raiz, 'cache-de-mentira')
      const proyecto = repoIndexado(raiz, 'proyecto', cache)
      const otro = repoIndexado(raiz, 'otro', cache)
      const grafo = await prepararGrafoDelTurno(proyecto, join(raiz, 'turnos'), cache)
      try {
        const propio = cli(grafo.dir, 'get_architecture', { project: graphSlug(proyecto) })
        expect(propio.rc).toBe(0)
        expect(propio.out).toContain(`"project":"${graphSlug(proyecto)}"`)
        const ajeno = cli(grafo.dir, 'get_architecture', { project: graphSlug(otro) })
        expect(ajeno.rc).not.toBe(0)
        expect(ajeno.err).toContain('project not found or not indexed')
        expect(ajeno.err).toContain(graphSlug(proyecto))
        expect(ajeno.err).not.toContain(graphSlug(otro))
      } finally {
        grafo.liberar()
      }
    })

    it('un proyecto sin .db deja el directorio vacio, y el servidor lo dice: nada indexado, no una lista vacia', async () => {
      const grafo = await prepararGrafoDelTurno(
        join(raiz, 'sin-indice'),
        join(raiz, 'turnos'),
        join(raiz, 'cache-de-mentira')
      )
      try {
        const r = cli(grafo.dir, 'search_graph', { project: 'lo-que-sea', query: 'x' })
        expect(r.rc).not.toBe(0)
        expect(r.err).toContain('No projects indexed yet')
      } finally {
        grafo.liberar()
      }
    })
  }
)
