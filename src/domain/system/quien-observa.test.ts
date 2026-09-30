import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import { describe, expect, it } from 'vitest'

/**
 * Quien observa a FORTRESS y quien NO, fijado por lectura del fuente — molde
 * `quien-asienta-su-corrida`: los dos caminos compilan igual, asi que el unico
 * sitio donde se comprueba la eleccion es donde se escribe.
 *
 * Los dos errores son caros. No enganchar a quien debe deja a FORTRESS ciega
 * donde mas ve codigo ajeno. Y enganchar a un INTERACTIVO mete un bloque
 * `NOTAS:` en la conversacion que el operador esta leyendo: emiten en vivo por
 * trozo, no se puede retener sin dejar de ser en vivo, y quien lo haria es
 * `en-vivo-tachado`, que es INNEGOCIABLE. Por eso los cinco esperan su fase.
 */
const OBSERVAN: ReadonlyArray<readonly [string, string]> = [
  ['src/domain/scan/report-contract.ts', 'NOTAS_COMO_CLAVE'],
  ['src/domain/scan/juicio-prompt.ts', 'NOTAS_COMO_BLOQUE'],
  ['src/domain/repair/omega-prompt.ts', 'NOTAS_COMO_CLAVE'],
  // El analista (C2) se habia quedado fuera con su PROPIA redaccion y un area en
  // texto libre. No es un olvido inocuo: era el unico que no podia clasificar,
  // porque su prompt nunca nombraba la lista.
  ['src/domain/repair/analysis-prompt-formato.ts', 'NOTAS_COMO_CLAVE'],
  // Construir (sub-pieza 3 del #5): sus tres prompts responden prosa y ninguno
  // emite en vivo (onChunk vacio), asi que el bloque cabe y se quita del texto.
  ['src/domain/build/build-prompt.ts', 'NOTAS_COMO_BLOQUE']
]

const fuente = (ruta: string): string => readFileSync(join(process.cwd(), ruta), 'utf8')

/** Todo fuente de `src`, sin tests: donde podria reaparecer una copia. */
const fuentes = (): readonly string[] =>
  readdirSync('src', { recursive: true, encoding: 'utf8' })
    .filter((r) => r.endsWith('.ts') && !r.endsWith('.test.ts'))
    .map((r) => join('src', r))

describe('los NO-interactivos piden sus notas', () => {
  it.each(OBSERVAN)('%s pide notas con %s', (ruta, marca) => {
    expect(fuente(ruta)).toContain(marca)
  })

  it('y todos usan el MISMO texto: varias redacciones pedirian cosas distintas', () => {
    const compartido = fuente('src/domain/system/peticion-de-notas.ts')

    expect(compartido).toContain('la herramienta que te ejecuta, NO el proyecto')
    for (const [ruta] of OBSERVAN) expect(fuente(ruta)).toContain('peticion-de-notas')
  })

  /**
   * Los dos agujeros del guardian, cerrados con lo que un mutante enseno.
   *
   * El primero: la lista se comprueba fila a fila, asi que QUITAR una no rompe
   * nada —un `it.each` con una fila menos corre menos casos y pasa—. Medido: el
   * mutante que saco al analista del guardian SOBREVIVIO.
   *
   * El segundo: la lista solo mira a quien ya esta en ella. El texto de la
   * peticion vive en UN sitio, y quien lo lleve sin importarlo tiene una copia
   * —que es el desfase que el modulo compartido existe para evitar—. Esto se
   * deriva del fuente, asi que cubre tambien el prompt que nazca manana.
   */
  it('la lista no adelgaza en silencio, y nadie repite nombre', () => {
    expect(OBSERVAN.length).toBeGreaterThanOrEqual(5)
    expect(new Set(OBSERVAN.map(([ruta]) => ruta)).size).toBe(OBSERVAN.length)
  })

  it('el texto de la peticion no tiene copias: quien lo lleva, lo importa', () => {
    const conElTexto = fuentes().filter((r) => /Clave OPCIONAL "notes"|NOTAS:\[/.test(fuente(r)))

    expect(conElTexto).toEqual(['src/domain/system/peticion-de-notas.ts'])
  })
})
