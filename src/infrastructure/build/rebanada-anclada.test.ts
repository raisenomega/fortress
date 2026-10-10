import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { marcoDeGrafo } from '@domain/build/marco-de-grafo'
import { parseOverview } from '../graph/leer-overview-del-grafo'

/**
 * EL ANCLA UNICA (Sello B.1), clavada a la fuente: la custodia A/B prueba el
 * comportamiento; estos pines fijan el CAMINO, que es donde un cambio de una
 * linea rompe la ley sin que ningun proyecto de prueba lo note (p. ej. pasar
 * a resolveEditTarget deja la custodia verde y abre la puerta de editar).
 */
const src = readFileSync('src/infrastructure/build/rebanada-del-libro.ts', 'utf8')
const adaptador = readFileSync('src/infrastructure/graph/leer-overview-del-grafo.ts', 'utf8')
const runner = readFileSync('src/infrastructure/graph/correr-cli-grafo.ts', 'utf8')

describe('la resolucion es de LECTURA', () => {
  it('resuelve con resolveTarget y JAMAS con resolveEditTarget', () => {
    expect(src).toContain('resolveTarget(context, projectId)')
    expect(src).not.toContain('resolveEditTarget')
  })
})

describe('UN solo projectId parametriza cada lectura', () => {
  it('las cuatro lecturas de base van con el projectId del turno', () => {
    for (const llamada of [
      'findings.listByProject(projectId)',
      'findings.listHistoria(projectId)',
      'omegaLog.listByProject(projectId',
      'repairProposals.listByProject(projectId)'
    ])
      expect(src).toContain(llamada)
  })

  it('las dos lecturas de disco salen del path del MISMO target', () => {
    expect(src).toContain('readCognitionLog(target.value.path)')
    expect(src).toContain('listProjectDocs(target.value.path)')
  })

  it('los eventos cuelgan de las propuestas del proyecto (ancla indirecta cerrada)', () => {
    expect(src).toContain('eventLog.list(p.id)')
    expect(src).not.toContain('listLive')
  })
})

describe('PROHIBIDOS: los canales transversales no entran', () => {
  it('ni omegaLog.list sin proyecto, ni corridas por agente', () => {
    expect(src).not.toMatch(/omegaLog\.list\(/)
    expect(src).not.toContain('listByAgent')
  })
})

describe('LA LEY DEL GRAFO (Sello B.2): aislado y subordinado', () => {
  it('(i) fencea a graphSlug(path) con la copia del turno; JAMAS el cache real', () => {
    expect(adaptador).toContain('prepararGrafoDelTurno(project.path)')
    expect(adaptador).toContain('graphSlug(project.path)')
    expect(adaptador).not.toContain('CACHE_REAL_DEL_GRAFO')
    expect(runner).toContain('CBM_CACHE_DIR: cacheDir')
    expect(runner).not.toContain('CACHE_REAL_DEL_GRAFO')
  })
  it('(ii) el error del binario sale VACIO, sin nombrar a nadie (no filtra available_projects)', () => {
    const errJson = JSON.stringify({ error: 'project not found', available_projects: ['home-jojo-ensayo-fail-closed'], count: 1 }) // prettier-ignore
    expect(parseOverview(errJson)).toBeNull()
    expect(marcoDeGrafo(parseOverview(errJson)).texto).toBe('')
    expect(runner).toContain('child.stdout.on')
    expect(runner).not.toContain('child.stderr')
  })
  it('(iii) el grafo cuelga del target de LECTURA, jamas resolveEditTarget', () => {
    expect(src).toContain('leerOverviewDelGrafo(target.value)')
    expect(adaptador).not.toContain('resolveEditTarget')
  })
  it('(iv) overview acotado: aspects ["overview"], jamas ["all"] (no arrastra file_tree)', () => {
    expect(adaptador).toContain("aspects: ['overview']")
    expect(adaptador).not.toContain("'all'")
  })
})
