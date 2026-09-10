import { describe, expect, it } from 'vitest'
import { dividirEnParadas, profundidadDe } from './dividir-en-paradas'

/**
 * Los dos casos son DISCRIMINANTES a proposito: cada uno da paradas distintas
 * segun se agrupe por uno o por dos segmentos. Con rutas de un solo nivel las
 * dos profundidades coinciden, y un test asi pasaria igual aunque la
 * profundidad fuera una constante — comprobado con una mutacion, y por eso
 * estan anidados.
 *
 *   BAJO_CONTENEDOR  prof 2 → apps/api, apps/web    · prof 1 → apps
 *   EN_LA_RAIZ       prof 1 → api, web              · prof 2 → api/src, web/src
 */
const BAJO_CONTENEDOR = ['apps/api/main.ts', 'apps/web/index.ts']
const EN_LA_RAIZ = ['api/src/main.ts', 'web/src/index.ts']

const carpetas = (ficheros: readonly string[]): readonly string[] =>
  dividirEnParadas(ficheros).paradas.map((p) => p.carpeta)

describe('la profundidad se DEDUCE del manifiesto, no se pasa', () => {
  it('un contenedor unico pide DOS segmentos', () => {
    expect(profundidadDe(BAJO_CONTENEDOR)).toBe(2)
  })

  it('varios contenedores piden UNO', () => {
    expect(profundidadDe(EN_LA_RAIZ)).toBe(1)
  })

  it('la MISMA llamada agrupa distinto segun la forma del arbol', () => {
    // Nadie le dice a la funcion cual es cual: solo cambian las rutas. Una
    // profundidad fija —la que fuera— falla en uno de los dos.
    expect(carpetas(BAJO_CONTENEDOR)).toEqual(['apps/api', 'apps/web'])
    expect(carpetas(EN_LA_RAIZ)).toEqual(['api', 'web'])
  })

  it('un fichero suelto en la raiz NO cuenta como contenedor', () => {
    // `vite.config.ts` no convierte un proyecto de un solo `src/` en uno plano.
    expect(profundidadDe(['vite.config.ts', 'src/domain/a.ts', 'src/app/b.ts'])).toBe(2)
  })

  it('el mismo arbol da siempre el mismo manifiesto, llegue en el orden que llegue', () => {
    const alReves = [...BAJO_CONTENEDOR].reverse()

    expect(dividirEnParadas(alReves)).toEqual(dividirEnParadas(BAJO_CONTENEDOR))
  })
})
