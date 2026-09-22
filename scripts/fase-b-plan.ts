import type { Reclasificada } from '../src/domain/project/reclasificacion-de-zombis.ts'

/** Una fila del plan: la decision mas lo que la zombi era. */
export interface FilaDelPlan extends Reclasificada {
  readonly file: string
  readonly line: number | null
  readonly title_viejo: string
  readonly severity: string
  readonly first_seen: string
}

const corto = (t: string, n = 70): string => (t.length <= n ? t : `${t.slice(0, n - 1)}…`)
const sitio = (f: string, l: number | null): string =>
  `${f.split('/').slice(-2).join('/')}:${l ?? '-'}`

/**
 * El plan tal y como se aprueba, fila a fila: que era, a que tipo pasa, con
 * quien se funde y quien sobrevive. Nada se escribe aqui; es lo que se mira
 * ANTES de tocar la base, sobre el ensayo o sobre la viva.
 */
export function planImpreso(
  proyecto: string,
  filas: readonly FilaDelPlan[],
  sinGemela: number
): readonly string[] {
  // prettier-ignore
  const conGemela = filas.filter((f) => f.gemela !== null)
  const gemelas = new Set(conGemela.map((f) => f.gemela?.id))
  const enOtro = filas.filter((f) => f.tipo === 'otro').length
  const lineas = [
    `PLAN DEL PASO A · proyecto=${proyecto} · zombis en alcance=${filas.length} · con gemela=${conGemela.length} (absorben ${gemelas.size} filas de hoy) · sin gemela (paso B, NO se tocan)=${sinGemela}`, // prettier-ignore
    `Regla: se reclasifica la zombi (tipo + simbolo + identidad de hoy); si tiene gemela adopta SU identidad y la fusion las empata; sobrevive la MAS ANTIGUA (la zombi, con su first_seen) y la gemela queda EXTINCT «fusionada-con-<zombi>». status, first_seen y fingerprint no se tocan.`, // prettier-ignore
    ''
  ]
  for (const f of filas) {
    lineas.push(`${f.id.slice(0, 8)}  ${sitio(f.file, f.line)}  ${f.severity}  "${corto(f.title_viejo)}"  first_seen=${f.first_seen.slice(0, 10)}`) // prettier-ignore
    const destino =
      f.gemela === null
        ? `sin gemela: identidad propia ${f.identidad_nueva}; NO se funde`
        : `FUNDE con ${f.gemela.id.slice(0, 8)} (${sitio(f.gemela.file, f.gemela.line)}, ${f.gemela.tipo}) → sobrevive la zombi, la gemela se absorbe`
    lineas.push(`          → tipo=${f.tipo}  simbolo=${f.simbolo || '(vacio)'}  ${destino}`)
    if (f.nota !== null) lineas.push(`          nota: ${f.nota}`)
  }
  lineas.push('', `RESUMEN: ${filas.length} reclasificadas · ${conGemela.length} fusiones · ${enOtro} se quedan en otro (exentas del criterio 2) · ${sinGemela} fuera de alcance`) // prettier-ignore
  return lineas
}
