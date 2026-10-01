import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import { describe, expect, it } from 'vitest'
import { cuerpoAccionable } from './plantilla-accionable'
import { kitDisponible, RAZON_SIN_KIT, RUTA_DEL_KIT } from './contrato-del-kit'

/**
 * El contrato con el kit. `cuerpoAccionable` depende de encabezados LITERALES
 * —«## 3 · PROMPT DE AUDITORÍA», los delimitadores, «**Entregable:**»— y eso
 * es el precio de resumir en runtime. Este test es lo que hace que el precio
 * sea aceptable: si una plantilla deja de encajar, cae aqui y en voz alta, en
 * vez de producir en silencio una parada sin su profundidad tematica.
 *
 * Su sujeto son LOS DOCUMENTOS del operador, no el codigo —de eso se encargan
 * los cuatro tests que leen la plantilla sintetica—. Lee del REPO
 * (`internal/AUDIT-KIT/`), que es la copia de referencia; el runtime lee de
 * `userData/audit-kit/`, donde el operador siembra las suyas.
 *
 * SE SALTA DICIENDOLO donde el kit no esta (el worktree del gate del Motor):
 * alli no hay documentos que medir. FALLA si el kit esta y alguno no encaja.
 * NUNCA pasa en silencio por ausencia — ver `contrato-del-kit`.
 */
const hayKit = kitDisponible()
if (!hayKit) console.warn(`[plantilla-contrato] SALTADO — ${RAZON_SIN_KIT}`)

const plantillas = hayKit
  ? readdirSync(RUTA_DEL_KIT).filter((n) => n.startsWith('PLANTILLA_MODULO_M'))
  : []
/** Los pasos posibles, en orden: el cuerpo tiene que ser un prefijo de esto. */
const PASOS = [...'ABCDEFGHI']

const cuerpoDe = (fichero: string): string | null =>
  cuerpoAccionable(readFileSync(join(RUTA_DEL_KIT, fichero), 'utf8'))

describe.skipIf(!hayKit)(`las plantillas del kit encajan con el extractor`, () => {
  it('el kit tiene las doce: si no, el barrido dejo de valer', () => {
    expect(plantillas).toHaveLength(12)
  })

  it.each(plantillas)('%s tiene seccion 3 extraible', (fichero) => {
    // No basta con que no sea null: un cuerpo de dos lineas seria un contrato
    // roto que pasa. Los cuerpos reales van de 900 a 2600 bytes.
    expect({ fichero, largo: (cuerpoDe(fichero) ?? '').length > 400 }).toEqual({
      fichero,
      largo: true
    })
  })

  it.each(plantillas)('%s empieza por el paso A, que es donde arranca el cuerpo', (fichero) => {
    expect(cuerpoDe(fichero)?.startsWith('**A.')).toBe(true)
  })

  /**
   * Lo que antes vivia en `plantilla-poda` sobre M8, y es del DOCUMENTO. Alli
   * exigia «del A al I», que es FALSO en nueve de las doce: medido, los cuerpos
   * van de SEIS pasos (M1, M4, M7) a nueve (M5, M8, M12). El contrato de verdad
   * es que sea una TIRA SEGUIDA DESDE A: un hueco en medio significa que el
   * extractor corto por donde no debia, y eso si hay que verlo.
   */
  it.each(plantillas)('%s trae una tira de pasos seguida desde A', (fichero) => {
    const cuerpo = cuerpoDe(fichero) ?? ''
    const hay = PASOS.filter((p) => cuerpo.includes(`**${p}.`))
    const seguida = PASOS.slice(0, hay.length)

    expect({ fichero, hay, basta: hay.length >= 6 }).toEqual({ fichero, hay: seguida, basta: true }) // prettier-ignore
  })
})
