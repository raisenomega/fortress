import {
  colorDelEfecto,
  etiquetaDelEfecto,
  type EfectoDelModo
} from '@domain/settings/causa-de-degradacion'

/**
 * La esquina IZQUIERDA del encabezado del Chat (PASO 152): el EFECTO del toggle
 * app-wide sobre el proyecto activo, texto y color. La verdad la calcula el main
 * y entra ya decidida en `efecto`; esto SOLO la pinta —nunca deriva el modo—.
 */
export function EtiquetaDelEfecto({ efecto }: { efecto: EfectoDelModo }): React.JSX.Element {
  return (
    <span className={`shrink-0 text-[11px] ${colorDelEfecto(efecto)}`}>
      {etiquetaDelEfecto(efecto)}
    </span>
  )
}
