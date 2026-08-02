/**
 * COGNITION-LOG.md viene de fabrica lleno de plantillas y ejemplos, y los
 * ejemplos tienen pinta de datos de verdad: "src/auth/ 0.90 Maneja
 * autenticacion + 2 bugs previos" es una linea de muestra, no una medida.
 *
 * Sin este filtro el panel pintaria un mapa de atencion inventado sobre un
 * proyecto que nadie ha analizado nunca. Es el riesgo mas serio de todo el
 * panel: datos falsos con aspecto de reales.
 */
const EXAMPLE = /ejemplo|plantilla/i

/** Relleno sin valor: corchetes, guiones largos y avisos de "aun no hay". */
const PLACEHOLDER = /\[[^\]]*\]/

export function isPlaceholder(value: string): boolean {
  const text = value.trim()
  if (text === '' || text === '—' || text === '-') return true
  return PLACEHOLDER.test(text)
}

/**
 * Lineas utiles de una seccion: todo lo anterior a la primera marca de
 * ejemplo. Cortar en vez de filtrar linea a linea es deliberado: lo que sigue
 * a "EJEMPLO DE COMO SE LLENA" es muestra hasta el final del bloque.
 */
export function realLines(section: string): readonly string[] {
  const lines = section.split('\n')
  const cut = lines.findIndex((line) => EXAMPLE.test(line))

  return (cut === -1 ? lines : lines.slice(0, cut))
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

/** Numero declarado tras una etiqueta, o null si es relleno. */
export function readNumber(lines: readonly string[], label: RegExp): number | null {
  const line = lines.find((entry) => label.test(entry))
  if (!line) return null

  const value = line.slice(line.indexOf(':') + 1)
  if (isPlaceholder(value)) return null

  const parsed = Number.parseFloat(value.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}
