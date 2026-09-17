import { resolverLotePendiente } from '../../services/resolver-lote-en-terminal'
import { useColaDelLoteStore } from '../../stores/cola-del-lote-store'

interface BotonDelPlanProps {
  readonly projectId: string
}

const VERDE = 'bg-success text-background rounded-md px-3 py-1.5 text-xs font-semibold'
const BOTON = `tap ${VERDE} hover:brightness-110`
/** El mismo verde, sin `tap` ni hover: se ve que es el boton, ya pulsado. */
const PLANO = `${VERDE} inline-block opacity-70`

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
 *
 * Y en cuanto la cola arranca DEJA DE SER PULSABLE: se queda como linea plana.
 * Un boton vivo mientras corre invita a pulsarlo otra vez, y cada pulsacion
 * encolaria la misma orden. El progreso lo lleva el indicador de abajo.
 */
export function BotonDelPlan({ projectId }: BotonDelPlanProps): React.JSX.Element | null {
  const mio = <T extends { projectId: string }>(x: T | null): T | null =>
    x !== null && x.projectId === projectId ? x : null
  const enCurso = useColaDelLoteStore((s) => mio(s.enCurso))
  const pendiente = useColaDelLoteStore((s) => mio(s.pendiente))

  if (enCurso !== null) return <span className={PLANO}>Plan ejecutandose…</span>
  if (pendiente === null || !pendiente.planeado) return null
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
