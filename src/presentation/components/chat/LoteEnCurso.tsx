import { etiquetaDeFase } from '@domain/chat/fase-del-turno'
import { etiquetaDelLote } from '@domain/chat/pie-del-lote'
import { useRunMeterStore } from '../../stores/run-meter-store'
import { TONO } from './tono-de-fase'

interface LoteEnCursoProps {
  readonly hechos: number
  readonly total: number
}

/**
 * El pie del lote mientras corre EN AUTONOMO: texto plano, sin barra y sin
 * pildora (ADR-097, BUG 3).
 *
 * La pildora verde que habia aqui era el BOTON de supervisado vuelto inerte —se
 * pulsaba, se apagaba—. En autonomo nunca hubo boton que apagar, asi que era un
 * verde de «adelante» sobre algo que nadie pulso, y se quedaba fijo el lote
 * entero sin decir jamas que estaba pasando.
 *
 * DOS PIEZAS CON VIDAS DISTINTAS, y por eso no se puede enseñar solo una:
 *
 * - **El lote es el ANCLA**: dura de `arrancar()` a `terminar()`, el lote entero.
 * - **La fase es el SUFIJO**: dura UN turno. El medidor se apaga en el `finally`
 *   de cada envio, asi que entre hallazgo y hallazgo no hay fase que contar.
 *   Enseñar solo la fase dejaria el pie EN BLANCO en cada hueco.
 *
 * El ancla va en tono neutro y solo el sufijo lleva color: el numero del lote no
 * cambia porque OMEGA este pensando, y pintarlo del color de la fase diria que
 * si.
 *
 * El store de la fase es GLOBAL —no lleva `projectId`—, pero este pie solo se
 * monta cuando el lote de ESTE proyecto esta en curso (`BotonDelPlan` filtra con
 * `mio()`), y un proyecto no puede tener dos turnos a la vez: el carril es uno.
 */
export function LoteEnCurso({ hechos, total }: LoteEnCursoProps): React.JSX.Element {
  const fase = useRunMeterStore((state) => state.fase)
  const agentes = useRunMeterStore((state) => state.total)

  return (
    <span className="text-muted-foreground text-xs">
      {etiquetaDelLote(hechos, total)}
      {fase !== undefined && <span className={TONO[fase]}> · {etiquetaDeFase(fase, agentes)}</span>}
    </span>
  )
}
