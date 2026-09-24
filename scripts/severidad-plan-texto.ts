import type { Excluida, Restauracion } from '../src/domain/project/restauracion-de-severidad.ts'

const RANGO: Readonly<Record<string, number>> = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 }
const corto = (t: string, n = 70): string => (t.length <= n ? t : `${t.slice(0, n - 1)}…`)
const sitio = (f: string, l: number | null): string =>
  `${f.split('/').slice(-2).join('/')}:${l ?? '-'}`
const REGLA =
  'Regla (ADR-103 §3): cada fila viva de familia cuya banda la puso la tabla de seguridad recupera la palabra del modelo, leida de la nota mas reciente del Libro que la nombra con esa misma banda; en las dos direcciones; ambiguas y tocadas despues no se tocan.' // prettier-ignore

/** El plan tal y como se aprueba, fila a fila. Nada se escribe aqui. */
export function textoDelPlan(
  proyecto: string,
  base: string,
  plan: readonly Restauracion[],
  excluidas: readonly Excluida[]
): readonly string[] {
  const suben = plan.filter((r) => RANGO[r.a] > RANGO[r.de]).length
  const porTipo = new Map<string, number>()
  for (const r of plan) porTipo.set(r.tipo, (porTipo.get(r.tipo) ?? 0) + 1)
  const lineas = [
    `PLAN DE RESTAURACION DE SEVERIDAD · proyecto=${proyecto} · base=${base} · filas=${plan.length} · suben=${suben} · bajan=${plan.length - suben} · excluidas=${excluidas.length}`, // prettier-ignore
    `Por tipo: ${[...porTipo.entries()].sort((a, b) => b[1] - a[1]).map(([t, c]) => `${t}=${c}`).join(' · ') || '(ninguna)'}`, // prettier-ignore
    REGLA,
    ''
  ]
  for (const r of plan) {
    lineas.push(`${r.id.slice(0, 8)}  ${sitio(r.file, r.line)}  ${r.tipo}  ${r.de} -> ${r.a}  "${corto(r.title)}"`) // prettier-ignore
  }
  if (excluidas.length > 0) {
    lineas.push('', 'EXCLUIDAS (no se tocan):')
    for (const e of excluidas) lineas.push(`  ${e.id.slice(0, 8)}  ${e.razon}`)
  }
  return lineas
}
