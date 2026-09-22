import type { Fusion } from '../src/domain/project/fusion-de-duplicados.ts'
import type { Retipado } from '../src/domain/project/retipado-de-otros.ts'

/** Una fila del plan del re-tipado: el veredicto mas lo que la fila era. */
export type FilaDelRetipado = Retipado & {
  readonly file: string
  readonly line: number | null
  readonly title: string
  readonly severity: string
  readonly identidad_vieja: string
}

const corto = (t: string, n = 70): string => (t.length <= n ? t : `${t.slice(0, n - 1)}…`)
const sitio = (f: string, l: number | null): string =>
  `${f.split('/').slice(-2).join('/')}:${l ?? '-'}`

const destino = (r: FilaDelRetipado): string => {
  if (r.desenlace === 'retipada') return `RETIPADA a ${r.tipo} → identidad=${r.identidad_nueva}`
  if (r.desenlace === 'sigue_otro') return `SIGUE otro${r.nota === null ? '' : ` (${r.nota})`}`
  return `SIN DECIDIR (${r.motivo}) → no se toca`
}

const REGLA = 'Regla (ADR-100 §5): cada otro recibe la clase que el agente eligio SOLO de la lista; si dijo otro, sigue otro; sin respuesta no se toca. RECLASIFICAR escribe identidad y tipo, y nada mas: status, lifecycle, first_seen, fingerprint, titulo, severidad y simbolo no se tocan. Dos vivas con la misma identidad de hoy son el mismo defecto (ADR-071): sobrevive la mas antigua, la otra queda fusionada-con-<ganadora>.' // prettier-ignore

const fusion = (f: Fusion): string =>
  `${f.absorbidas.length + 1}->1  ${f.identidad}  sobrevive ${f.ganadora.slice(0, 8)}, absorbe ${f.absorbidas.map((a) => a.slice(0, 8)).join(' ')}` // prettier-ignore

/** El plan del re-tipado tal y como se aprueba, fila a fila. Nada se escribe aqui. */
export function planDelRetipado(
  proyecto: string,
  filas: readonly FilaDelRetipado[],
  fusiones: readonly Fusion[]
): readonly string[] {
  const n = (d: Retipado['desenlace']): number => filas.filter((f) => f.desenlace === d).length
  const porTipo = new Map<string, number>()
  for (const f of filas) if (f.desenlace === 'retipada') porTipo.set(f.tipo, (porTipo.get(f.tipo) ?? 0) + 1) // prettier-ignore
  const lineas = [
    `PLAN DEL RE-TIPADO · proyecto=${proyecto} · vivas en otro=${filas.length} · RETIPADAS=${n('retipada')} · SIGUEN otro=${n('sigue_otro')} · sin decidir=${n('sin_decidir')} · fusiones=${fusiones.length}`, // prettier-ignore
    `Por tipo: ${[...porTipo.entries()].sort((a, b) => b[1] - a[1]).map(([t, c]) => `${t}=${c}`).join(' · ') || '(ninguna)'}`, // prettier-ignore
    REGLA,
    ''
  ]
  for (const f of filas) {
    lineas.push(`${f.id.slice(0, 8)}  ${sitio(f.file, f.line)}  ${f.severity}  "${corto(f.title)}"`)
    lineas.push(`          → ${destino(f)}`)
    if (f.desenlace !== 'sin_decidir' && f.razon !== '') lineas.push(`          razon: ${corto(f.razon, 110)}`) // prettier-ignore
  }
  lineas.push('', `FUSIONES (ADR-071): ${fusiones.length}${fusiones.length === 0 ? ' — ninguna identidad de hoy queda repetida' : ''}`) // prettier-ignore
  for (const f of fusiones) lineas.push(`  ${fusion(f)}`)
  return lineas
}
