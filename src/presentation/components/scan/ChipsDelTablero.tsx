// prettier-ignore
import type { FiltroDeEstado, FiltroDeSeveridad, FiltroDelTablero } from '@domain/project/filtro-del-tablero'
import type { RecuentoDelTablero } from '@domain/project/recuento-del-tablero'
import { FilaDeEstado } from './FilaDeEstado'
import { FilaDeSeveridad } from './FilaDeSeveridad'

interface ChipsDelTableroProps {
  readonly filtro: FiltroDelTablero
  readonly recuento: RecuentoDelTablero
  readonly onSeveridad: (valor: FiltroDeSeveridad) => void
  readonly onEstado: (valor: FiltroDeEstado) => void
}

/**
 * Los DOS ejes del tablero. Son ortogonales y se cruzan: el dominio ya dice que
 * `status` y `lifecycle` lo son —«un hallazgo puede estar descartado y ACTIVE»—
 * y filtrar por uno solo no lleva a ningun sitio util. «Mitigados» + «HIGH» son
 * las HIGH que se pueden verificar, y ese cruce es el motivo de que sean dos.
 *
 * Van en UN SOLO FLUJO, no apilados. Apilados eran dos `<div>` de bloque que se
 * comian una linea entera cada uno aunque sobrara ancho, y el conjunto se leia
 * como dos secciones sueltas en vez de como un control de dos dimensiones. Como
 * hijos de un `flex-wrap` caben en una linea cuando hay sitio y se pliegan
 * pegados cuando no.
 *
 * La raya de en medio es lo que impide que se lean como nueve chips seguidos:
 * comprimir sin ella habria costado la distincion entre los dos ejes, que es
 * justo lo que hace util el cruce.
 *
 * Las cuentas salen del ARRAY que la tabla pinta, no de `countsByProject`: si el
 * chip dijera 8 y al pulsarlo salieran 10 filas, el numero dejaria de ser la
 * promesa de lo que vas a ver, y un chip que no promete no sirve para navegar.
 */
export function ChipsDelTablero(props: ChipsDelTableroProps): React.JSX.Element {
  const { filtro, recuento, onSeveridad, onEstado } = props

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <FilaDeSeveridad
        activo={filtro.severidad}
        cuentas={recuento.porSeveridad}
        total={recuento.totalSeveridad}
        onElegir={onSeveridad}
      />
      <span aria-hidden className="bg-border h-4 w-px shrink-0" />
      <FilaDeEstado
        activo={filtro.estado}
        cuentas={recuento.porEstado}
        total={recuento.totalEstado}
        onElegir={onEstado}
      />
    </div>
  )
}
