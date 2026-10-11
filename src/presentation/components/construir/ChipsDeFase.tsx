import { chipsDelCto } from './chips-del-cto'
import { useCtoFaseStore } from '../../stores/cto-fase-store'

/**
 * La esquina DERECHA del encabezado del CTO (PASO 158): el progreso del turno
 * —contexto·bloque— gris(pendiente)→verde(hecho). Suscriptor PURO de las fases
 * que `construir-store` recibe por el carril 'chat-cto'; jamas del Terminal.
 */
export function ChipsDeFase(): React.JSX.Element {
  const fases = useCtoFaseStore((s) => s.fasesCto)
  return (
    <span className="flex shrink-0 gap-2 text-[11px]">
      {chipsDelCto(fases).map((c) => (
        <span key={c.fase} className={c.hecha ? 'text-success' : 'text-muted-foreground'}>
          {c.etiqueta}
        </span>
      ))}
    </span>
  )
}
