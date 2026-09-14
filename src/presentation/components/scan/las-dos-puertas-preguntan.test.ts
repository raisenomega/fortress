import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { avisosDeLaVerificacion } from './acto-de-verificar'
import { TITULO } from './alcance-de-la-verificacion'

const fuente = (ruta: string): string => readFileSync(join(process.cwd(), ruta), 'utf8')

const HOOK = 'src/presentation/hooks/useSeleccionDelTablero.ts'
const TABLERO = 'src/presentation/components/scan/TableroDeHallazgos.tsx'
const BOTON = 'src/presentation/components/scan/BotonVerificarTodos.tsx'

/**
 * Este gesto no lleva techo de gasto por decision, asi que el dialogo es lo
 * UNICO que hay entre el clic y la factura. Con dos puertas al mismo gasto, una
 * que no preguntara seria la unica sin barrera — y seria la de un clic sobre una
 * fila, que es el clic facil de dar sin querer.
 */
describe('las DOS puertas al gasto preguntan', () => {
  it('la barra NO gasta al pulsar: abre el dialogo', () => {
    const texto = fuente(HOOK)

    // `verificarSeleccionadas` se llama en `confirmar`, nunca en `preguntar`.
    expect(texto).toMatch(/preguntar: \(\) => setPreguntando\(true\)/)
    expect(texto).toMatch(/confirmar: \(\) => \{[\s\S]*?verificarSeleccionadas/)
  })

  it('y el boton de la barra esta cableado a preguntar, no a verificar', () => {
    expect(fuente(TABLERO)).toMatch(/onVerificar=\{seleccion\.preguntar\}/)
  })

  it('las dos puertas montan el MISMO dialogo', () => {
    expect(fuente(TABLERO)).toContain('<ConfirmVerificarTodos')
    expect(fuente(BOTON)).toContain('<ConfirmVerificarTodos')
  })
})

describe('el dialogo dice a que se refiere la cifra', () => {
  it('desde la cabecera habla de todos los mitigados', () => {
    expect(avisosDeLaVerificacion(26, 'todos').trabajo).toContain('los 26 mitigados')
    expect(TITULO.todos).toBe('Verificar todos los mitigados')
  })

  it('desde la barra habla de las que elegiste, con SU cifra', () => {
    // Decir «los 5 mitigados» tras seleccionar cinco de veintiseis sugeriria que
    // no quedan mas, que es una cosa distinta de la que pasa.
    expect(avisosDeLaVerificacion(5, 'seleccionados').trabajo).toContain('las 5 que seleccionaste')
    expect(TITULO.seleccionados).toBe('Verificar las seleccionadas')
  })

  it('una sola, en singular', () => {
    expect(avisosDeLaVerificacion(1, 'seleccionados').trabajo).toContain('la 1 que seleccionaste')
  })

  it('el trato es el mismo desde las dos: el coste y la ausencia de tope', () => {
    for (const alcance of ['todos', 'seleccionados'] as const) {
      expect(avisosDeLaVerificacion(5, alcance).coste).toContain('NO hay tope de gasto')
      expect(avisosDeLaVerificacion(5, alcance).garantia).toContain('Nada muere sin prueba')
    }
  })
})
