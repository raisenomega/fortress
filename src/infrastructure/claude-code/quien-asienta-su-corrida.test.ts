import { readFileSync } from 'fs'
import { join } from 'path'
import { describe, expect, it } from 'vitest'

/**
 * Quien envuelve su agente decide si su corrida consta, y esa decision se toma
 * al CREARLO. Este barrido la fija en los dos sentidos, porque los dos errores
 * son caros: no envolver deja un agente gastando en silencio —lo que hizo el
 * juez hasta el 2026-09-11— y envolver a quien ya asienta duplica su factura.
 *
 * Se lee el FUENTE, como `innegociables-derivados` y `quien-tiene-techo`: los
 * dos caminos compilan igual, asi que el unico sitio donde se comprueba la
 * eleccion es donde se escribe.
 */
const SIN_ORQUESTADOR: readonly string[] = [
  'src/infrastructure/build/build-target.ts',
  'src/infrastructure/genesis/genesis-ops.ts',
  'src/infrastructure/ipc/capability-episode-handlers.ts',
  'src/infrastructure/ipc/agent-draft-handlers.ts',
  'src/infrastructure/scan/armar-escaneo.ts'
]

/** Estos YA asientan desde su orquestador: envolverlos seria una segunda fila. */
const YA_ASIENTAN: ReadonlyArray<readonly [string, string]> = [
  ['src/infrastructure/ipc/chat-engines.ts', 'recordChatRun, desde finish-turn'],
  ['src/application/repair/plan-repair.ts', 'recordMotorRun'],
  ['src/application/scan/filas-del-cierre.ts', 'el agregado del cierre']
]

const fuente = (ruta: string): string => readFileSync(join(process.cwd(), ruta), 'utf8')

describe('los que no tienen orquestador envuelven su agente', () => {
  it.each(SIN_ORQUESTADOR)('%s asienta con el decorador', (ruta) => {
    expect(fuente(ruta)).toContain('agenteQueAsientaCorrida')
  })

  it('el A/B del grafo va por `agentFor`, y manda su projectId o no constaria', () => {
    const ab = fuente('src/infrastructure/graph/ab-graph.ts')

    expect(ab).toContain('agentFor(context)')
    // En la PETICION, no en la firma: el nombre del parametro sobrevive a
    // quitarlo del objeto, y entonces su corrida deja de constar.
    expect(ab).toMatch(/\{\s*projectPath,\s*projectId,/)
  })
})

describe('los que ya asientan NO se envuelven: seria duplicar', () => {
  it.each(YA_ASIENTAN)('%s (%s)', (ruta) => {
    expect(fuente(ruta)).not.toContain('agenteQueAsientaCorrida')
  })

  it('y en el escaneo solo va envuelto el JUEZ, no el escaner', () => {
    const armar = fuente('src/infrastructure/scan/armar-escaneo.ts')

    expect(armar).toMatch(/crearJuez\(\s*\n?\s*agenteQueAsientaCorrida/)
    expect(armar).toContain('createClaudeScanner(agente,')
  })

  it('siguen siendo CINCO y TRES: ni un creador nuevo sin decidir', () => {
    expect(SIN_ORQUESTADOR).toHaveLength(5)
    expect(YA_ASIENTAN).toHaveLength(3)
  })
})
