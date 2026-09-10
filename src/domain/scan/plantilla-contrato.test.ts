import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import { describe, expect, it } from 'vitest'
import { cuerpoAccionable } from './plantilla-accionable'

/**
 * El contrato con el kit. `cuerpoAccionable` depende de encabezados LITERALES
 * —«## 3 · PROMPT DE AUDITORÍA», los delimitadores, «**Entregable:**»— y eso
 * es el precio de resumir en runtime. Este test es lo que hace que el precio
 * sea aceptable: si una plantilla deja de encajar, cae aqui y en voz alta, en
 * vez de producir en silencio una parada sin su profundidad tematica.
 *
 * Lee del REPO (`internal/AUDIT-KIT/`), que es la copia de referencia. El
 * runtime lee de `userData/audit-kit/`, donde el operador siembra las suyas.
 */
const KIT = join(process.cwd(), 'internal', 'AUDIT-KIT')

const plantillas = readdirSync(KIT).filter((n) => n.startsWith('PLANTILLA_MODULO_M'))
const cuerpoDe = (fichero: string): string | null =>
  cuerpoAccionable(readFileSync(join(KIT, fichero), 'utf8'))

describe('las plantillas del kit encajan con el extractor', () => {
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
})
