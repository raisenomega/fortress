import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * EL ANCLA UNICA (Sello B.1), clavada a la fuente: la custodia A/B prueba el
 * comportamiento; estos pines fijan el CAMINO, que es donde un cambio de una
 * linea rompe la ley sin que ningun proyecto de prueba lo note (p. ej. pasar
 * a resolveEditTarget deja la custodia verde y abre la puerta de editar).
 */
const src = readFileSync('src/infrastructure/build/rebanada-del-libro.ts', 'utf8')

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
