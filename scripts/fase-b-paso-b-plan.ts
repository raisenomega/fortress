import type { Fusion } from '../src/domain/project/fusion-de-duplicados.ts'
import type { Veredicto } from '../src/domain/project/veredictos-del-lote.ts'

/** Una fila del plan del paso B: el veredicto mas lo que la zombi era. */
export type FilaDelPasoB = Veredicto & {
  readonly file: string
  readonly line: number | null
  readonly title_viejo: string
  readonly severity: string
  readonly identidad_vieja: string
}

const corto = (t: string, n = 70): string => (t.length <= n ? t : `${t.slice(0, n - 1)}…`)
const sitio = (f: string, l: number | null): string =>
  `${f.split('/').slice(-2).join('/')}:${l ?? '-'}`

const destino = (v: FilaDelPasoB): string => {
  if (v.desenlace === 'extinguida') return `EXTINGUIDA con prueba: ${v.motivo} → tipo=${v.tipo}`
  if (v.desenlace === 'sin_prueba') return `MITIGADA sin prueba → sigue en el tablero; tipo=${v.tipo} identidad=${v.identidad_nueva}` // prettier-ignore
  if (v.desenlace === 'real') return `REAL, sigue viva → tipo=${v.tipo} simbolo=${v.simbolo || '(vacio)'} identidad=${v.identidad_nueva}` // prettier-ignore
  return `SIN DECIDIR (${v.motivo}) → no se toca`
}

const REGLA = 'Regla: una fila muere SOLO si estaProbado confirma su marcador en el fichero de hoy (EXTINCT, resolved_at, extinct_reason=juicio_obsoleto, extinguido_por=agente). Sin prueba: MITIGATED con nota. REAL: sigue ACTIVE. Todo lo que no muere recibe tipo e identidad de hoy. Dos vivas con la misma identidad de hoy son el mismo defecto (ADR-071): sobrevive la mas antigua, la otra queda fusionada-con-<ganadora> (Historial, sin resolved_at) y la superviviente toma la severidad maxima. status, first_seen y fingerprint no se tocan.' // prettier-ignore

const fusion = (f: Fusion): string =>
  `${f.absorbidas.length + 1}->1  ${f.identidad}  sobrevive ${f.ganadora.slice(0, 8)}, absorbe ${f.absorbidas.map((a) => a.slice(0, 8)).join(' ')}` // prettier-ignore

/** El plan del paso B tal y como se aprueba, fila a fila y fusion a fusion. Nada se escribe aqui. */
export function planDelPasoB(
  proyecto: string,
  filas: readonly FilaDelPasoB[],
  fusiones: readonly Fusion[]
): readonly string[] {
  const n = (d: Veredicto['desenlace']): number => filas.filter((f) => f.desenlace === d).length
  const lineas = [
    `PLAN DEL PASO B · proyecto=${proyecto} · zombis sin gemela=${filas.length} · REAL=${n('real')} · EXTINGUIDAS con prueba=${n('extinguida')} · MITIGADAS sin prueba=${n('sin_prueba')} · sin decidir=${n('sin_decidir')} · fusiones=${fusiones.length}`, // prettier-ignore
    REGLA,
    ''
  ]
  for (const f of filas) {
    lineas.push(
      `${f.id.slice(0, 8)}  ${sitio(f.file, f.line)}  ${f.severity}  "${corto(f.title_viejo)}"`
    )
    lineas.push(`          → ${destino(f)}`)
    if (f.desenlace === 'real' && f.razon !== '')
      lineas.push(`          razon: ${corto(f.razon, 110)}`)
    if (f.desenlace !== 'sin_decidir' && f.nota !== null) lineas.push(`          nota: ${f.nota}`)
  }
  lineas.push('', `FUSIONES (ADR-071): ${fusiones.length}${fusiones.length === 0 ? ' — ninguna identidad de hoy queda repetida' : ''}`) // prettier-ignore
  for (const f of fusiones) lineas.push(`  ${fusion(f)}`)
  return lineas
}
