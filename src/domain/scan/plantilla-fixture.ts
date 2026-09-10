import { readFileSync } from 'fs'
import { join } from 'path'
import type { ModuloAuditoria } from './modulo-auditoria'
import type { PlantillaDeModulo } from './resumen-de-modulo'

const KIT = join(process.cwd(), 'internal', 'AUDIT-KIT')

const FICHERO: Readonly<Partial<Record<ModuloAuditoria, string>>> = {
  M3: 'PLANTILLA_MODULO_M3_PRIVACIDAD.md',
  M8: 'PLANTILLA_MODULO_M8_INTEGRIDAD_NEGOCIO.md',
  M9: 'PLANTILLA_MODULO_M9_ACCESIBILIDAD.md',
  M2: 'PLANTILLA_MODULO_M2_DR_BCP.md'
}

/** Una plantilla REAL del kit. Contra la de verdad y no contra un `.md` de
 *  juguete: lo que se prueba es que el extractor aguanta el documento real. */
export const delKit = (modulo: ModuloAuditoria): PlantillaDeModulo => ({
  modulo,
  texto: readFileSync(join(KIT, FICHERO[modulo] ?? ''), 'utf8')
})
