import type { Fusion } from '../src/domain/project/fusion-de-duplicados.ts'
import type { VeredictoDePar } from '../src/domain/project/veredictos-de-pares.ts'

const corto = (t: string, n = 64): string => (t.length <= n ? t : `${t.slice(0, n - 1)}…`)
const sitio = (f: VeredictoDePar['a']): string =>
  `${f.file.split('/').slice(-2).join('/')}:${f.line ?? '-'} ${f.tipo}`

const REGLA = 'Regla (ADR-101 §5): solo un par juzgado MISMO se funde, por ADR-071: sobrevive la mas antigua con su clave y severidad maxima; la absorbida queda fusionada-con-<ganadora> (Historial, sin resolved_at) y su clave pasa a ser alias de la ganadora, con lo que apuntaba a ella. DISTINTOS y sin decidir: no se toca nada. status, first_seen, fingerprint, titulo, tipo y simbolo no se tocan.' // prettier-ignore

const fusion = (f: Fusion): string =>
  `${f.absorbidas.length + 1}->1  ${f.identidad}  sobrevive ${f.ganadora.slice(0, 8)}, absorbe ${f.absorbidas.map((a) => a.slice(0, 8)).join(' ')} (sus claves pasan a alias)` // prettier-ignore

/** El plan del lote tal y como se aprueba, par a par y fusion a fusion. Nada se escribe aqui. */
export function planDelLote(
  proyecto: string,
  veredictos: readonly VeredictoDePar[],
  fusiones: readonly Fusion[]
): readonly string[] {
  const n = (d: VeredictoDePar['desenlace']): number => veredictos.filter((v) => v.desenlace === d).length // prettier-ignore
  const lineas = [
    `PLAN DEL LOTE DE ALIAS · proyecto=${proyecto} · pares=${veredictos.length} · MISMO=${n('mismo')} · DISTINTOS=${n('distintos')} · sin decidir=${n('sin_decidir')} · fusiones=${fusiones.length}`, // prettier-ignore
    REGLA,
    ''
  ]
  for (const v of veredictos) {
    lineas.push(`${v.par.slice(0, 8)}+${v.par.split('+')[1]?.slice(0, 8) ?? ''}  ${v.desenlace.toUpperCase().padEnd(11)} A=${sitio(v.a)} "${corto(v.a.title)}"`) // prettier-ignore
    lineas.push(`${''.padEnd(30)}B=${sitio(v.b)} "${corto(v.b.title)}"`)
    if (v.razon !== '') lineas.push(`${''.padEnd(30)}razon: ${corto(v.razon, 120)}`)
  }
  lineas.push(
    '',
    `FUSIONES (ADR-071 + alias): ${fusiones.length}${fusiones.length === 0 ? ' — ninguna' : ''}`
  )
  for (const f of fusiones) lineas.push(`  ${fusion(f)}`)
  return lineas
}
