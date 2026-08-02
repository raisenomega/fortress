/**
 * Cifras compactas para la barra de estado. Se redondea hacia abajo a
 * proposito: es mejor que el operador se lleve una sorpresa a la baja que
 * creer que gasto menos de lo que gasto.
 */
export function formatTokens(total: number): string {
  if (total < 1000) return `${Math.max(0, Math.floor(total))}`
  if (total < 1_000_000) return `${Math.floor(total / 1000)}K`
  return `${(Math.floor(total / 100_000) / 10).toFixed(1)}M`
}

/**
 * Solo Claude Code reporta coste; el camino de solo texto lo deja en cero. Por
 * eso un coste de cero se muestra como "sin coste reportado" y no como "$0.00":
 * lo segundo afirmaria que fue gratis, que es distinto de no saberlo.
 */
export function formatCost(usd: number): string | null {
  if (usd <= 0) return null
  return usd < 0.01 ? '<$0.01' : `$${usd.toFixed(2)}`
}
