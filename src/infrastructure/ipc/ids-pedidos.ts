/**
 * Los ids que llegan del renderer, saneados: cadenas no vacias y sin repetir.
 *
 * Una lista sucia no puede FORZAR nada —`elegirParaVerificar` revalida cada una
 * contra la base, y lo que no este mitigado cae en su casilla del parte sin
 * gastar corrida— pero un id repetido si costaria dos analisis del mismo sitio,
 * y eso son cinco dolares por un descuido de la pantalla.
 */
export function idsPedidos(crudo: unknown): readonly string[] {
  if (!Array.isArray(crudo)) return []
  return [...new Set(crudo.map(String).filter((id) => id !== ''))]
}
