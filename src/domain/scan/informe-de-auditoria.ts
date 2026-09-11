import { bloqueDeCampana } from './informe-campana'
import { bloqueDeCobertura } from './informe-cobertura'
import { bloqueDeCustodia } from './informe-custodia'
import { bloqueDeHallazgos } from './informe-hallazgos'
import type { DatosDelInforme } from './informe-datos'

/**
 * El veredicto, y sobre que se calculo. Decirlo importa: el score puntua el
 * EXPEDIENTE —lo reportado MAS lo que sigue vivo sin nombrarse (ADR-065)— y no
 * la corrida. Un «92/100 con 4 hallazgos» sin esta linea es la mentira por
 * omision que el expediente vino a cerrar: el 92 salia de setenta y dos.
 */
const veredicto = (datos: DatosDelInforme): readonly string[] => [
  '## Veredicto',
  '',
  `**${datos.score}/100**, calculado sobre el EXPEDIENTE de ${datos.expediente} hallazgo(s):`,
  `lo que esta corrida reporto (${datos.reportados.length}) mas lo que seguia vivo sin que`,
  'la nombrara. No es la nota de la corrida; es la del proyecto al cerrarla.'
]

/**
 * El informe de auditoria de un escaneo (ADR-083, Fase 5). TRANSCRIBE: cada
 * cifra y cada razon vienen de `datos`, y esta funcion no consulta nada.
 *
 * Es lo que hace que el entregable sea del momento auditado. Un compositor que
 * pudiera volver a medir diria lo que aplica HOY sobre un escaneo de ayer —el
 * arbol cambio, la plantilla que faltaba ya esta sembrada— y firmaria con la
 * fecha de entonces afirmaciones que solo son ciertas ahora.
 *
 * Puro: se prueba con datos en memoria, sin disco y sin base.
 */
export function componerInforme(datos: DatosDelInforme): string {
  return [
    `# Auditoria FORTRESS — ${datos.projectName}`,
    '',
    `_${datos.at}_`,
    '',
    ...veredicto(datos),
    '',
    ...bloqueDeCobertura(datos),
    '',
    ...bloqueDeCampana(datos.modulos),
    '',
    ...bloqueDeHallazgos(datos.reportados),
    '',
    ...bloqueDeCustodia(datos),
    ''
  ].join('\n')
}
