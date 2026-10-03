import type { ResultadoDeTanda } from '@application/repair/medir-la-tanda'

const corto = (id: string): string => id.slice(0, 8)

/** El veredicto de la sonda del conjunto, en una linea y con nombres: un rojo
 *  sin culpables seria el mismo silencio que esta guia existe para romper. */
export function ResultadoDeLaTanda({
  tanda
}: {
  readonly tanda: ResultadoDeTanda
}): React.JSX.Element | null {
  // prettier-ignore
  if (tanda.veredicto === 'verde') {
    return <p className="text-primary">{`${tanda.detalle} (${tanda.medidas} medida)`}</p>
  }
  if (tanda.veredicto === 'rojo') {
    return (
      <p className="text-critical">
        Chocan entre si: {tanda.culpables.map(corto).join(' y ')}. Firma una y regenera la otra
        despues. ({tanda.medidas} medidas)
      </p>
    )
  }
  return <p className="text-muted-foreground">{tanda.detalle}</p>
}
