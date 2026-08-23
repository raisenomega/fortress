import type { ResumenCerco } from '@application/repair/resumen-cerco'

interface CercoNoticeProps {
  readonly cerco: ResumenCerco
}

/**
 * Cuanto de su tablero puede tocar el motor, dicho en voz alta.
 *
 * Son DOS numeros porque son dos preguntas, y mezclarlas hizo entender mal el
 * sistema durante un tiempo: cuantos hallazgos puede TRABAJAR dejandolos a
 * firma, y cuantos ademas podrian integrarse SOLOS dentro del cerco. Con un
 * solo numero el panel decia "25 fuera del cerco" cuando el motor podia con 20.
 *
 * Lo que ni siquiera trabaja son las defensas del propio motor, y esas no las
 * toca nadie: ni el, ni una firma. Decirlo evita la pregunta obvia de por que
 * las cuentas no cuadran.
 */
export function CercoNotice({ cerco }: CercoNoticeProps): React.JSX.Element | null {
  if (cerco.total === 0) return null
  const defensas = cerco.total - cerco.trabajables

  return (
    <p className="text-muted-foreground text-xs">
      De {cerco.total} hallazgos vivos, el motor puede trabajar {cerco.trabajables} y dejarlos
      esperando tu firma; {cerco.autoIntegrables} podrian ademas integrarse solos dentro del cerco.
      {defensas > 0 ? ` Los ${defensas} restantes son defensas del propio motor: no las toca.` : ''}
    </p>
  )
}
