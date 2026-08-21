import type { Finding } from '@domain/project/finding'

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
 */
export function FindingMarks({
  finding,
  dismissed,
  mitigado
}: FindingMarksProps): React.JSX.Element {
  return (
    <>
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
