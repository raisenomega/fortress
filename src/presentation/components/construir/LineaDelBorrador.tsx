import { actividadDe, colorDe } from '../../format/color-de-herramienta'

interface LineaDelBorradorProps {
  readonly linea: string
}

/** Una linea del borrador en vivo. Si es actividad (`· Herramienta: detalle`),
 *  SOLO la palabra va coloreada (PASO 84); el resto —args, rutas— queda en el
 *  tono normal. Una linea de texto corriente pasa entera sin tocar. */
export function LineaDelBorrador({ linea }: LineaDelBorradorProps): React.JSX.Element {
  const actividad = actividadDe(linea)
  if (actividad === null) return <span>{linea + '\n'}</span>
  return (
    <span>
      {'· '}
      <span className={colorDe(actividad.herramienta)}>{actividad.herramienta}</span>
      {actividad.resto + '\n'}
    </span>
  )
}
