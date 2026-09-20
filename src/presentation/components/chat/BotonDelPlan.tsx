import { pieDelLote } from '@domain/chat/pie-del-lote'
import { resolverLotePendiente } from '../../services/resolver-lote-en-terminal'
import { useColaDelLoteStore } from '../../stores/cola-del-lote-store'
import { useSettingsStore } from '../../stores/settings-store'
import { LoteEnCurso } from './LoteEnCurso'
import { PlanSinAprobar } from './PlanSinAprobar'

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
 *
 * EN AUTONOMO NO SE PINTA (ADR-097 §3): alli el aprobador es OMEGA, y su
 * ADELANTE ya disparo la ejecucion sin pasar por aqui. El boton no solo sobraba:
 * desde que la puerta del §4 existe era un boton MUERTO — pulsarlo mandaba un
 * turno que `guardPlanAprobado` rechazaba, y el operador veia un error por cada
 * hallazgo del lote. Si el lote llego a `planeado` en autonomo es que OMEGA NO
 * aprobo, y lo que toca es decirlo, no ofrecer un clic que va a fallar.
 *
 * Esto es PRESENTACION, no seguridad: la garantia vive en el main y no se
 * duplica aqui. Ocultar el boton no impide nada — impedirlo ya lo hace la
 * puerta; ocultarlo evita ofrecer lo que no se puede hacer.
 */
export function BotonDelPlan({ projectId }: BotonDelPlanProps): React.JSX.Element | null {
  const mio = <T extends { projectId: string }>(x: T | null): T | null =>
    x !== null && x.projectId === projectId ? x : null
  const enCurso = useColaDelLoteStore((s) => mio(s.enCurso))
  const pendiente = useColaDelLoteStore((s) => mio(s.pendiente))
  const autonomo = useSettingsStore((s) => s.mode === 'autonomo')
  const pie = pieDelLote({ enCurso: enCurso !== null, planeado: pendiente?.planeado === true, autonomo }) // prettier-ignore

  // En autonomo, texto plano con el lote y su fase; la pildora verde es de
  // supervisado, donde SI hubo un boton que se pulso y se apago (BUG 3).
  if (pie === 'lote-en-curso' && enCurso !== null)
    return <LoteEnCurso hechos={enCurso.hechos} total={enCurso.total} />
  if (pie === 'ejecutando') return <span className={PLANO}>Plan ejecutandose…</span>
  if (pie === 'nada' || pendiente === null) return null
  if (pie === 'sin-aprobar') return <PlanSinAprobar veredicto={pendiente.veredicto} />
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
