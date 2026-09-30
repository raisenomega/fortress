import { afterEach, describe, expect, it } from 'vitest'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { CABECERAS_PUBLICAS } from './cabeceras-publicas'
import { enCaja } from './en-caja'
import { olvidarSonda } from './sonda-de-bwrap'

afterEach(olvidarSonda)

/** Las rutas que van detras de un flag de montaje, en el orden en que bwrap las lee. */
const montadas = (args: readonly string[], flag: string): readonly string[] =>
  args.flatMap((a, i) => (a === flag ? [args[i + 1] ?? ''] : []))

const argsDeLaCaja = (proyecto: string): readonly string[] => {
  const l = enCaja('git', ['status'], proyecto, proyecto)
  if (!l.ok) throw new Error(`sin caja en esta maquina: ${l.error}`)
  return l.value.args
}

/**
 * ADR-108 — las cabeceras publicas de Node y Electron entran en la caja para
 * que el gate del Motor pueda VERIFICAR: sin ellas `node-gyp configure` sale a
 * descargarlas, el proxy lo niega y `npm ci` muere. 99 de 99 verdes antes de la
 * caja, 0 de 3 despues (DEUDAS §11.1).
 */
describe('las cabeceras publicas entran en la caja clase B (ADR-108)', () => {
  it('estan, y son los DOS directorios padre', () => {
    const ro = montadas(argsDeLaCaja(process.cwd()), '--ro-bind')

    expect(CABECERAS_PUBLICAS).toEqual([
      join(homedir(), '.electron-gyp'),
      join(homedir(), '.cache', 'node-gyp')
    ])
    for (const c of CABECERAS_PUBLICAS) expect({ c, montada: ro.includes(c) }).toEqual({ c, montada: true }) // prettier-ignore
  })

  /**
   * EL PEOR CASO, y la casilla que de verdad importa. La clase B corre tambien
   * sobre repos de CLIENTE (la red de reversion del Terminal, la verificacion de
   * Construir). Con montaje ESCRIBIBLE, un proceso de la caja de un cliente
   * escribiria en la cache REAL del operador, y esas cabeceras envenenadas
   * compilarian despues el modulo nativo de FORTRESS: cadena de suministro
   * completa, de cliente a producto.
   */
  it('en SOLO LECTURA, y NUNCA en escritura', () => {
    const args = argsDeLaCaja(process.cwd())
    const ro = montadas(args, '--ro-bind')
    const rw = montadas(args, '--bind')

    for (const c of CABECERAS_PUBLICAS) {
      expect({ c, soloLectura: ro.includes(c), escritura: rw.includes(c) }).toEqual({ c, soloLectura: true, escritura: false }) // prettier-ignore
    }
  })

  /**
   * EL VECTOR DE LA TRIFECTA, cerrado por construccion. Montar
   * `<padre>/<version>` obligaria a sacar la version de algun sitio, y el sitio
   * natural es el `package.json` del proyecto: un dato que el repo AUDITADO
   * controla, entrando en la lista de montajes de la caja. Los padres no piden
   * ninguna entrada, asi que dos proyectos distintos montan lo MISMO.
   */
  it('no se derivan del proyecto: dos proyectos distintos montan lo mismo', () => {
    const unas = montadas(argsDeLaCaja(process.cwd()), '--ro-bind').filter((r) => CABECERAS_PUBLICAS.includes(r)) // prettier-ignore
    const otras = montadas(argsDeLaCaja(join(process.cwd(), 'src')), '--ro-bind').filter((r) => CABECERAS_PUBLICAS.includes(r)) // prettier-ignore

    expect(unas).toEqual(otras)
    expect(unas).toEqual([...CABECERAS_PUBLICAS])
  })

  it('y ninguna lleva version: se monta el padre, no un hijo suyo', () => {
    for (const c of CABECERAS_PUBLICAS) {
      expect({ c, conVersion: /\/\d+\.\d+\.\d+$/.test(c) }).toEqual({ c, conVersion: false })
    }
  })
})
