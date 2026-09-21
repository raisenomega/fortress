import { describe, expect, it } from 'vitest'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { sondaDeBwrap } from './sonda-de-bwrap'

/** Un PATH de mentira con los binarios que se le digan. `bwrap` de mentira
 *  contesta lo que se le pase, para simular una maquina donde esta y no corre. */
function pathCon(binarios: Record<string, string>): string {
  const bin = mkdtempSync(join(tmpdir(), 'fortress-sandbox-bin-'))
  for (const [nombre, cuerpo] of Object.entries(binarios)) {
    writeFileSync(join(bin, nombre), `#!/bin/sh\n${cuerpo}\n`, { mode: 0o755 })
  }
  return bin
}

describe('la sonda: «instalado» no es «funciona», y falta uno = falta todo', () => {
  it('sin bwrap en el PATH: no disponible, y dice cual falta', () => {
    expect(sondaDeBwrap(pathCon({ socat: 'exit 0' }))).toEqual({ ok: false, error: 'falta-bwrap' })
  })

  it('sin socat: tampoco, aunque bwrap este — la red por lista lo necesita', () => {
    expect(sondaDeBwrap(pathCon({ bwrap: 'exit 0' }))).toEqual({ ok: false, error: 'falta-socat' })
  })

  it('bwrap instalado pero que NO puede crear la caja (AppArmor, no-userns): no disponible', () => {
    const path = pathCon({ bwrap: 'echo "bwrap: setting up uid map: Permission denied" >&2; exit 1', socat: 'exit 0' }) // prettier-ignore
    expect(sondaDeBwrap(path)).toEqual({ ok: false, error: 'bwrap-no-arranca' })
  })

  it('un bwrap que se cuelga no cuelga a FORTRESS: se corta al timeout, no cuando el quiera', () => {
    // `/bin/sleep` por ruta: el PATH de la caja de prueba no tiene nada mas, y un
    // `sleep` a secas moria con 127 al instante — y el test pasaba sin colgarse.
    const path = pathCon({ bwrap: '/bin/sleep 30', socat: 'exit 0' })
    const inicio = Date.now()
    expect(sondaDeBwrap(path, 300)).toEqual({ ok: false, error: 'bwrap-no-arranca' })
    expect(Date.now() - inicio).toBeLessThan(5000)
  })

  it('la sonda CORRE bwrap con una caja vacia y exige la salida exacta del canario', () => {
    const path = pathCon({ bwrap: 'echo "otra cosa"', socat: 'exit 0' })
    expect(sondaDeBwrap(path)).toEqual({ ok: false, error: 'bwrap-no-arranca' })
  })

  it('el bwrap que se prueba es el del PATH que se le da, no el de la maquina', () => {
    // Un PATH cuyo unico bwrap es falso y dice que no: si la sonda mirase el PATH
    // real encontraria el bwrap verdadero y contestaria que si. (El mutante «por
    // nombre» sobrevive a esto en Node 24, que respeta env.PATH: es equivalente.)
    const path = pathCon({ bwrap: 'exit 1', socat: 'exit 0' })
    expect(sondaDeBwrap(path)).toEqual({ ok: false, error: 'bwrap-no-arranca' })
  })

  it('en esta maquina, con el bwrap REAL: disponible (si no, este test dice por que)', () => {
    expect(sondaDeBwrap()).toEqual({ ok: true, value: undefined })
  })
})
