import type { ResumenCerco } from '@application/repair/resumen-cerco'

interface CercoNoticeProps {
  readonly cerco: ResumenCerco
}

/**
 * Lo que la cola NO va a elegir, dicho en voz alta.
 *
 * El freno de la seleccion es mudo por naturaleza: descarta un hallazgo no
 * eligiendolo, y eso no deja rastro en ninguna parte. Sin esta linea el
 * operador ve un motor que ignora casi todo su tablero y no puede distinguir
 * "no quiere" de "esta roto". Dice tambien la salida, porque saber que estan
 * fuera no sirve de nada si no se sabe como alcanzarlos.
 */
export function CercoNotice({ cerco }: CercoNoticeProps): React.JSX.Element | null {
  if (cerco.fuera === 0) return null

  return (
    <p className="text-xs text-muted-foreground">
      {cerco.fuera} de {cerco.total} hallazgos quedan fuera del cerco de integracion automatica —por
      severidad o por ruta— y la cola no los elige sola: su fix nunca se auto-integraria. Manda al
      motor los que quieras desde su propia fila, y llegaran pidiendo firma humana.
    </p>
  )
}
