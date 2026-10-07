/**
 * PASO 84 (orden del operador): el color de la PALABRA de la herramienta en
 * las lineas de actividad en vivo (`· Herramienta: detalle`,
 * run-accumulator.ts). SOLO la palabra: el resto de la linea queda en el tono
 * normal. Las clases apuntan a los tokens --tool-* (AA medido sobre los dos
 * fondos), que viven FUERA de la paleta de identidad, como --proceso.
 */
const COLOR: Readonly<Record<string, string>> = {
  Glob: 'text-tool-glob',
  Read: 'text-tool-read',
  Grep: 'text-tool-grep',
  Bash: 'text-tool-bash',
  Edit: 'text-tool-write',
  Write: 'text-tool-write',
  Task: 'text-tool-task',
  WebFetch: 'text-tool-web',
  WebSearch: 'text-tool-web'
}

export const colorDe = (herramienta: string): string => COLOR[herramienta] ?? 'text-tool-otra'

/** La forma exacta con la que emite run-accumulator.ts:45: la palabra termina
 *  donde empiezan los dos puntos del detalle (que son del RESTO, no de ella). */
const ACTIVIDAD = /^· ([^\s:]+)(.*)$/

export function actividadDe(linea: string): { herramienta: string; resto: string } | null {
  const partes = ACTIVIDAD.exec(linea)
  return partes === null ? null : { herramienta: partes[1], resto: partes[2] }
}
