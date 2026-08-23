import { confirmadoPorUltimoEscaneo } from '@domain/scan/ausencia'
import type { Finding } from '@domain/project/finding'
import { useActiveProject } from '../../stores/project-store'

interface FindingMarksProps {
  readonly finding: Finding
  readonly dismissed: boolean
  readonly mitigado: boolean
}

/**
 * Lo que el operador decidio sobre un hallazgo, dicho en la propia fila.
 *
 * Descartado va tachado: dejo de contar. Mitigado NO — el problema puede seguir
 * ahi y el escaneo aun no lo ha confirmado; lo que cambio es que ya no pide
 * trabajo. La nota se muestra entera porque es la unica pista de donde esta el
 * arreglo cuando vive en otro archivo.
 *
 * "sin reconfirmar" no es un estado: el hallazgo esta igual de vivo y el motor
 * lo sigue eligiendo. Dice que el ultimo escaneo no volvio a nombrarlo, que
 * antes era invisible y era justo lo que se confundia con estar resuelto.
 */
export function FindingMarks({
  finding,
  dismissed,
  mitigado
}: FindingMarksProps): React.JSX.Element {
  // El tablero es de UN proyecto: la fecha se lee aqui en vez de enhebrarla por
  // dos niveles de props que no la usan para nada mas.
  const reconfirmado = confirmadoPorUltimoEscaneo(finding.lastSeen, useActiveProject()?.lastScan ?? null) // prettier-ignore

  return (
    <>
      {reconfirmado || dismissed ? null : (
        <span
          title="El ultimo escaneo no volvio a nombrarlo. Sigue vivo: nadie lo ha mirado."
          className="text-muted-foreground border-border ml-2 rounded border px-1 text-[10px]"
        >
          sin reconfirmar
        </span>
      )}
      <span className={dismissed ? 'line-through' : ''}>{finding.title}</span>
      {dismissed ? (
        <span className="ml-2 text-[10px] tracking-wide text-muted-foreground uppercase">
          falso positivo
        </span>
      ) : null}
      {mitigado ? (
        <span className="ml-2 text-[10px] tracking-wide text-primary uppercase">
          mitigado — pendiente de confirmar
        </span>
      ) : null}
      {mitigado && finding.mitigatedNote ? (
        <div className="mt-0.5 text-[11px] text-muted-foreground">{finding.mitigatedNote}</div>
      ) : null}
    </>
  )
}
