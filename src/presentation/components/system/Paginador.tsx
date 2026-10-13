import { Icon } from '../common/Icon'
import type { Pagina } from './paginacion'

interface PaginadorProps {
  readonly pagina: Pagina
  readonly onPagina: (numero: number) => void
}

const BOTON =
  'tap border-border text-muted-foreground hover:text-foreground rounded border px-2 py-0.5 disabled:opacity-40'

/**
 * Subir y bajar entre paginas de una lista larga: la cola de firma y el
 * expediente del motor usan el mismo. Con una sola pagina no se pinta: unos
 * controles que no llevan a ningun sitio son ruido que hay que leer para
 * descubrir que no hacia falta leerlo.
 *
 * Izquierda/derecha, como se pagina en todas partes. Nacio vertical solo porque
 * `chevron-left` no estaba en la lista de iconos del dominio; ya esta.
 */
export function Paginador({ pagina, onPagina }: PaginadorProps): React.JSX.Element | null {
  if (pagina.paginas <= 1) return null

  return (
    <div className="text-muted-foreground flex items-center gap-2 text-[11px]">
      <button
        type="button"
        disabled={pagina.pagina === 1}
        onClick={() => onPagina(pagina.pagina - 1)}
        className={BOTON}
        aria-label="Pagina anterior"
      >
        <Icon name="chevron-left" size={11} />
      </button>
      <span>
        {pagina.desde + 1}-{pagina.hasta} · pagina {pagina.pagina} de {pagina.paginas}
      </span>
      <button
        type="button"
        disabled={pagina.pagina === pagina.paginas}
        onClick={() => onPagina(pagina.pagina + 1)}
        className={BOTON}
        aria-label="Pagina siguiente"
      >
        <Icon name="chevron-right" size={11} />
      </button>
    </div>
  )
}
