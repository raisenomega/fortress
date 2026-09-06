import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Entre RESERVAR el carril y el `try` que lo suelta no puede haber nada.
 *
 * `guardRun` y `guardMerge` no solo comprueban: RESERVAN al conceder. Quien
 * reserva suelta en un `finally`, y todo lo que se ejecute antes de entrar en
 * ese `try` esta fuera de su alcance: si lanza, el carril queda tomado y el
 * proyecto se queda sin chat, sin escaneo y sin loop hasta reiniciar la app.
 *
 * No fue uno. El escaner encontro el del chat y al barrer aparecieron CINCO mas
 * iguales: el escaneo, el loop, el drenaje y los dos que crean un temporal —una
 * lectura o un `mkdtemp` en el hueco que el finally no cubre—. Por eso la regla
 * se DERIVA en vez de arreglarse seis veces y confiar en que nadie escriba la
 * septima. Lo que se prohibe es EJECUTAR ahi, no declarar: `let sandbox = null`
 * es legitimo —el finally necesita el nombre y un literal no puede fallar—. El
 * `if` que devuelve cuando esta ocupado tampoco cuenta: es lo unico que va ahi.
 */
const RAIZ = 'src'
const RESERVA = /\bguard(?:Run|Merge)\(/
const DECLARA = /^(?:const|let|var)\s|^await\s/
/** Declarar un nombre con un literal no ejecuta nada: no puede lanzar. */
const LITERAL = /=\s*(?:null|undefined|''|""|0|false|true|\[\]|\{\})\s*$/

const ficheros = (dir: string): readonly string[] =>
  readdirSync(dir).flatMap((entrada) => {
    const ruta = join(dir, entrada)
    if (statSync(ruta).isDirectory()) return ficheros(ruta)
    return ruta.endsWith('.ts') && !/\.test\.ts$|fixture|fake/.test(ruta) ? [ruta] : []
  })

/** Lo ejecutable que hay entre la reserva y su `try`, si lo hay. */
function huecoSinCubrir(lineas: readonly string[], desde: number): readonly string[] {
  const fuera: string[] = []
  let dentroDelIf = 0
  for (let i = desde + 1; i < Math.min(desde + 25, lineas.length); i += 1) {
    const t = (lineas[i] ?? '').trim()
    if (t.startsWith('try {')) return fuera
    if (t === '' || t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) continue
    if (dentroDelIf > 0 || t.startsWith('if (')) {
      dentroDelIf += (t.match(/\{/g) ?? []).length - (t.match(/\}/g) ?? []).length
      continue
    }
    if (DECLARA.test(t) && !LITERAL.test(t)) fuera.push(t)
  }
  return [] // sin `try` cerca: esta reserva no sigue este patron y no se juzga
}

const reservas = ficheros(RAIZ).flatMap((ruta) => {
  const lineas = readFileSync(ruta, 'utf8').split('\n')
  return lineas.flatMap((linea, i) =>
    RESERVA.test(linea) ? [{ ruta, linea: i + 1, fuera: huecoSinCubrir(lineas, i) }] : []
  )
})

describe('el carril reservado se suelta pase lo que pase', () => {
  it('el barrido encuentra reservas: si no, la regex dejo de valer', () => {
    expect(reservas.length).toBeGreaterThan(10)
  })

  it.each(reservas.map((r) => [`${r.ruta}:${r.linea}`, r] as const))(
    '%s no ejecuta nada entre reservar y el try',
    (_donde, r) => {
      // Si esto falla, la respuesta es MOVER esa linea dentro del try, no
      // ensanchar la regla: ahi fuera el `finally` no la alcanza.
      expect({ donde: `${r.ruta}:${r.linea}`, fuera: r.fuera }).toEqual({
        donde: `${r.ruta}:${r.linea}`,
        fuera: []
      })
    }
  )
})
