import type { ParadaEnCurso } from '@domain/scan/scan-chunk'
import { Icon } from '../common/Icon'
import { lineaDeParada } from './parada-linea'

interface ParadaEnVivoProps {
  readonly parada: ParadaEnCurso
}

/**
 * Por donde va el recorrido, fijo y sin scroll. Va FUERA del cuadro de progreso
 * a proposito: ver `parada-linea`.
 */
export function ParadaEnVivo({ parada }: ParadaEnVivoProps): React.JSX.Element {
  return (
    <p
      aria-label="Parada en curso"
      className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground"
    >
      <Icon name="zap" size={12} className="shrink-0 text-primary" />
      {lineaDeParada(parada)}
    </p>
  )
}
