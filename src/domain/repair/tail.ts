/**
 * Los ultimos n chars de un texto, cortando en salto de linea si hay uno
 * razonablemente cerca del corte: una autopsia que empieza a media linea
 * confunde mas de lo que informa.
 */
export function tail(text: string, n: number): string {
  if (n <= 0) return ''
  if (text.length <= n) return text
  const cut = text.slice(-n)
  const salto = cut.indexOf('\n')
  // Solo se descarta la primera linea partida si queda contenido detras.
  return salto !== -1 && salto < cut.length - 1 ? cut.slice(salto + 1) : cut
}
