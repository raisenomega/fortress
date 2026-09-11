import type { DatosDelInforme } from './informe-datos'

/**
 * De donde salio lo que el informe afirma. Es lo que separa una auditoria de
 * una opinion: sin ancla, un hallazgo «en src/pay.ts:42» no se puede ni
 * confirmar ni desmentir dentro de un año.
 *
 * Sin git se DICE que no hay ancla, y se citan huellas de fichero en su lugar.
 * Rellenar el HEAD con cualquier cosa —la fecha, un cero— daria un documento
 * que parece anclado y no lo esta, que es peor que uno que confiesa no estarlo.
 */
const SIN_ANCLA = 'sin git — no consta'

export function bloqueDeCustodia(datos: DatosDelInforme): readonly string[] {
  const huellas =
    datos.headSha !== null || datos.huellas.length === 0
      ? []
      : [
          '',
          'Sin commit que citar, la huella de cada fichero auditado:',
          '',
          '| Fichero | SHA-256 |',
          '| --- | --- |',
          ...datos.huellas.map((h) => `| \`${h.fichero}\` | \`${h.sha256}\` |`)
        ]

  return [
    '## Cadena de custodia',
    '',
    `- **HEAD del proyecto:** ${datos.headSha === null ? SIN_ANCLA : `\`${datos.headSha}\``}`,
    `- **FORTRESS:** v${datos.version}`,
    `- **Escaneo:** \`${datos.scanId}\``,
    `- **Cerrado:** ${datos.at}`,
    ...huellas
  ]
}
