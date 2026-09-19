import type { VeredictoDelPlan } from '@domain/chat/juicio-del-plan'

interface PlanSinAprobarProps {
  readonly veredicto: VeredictoDelPlan | null
}

/**
 * Lo que ve el operador en AUTONOMO cuando OMEGA no aprobo la direccion del plan
 * (ADR-097 §3). Ocupa el sitio del boton, que en autonomo no se pinta.
 *
 * No es un boton ni ofrece reintentar: el bucle de replanteo es 4b, y un boton
 * aqui invitaria a saltarse a OMEGA — que la puerta del main rechazaria de todas
 * formas, dando un error en vez de una explicacion.
 *
 * DISTINGUE los dos motivos porque no son el mismo: que OMEGA pida replantear es
 * un juicio; que no se le pueda juzgar es una averia. Juntarlos bajo «no
 * aprobado» dejaria al operador sin saber si el plan estaba mal o si el revisor
 * no arranco.
 */
export function PlanSinAprobar({ veredicto }: PlanSinAprobarProps): React.JSX.Element {
  const razon =
    veredicto === 'REPLANTEA'
      ? 'OMEGA reviso la direccion y pidio replantearla.'
      : 'OMEGA no pudo juzgar el plan.'

  return (
    <div className="mt-1 flex flex-col items-start gap-1">
      <span className="text-high text-xs font-semibold">Plan sin aprobar</span>
      <span className="text-muted-foreground text-[11px]">{razon} El lote no se ejecuta.</span>
    </div>
  )
}
