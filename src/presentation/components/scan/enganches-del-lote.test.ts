import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/** Los enganches del lote (ADR-088, arco 1), leidos del FUENTE como su hermano
 *  `casilla-del-lote`: donde arranca, donde se corta y que se le promete. */
const fuente = (ruta: string): string => readFileSync(join(process.cwd(), ruta), 'utf8')
const SCAN = 'src/presentation/components/scan/'

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

  it('el flujo de aprobacion general no se toca: la puerta del envio sigue igual', () => {
    const puerta = fuente('src/presentation/services/puerta-del-envio.ts')
    expect(puerta).not.toMatch(/lote|Lote/)
  })
})

describe('lo que se le dice al operador al aprobar el plan', () => {
  it('el boton cambia de gesto: precargar el plan, o aprobarlo', () => {
    expect(fuente(`${SCAN}BarraDelLote.tsx`)).toMatch(/onClick=\{pendiente \? onAprobar : onPreparar\}/) // prettier-ignore
  })

  it('y dice que autoriza EDICION sin mas preguntas', () => {
    expect(fuente(`${SCAN}BarraDelLote.tsx`)).toContain('editara sin volver a preguntar')
  })

  it('el consentimiento se escribe en el chat ANTES de arrancar la cola', () => {
    const servicio = fuente('src/presentation/services/resolver-lote-en-terminal.ts')
    expect(servicio).toMatch(
      /await p\.contar\(avisoDeAprobacion\(pendiente\.ids\.length\)\)\s*const hecho = await correrLote\(/
    )
  })
})
