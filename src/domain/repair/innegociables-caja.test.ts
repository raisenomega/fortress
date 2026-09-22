import { describe, expect, it } from 'vitest'
import { cubierto, fuente, todos } from './innegociables-fixture'

/**
 * La CAJA (ADR-092) es la contencion de lo que corre: quien monta bwrap, arma la
 * config del CLI, decide a que registros sale la red, o contesta si la caja
 * existe. Un fix que la ensanchara —un host mas en la tabla, un `denyRead`
 * menos, la sonda que siempre dice que si— soltaria al agente sin que el
 * operador firme. Se deriva por lo que cada fichero DEFINE, no por su nombre:
 * si la caja se muda, la proteccion la sigue.
 */
const CAJA =
  /export (?:async )?function (flagsDeBwrap|porQueNoSeMonta|configDelSandbox|argsDelSandbox|registrosDe|esRegistro|leerConnect|permitido|enCaja|conSandbox|sondaDeBwrap|cajaDisponible|abrirProxyDeRegistros)\b|export const (SIN_HOOKS|REGISTROS_DE_PAQUETES)\b/

const cajas = todos.filter((f) => CAJA.test(fuente(f)))

describe('la caja no la ensancha el auto-merge', () => {
  it('el barrido encuentra la caja: si no, la regex dejo de valer', () => {
    expect(cajas.length).toBeGreaterThanOrEqual(9)
  })

  it.each(cajas)('%s monta o abre la caja: innegociable', (fichero) => {
    expect({ fichero, protegido: cubierto(fichero) }).toEqual({ fichero, protegido: true })
  })
})
