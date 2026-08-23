import type { ResumenCerco } from '@application/repair/resumen-cerco'
import { Icon } from '../common/Icon'

interface DrenajeEnVivoProps {
  readonly cerco: ResumenCerco
  readonly esperandoFirma: number
}

/**
 * El avance del drenaje mientras corre, con los dos numeros que de verdad son
 * en vivo: los que ya esperan firma —la cola crece segun el revisor aprueba— y
 * los que le quedan por delante.
 *
 * Las bajas NO se cuentan aqui, y no es un descuido: una propuesta rechazada
 * desaparece de la cola sin dejar rastro que el panel pueda leer, asi que
 * deducirlas desde el renderer seria inventarlas. Van en el parte del final,
 * que sale del recuento del propio orquestador.
 *
 * `elegibles` es el mismo numero que usa la seleccion, no una cuenta paralela.
 */
export function DrenajeEnVivo({ cerco, esperandoFirma }: DrenajeEnVivoProps): React.JSX.Element {
  return (
    <p className="text-primary flex items-center gap-1.5 text-xs">
      <span className="animate-spin">
        <Icon name="refresh-cw" size={11} />
      </span>
      Drenando: {esperandoFirma} esperando firma · {cerco.elegibles} por delante
    </p>
  )
}
