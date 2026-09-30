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
  /export (?:async )?function (flagsDeBwrap|porQueNoSeMonta|configDelSandbox|argsDelSandbox|registrosDe|esRegistro|leerConnect|permitido|enCaja|conSandbox|sondaDeBwrap|cajaDisponible|abrirProxyDeRegistros|gitComunDe)\b|export const (SIN_HOOKS|REGISTROS_DE_PAQUETES)\b/

const cajas = todos.filter((f) => CAJA.test(fuente(f)))

describe('la caja no la ensancha el auto-merge', () => {
  it('el barrido encuentra la caja: si no, la regex dejo de valer', () => {
    expect(cajas.length).toBeGreaterThanOrEqual(9)
  })

  it.each(cajas)('%s monta o abre la caja: innegociable', (fichero) => {
    expect({ fichero, protegido: cubierto(fichero) }).toEqual({ fichero, protegido: true })
  })

  it('quien rellena la lista de ESCRITURA entra por lo que DEFINE, no por su carpeta', () => {
    // Ya estaba protegido, pero por el glob `src/infrastructure/sandbox/**`: la
    // defensa iba atada a la CARPETA, y si el fichero se muda el glob deja de
    // cubrirlo sin que nada avise. `gitComunDe` lee el `.git` del repo AUDITADO y
    // su texto acababa en la lista de escritura de bwrap sin validar (medido el
    // 2026-09-29 con un bwrap real: abria el HOME entero). Que la siga la funcion.
    expect(cajas).toContain('src/infrastructure/sandbox/lo-que-ve-la-caja.ts')
  })
})
