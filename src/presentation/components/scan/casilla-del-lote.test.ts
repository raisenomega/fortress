import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * El cableado del lote al Terminal (ADR-088). Se lee el FUENTE, como
 * `resolver-en-la-fila`: los tests de este repo no pintan componentes, y lo que
 * hay que fijar es QUE condicion lleva cada pieza y que la de verificar no cambio.
 */
const fuente = (ruta: string): string => readFileSync(join(process.cwd(), ruta), 'utf8')
const SCAN = 'src/presentation/components/scan/'

describe('la casilla del lote sale solo donde el Terminal resuelve de verdad', () => {
  it('el hook la ofrece solo si el proyecto es resoluble; si no, la tabla recibe null', () => {
    expect(fuente('src/presentation/hooks/useLoteDelTablero.ts')).toMatch(
      /enLaTabla: loteDisponible\(resoluble\) \? \{ seleccion, alternar \} : null/
    )
  })

  it('la cajita de la fila: con lote, y solo en las filas que piden trabajo', () => {
    expect(fuente(`${SCAN}CajitaDelLote.tsx`)).toMatch(
      /if \(lote === null \|\| !seResuelveEnTerminal\(fila\)\) return null/
    )
  })

  it('va en la rama de las no verificables: la de «Verificar mitigados» sigue tal cual', () => {
    expect(fuente(`${SCAN}FindingRow.tsx`)).toMatch(
      /\{sePuedeVerificar \? \(\s*<CajitaDeSeleccion\s*marcada=\{seleccionada\}\s*titulo=\{`Seleccionar: \$\{finding\.title\}`\}\s*onToggle=\{\(\) => onSeleccionar\(finding\.id\)\}\s*\/>\s*\) : \(\s*<CajitaDelLote lote=\{props\.lote\} finding=\{finding\} fila=\{\{ dismissed, mitigado \}\} \/>/
    )
  })

  it('sin «seleccionar todos» para el lote: la cabecera solo conoce los verificables', () => {
    const cabecera = fuente(`${SCAN}FindingsTable.tsx`).split('<thead>')[1].split('</thead>')[0]
    expect(cabecera).toContain('onToggle={props.onTodasLasVisibles}')
    expect(cabecera).not.toMatch(/lote/i)
  })
})

describe('la cola se engancha a Detener, y la barra va aparte', () => {
  it('Detener corta el lote ANTES de matar el turno', () => {
    expect(fuente('src/presentation/services/chat-service.ts')).toMatch(
      /useColaDelLoteStore\.getState\(\)\.cortar\(projectId\)\s*await api\(\)\.chat\.stop\(projectId\)/
    )
  })

  it('la barra del lote es otra; la de verificar se pinta como antes', () => {
    const tablero = fuente(`${SCAN}TableroDeHallazgos.tsx`)
    expect(tablero).toMatch(/<BarraDelLote/)
    expect(tablero).toMatch(/<BarraDeSeleccion\s*seleccionados=\{tablero\.seleccion\.size\}/)
  })

  it('pulsar el lote PRECARGA el plan: no llama a la cola', () => {
    const preparar = fuente('src/presentation/services/preparar-lote.ts')
    expect(preparar).toMatch(/useColaDelLoteStore\.getState\(\)\.preparar\(projectId, ids\)/)
    expect(preparar).not.toMatch(/correrLote/)
  })

  it('el boton cambia de gesto: precargar el plan, o aprobarlo', () => {
    expect(fuente(`${SCAN}BarraDelLote.tsx`)).toMatch(/onClick=\{pendiente \? onAprobar : onPreparar\}/) // prettier-ignore
  })

  it('el flujo de aprobacion general no se toca: la puerta del envio sigue igual', () => {
    const puerta = fuente('src/presentation/services/puerta-del-envio.ts')
    expect(puerta).not.toMatch(/lote|Lote/)
  })
})
