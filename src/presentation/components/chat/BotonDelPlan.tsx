import { resolverLotePendiente } from '../../services/resolver-lote-en-terminal'
import { useColaDelLoteStore } from '../../stores/cola-del-lote-store'

interface BotonDelPlanProps {
  readonly projectId: string
}

const BOTON =
  'tap bg-success text-background rounded-md px-3 py-1.5 text-xs font-semibold hover:brightness-110'

/**
 * El punto de FIRMA del lote, al pie del plan recien leido (ADR-088, arco 1).
 *
 * Vive DENTRO del hilo y no como franja fija sobre el input: scrollea con los
 * mensajes, asi que si el operador sube a releer el plan el boton sigue a su
 * pie. Se firma al pie del documento, no en una barra que lo tapa.
 *
 * Esta aqui y no en el Escaneo porque leer el plan y aprobarlo son el mismo
 * gesto: tenerlo en la otra pantalla obligaba a volver solo para firmar.
 *
 * VERDE y no dorado: el dorado es el color de marca, y lo que se dice aqui es
 * «adelante». Es la unica accion del flujo en este punto, asi que destaca a
 * proposito — esconderla devolveria el problema de no encontrar donde aprobar.
 */
export function BotonDelPlan({ projectId }: BotonDelPlanProps): React.JSX.Element | null {
  const pendiente = useColaDelLoteStore((s) =>
    s.pendiente?.projectId === projectId && s.pendiente.planeado ? s.pendiente : null
  )
  if (pendiente === null) return null
  const cuantos = pendiente.ids.length

  return (
    <div className="mt-1 flex flex-col items-start gap-1">
      <button type="button" onClick={() => void resolverLotePendiente(projectId)} className={BOTON}>
        Ejecutar plan ({cuantos})
      </button>
      <span className="text-muted-foreground text-[11px]">
        Resuelve los {cuantos}. Detener lo corta.
      </span>
    </div>
  )
}
