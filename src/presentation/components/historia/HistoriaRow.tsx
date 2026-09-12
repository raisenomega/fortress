import { clasificarExtincion } from '@domain/project/clase-de-extincion'
import type { FindingHistoria } from '@domain/project/finding-historia'
import { formatMoment } from '../../format/time'
import { fechaDeCierre } from './fecha-de-cierre'
import { SeverityBadge } from '../scan/SeverityBadge'
import { CLASE_EN_PANTALLA } from './clase-de-cierre'

interface HistoriaRowProps {
  readonly fila: FindingHistoria
}

const ubicacion = (f: FindingHistoria): string => {
  if (!f.file) return 'sin ubicacion'
  return f.line === null ? f.file : `${f.file}:${f.line}`
}

/**
 * Una fila de la historia: de que murio, cuando nacio y cuando se cerro.
 *
 * La fecha de cierre puede NO EXISTIR, y entonces se dice. Las veinte fusiones
 * tienen `resolved_at` en null a proposito —«se fusiono, y un `resolved_at`
 * afirmaria lo que no paso»— asi que aqui se escribe «no se resolvio» y nunca
 * se rellena con la fecha de otra cosa.
 *
 * La clase se DERIVA del motivo aqui, no viaja calculada: el motivo crudo es la
 * verdad y guardar su clase seria una segunda copia que podria divergir.
 */
export function HistoriaRow({ fila }: HistoriaRowProps): React.JSX.Element {
  const { texto, clase } = CLASE_EN_PANTALLA[clasificarExtincion(fila.extinctReason)]

  return (
    <tr className="border-b border-border/60 last:border-0">
      <td className="py-2 pr-3 align-top">
        <SeverityBadge severity={fila.severity} />
      </td>
      <td className="py-2 pr-3 align-top text-sm text-foreground">
        {fila.title}
        <div className="mt-0.5">
          <span className={`rounded border px-1.5 py-0.5 text-[10px] ${clase}`}>{texto}</span>
        </div>
      </td>
      <td className="py-2 pr-3 align-top font-mono text-[11px] whitespace-nowrap text-muted-foreground">
        {ubicacion(fila)}
      </td>
      <td className="py-2 pr-3 align-top text-[11px] whitespace-nowrap text-muted-foreground">
        {formatMoment(fila.firstSeen)}
      </td>
      <td className="py-2 align-top text-[11px] whitespace-nowrap text-muted-foreground">
        {fechaDeCierre(fila.resolvedAt)}
      </td>
    </tr>
  )
}
