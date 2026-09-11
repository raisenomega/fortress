import type { DatosDelInforme } from './informe-datos'
import { NOMBRE_MODULO } from './modulo-auditoria'
import { PORQUE_SE_CORTO } from './motivo-en-palabras'

const cuenta = (datos: DatosDelInforme): string =>
  datos.ficherosCubiertos === null || datos.ficherosTotal === null
    ? 'Sin manifiesto: no consta cuantos ficheros se miraron'
    : `Audito **${datos.ficherosCubiertos} de ${datos.ficherosTotal}** ficheros`

/**
 * La cobertura declarada, en sus DOS cuentas (ADR-082 + ADR-083). Los ficheros
 * miden las paradas de carpeta; los modulos tematicos no cubren ficheros —miran
 * el proyecto entero— y por eso se cuentan aparte. Sumarlos a los ficheros
 * daria mas del cien por cien; callarlos diria que no se auditaron.
 */
export function bloqueDeCobertura(datos: DatosDelInforme): readonly string[] {
  const temas = datos.modulos.temasCorridos
  const linea =
    temas.length === 0
      ? 'Ningun modulo tematico corrio.'
      : `Y **${temas.length}** modulo(s) tematico(s): ${temas.map((m) => `${m} ${NOMBRE_MODULO[m]}`).join(', ')}.` // prettier-ignore

  return [
    '## Cobertura declarada',
    '',
    `${cuenta(datos)}, en **${datos.paradasHechas} de ${datos.paradasTotal}** paradas.`,
    linea,
    '',
    `**Cierre:** ${datos.estado} — ${PORQUE_SE_CORTO[datos.motivo]}.`
  ]
}
