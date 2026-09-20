import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { bench } from './reconcile-graph-fixture'
import { reconcileGraph } from './reconcile-graph'

const fuente = (ruta: string): string => readFileSync(ruta, 'utf8')
const VIEJO = 'b'.repeat(40)

/**
 * BUG 4, CABLEADO. El dominio decide; esto prueba que la señal LLEGA — que es
 * lo que faltaba: `decideReindex` no tenia forma de saber que habia un turno.
 */
describe('el reconcilio respeta el turno vivo', () => {
  it('EL ATACANTE: con turno vivo no se encola NADA, ni con HEAD movido', async () => {
    const b = bench({ state: { indexedSha: VIEJO }, turnoVivo: true })

    expect(await reconcileGraph(b.context, 'p1', b.deps)).toBe('SKIPPED')
    expect(b.marks).toEqual([])
  })

  it('sin turno vivo, el mismo caso SI reindexa', async () => {
    const b = bench({ state: { indexedSha: VIEJO } })

    expect(await reconcileGraph(b.context, 'p1', b.deps)).toBe('STARTED')
    expect(b.marks).toContain('running')
  })

  it('el SKIP no toca el estado: no marca RUNNING ni avisa al renderer', async () => {
    // Marcar RUNNING y no correr dejaria el chip girando sobre nada hasta que
    // STALE_MS lo reclamara — quince minutos de mentira.
    const b = bench({ state: { indexedSha: VIEJO }, turnoVivo: true })

    await reconcileGraph(b.context, 'p1', b.deps)

    expect(b.notified).toEqual([])
  })
})

describe('la señal sale del carril, no de un registro nuevo', () => {
  it('la infra inyecta `isRunning`: el turno ya reserva y suelta ese carril', () => {
    // Un registro propio de checkpoints habria que soltarlo a mano, y lo que
    // se suelta a mano se queda pegado (`carril-se-suelta`). El carril ya tiene
    // su `endRun` en el `finally` de cada sitio que lo toma.
    const svc = fuente('src/infrastructure/graph/reconcile-service.ts')

    expect(svc).toMatch(/turnoVivo: isRunning/)
    expect(svc).toMatch(/import \{ isRunning \} from '\.\.\/run-control'/)
  })

  it('el lote reconcilia AL CERRAR, no por turno', () => {
    // Por turno no aportaria: el checkpoint es transitorio y no deja commit.
    const svc = fuente('src/presentation/services/resolver-lote-en-terminal.ts')
    const trasElLote = svc.indexOf('await correrLote')
    const disparo = svc.indexOf('api().graph.reindex(projectId)')

    expect(disparo).toBeGreaterThan(trasElLote)
    expect(fuente('src/presentation/services/turno-del-lote.ts')).not.toContain('reindex')
  })
})
