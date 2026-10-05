/**
 * Los modelos que DE VERDAD corrieron, leidos del `modelUsage` de la salida del
 * CLI (medido: `{"claude-opus-5-5": {...}}`), con el PRINCIPAL —el de mas
 * salida— primero: el CLI usa modelos auxiliares por debajo y un haiku de
 * servicio no es «el agente corrio en haiku». Sin el campo, lista vacia.
 */
export function modelosUsados(j: Record<string, unknown>): readonly string[] {
  const uso = j.modelUsage
  if (uso === null || typeof uso !== 'object') return []
  const salida = (v: unknown): number => {
    const o = (v as Record<string, unknown> | null)?.outputTokens
    return typeof o === 'number' ? o : 0
  }
  return Object.entries(uso as Record<string, unknown>)
    .sort(([, a], [, b]) => salida(b) - salida(a))
    .map(([id]) => id)
}
