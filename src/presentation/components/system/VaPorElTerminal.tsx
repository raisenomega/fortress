import { VA_POR_EL_TERMINAL } from '@domain/repair/vehiculo-del-motor'

/**
 * El cartel de ADR-107: a un proyecto de CLIENTE se le dice cual es su camino.
 *
 * Existe porque negar sin explicar confunde. La guarda del nacimiento ya impide
 * que el Motor trabaje aqui, pero un boton que se pulsa y no hace nada manda a
 * buscar una falla que no existe —la misma razon por la que el drenaje distingue
 * «ocupado» de «averia»—. El texto sale del DOMINIO para que el cartel y el
 * motivo del rechazo no puedan decir cosas distintas.
 */
export function VaPorElTerminal({ nombre }: { readonly nombre: string }): React.JSX.Element {
  return (
    <div className="h-full space-y-3 px-4 py-4">
      <header>
        <h2 className="text-base text-foreground">Motor de reparacion</h2>
        <p className="text-xs text-muted-foreground">{VA_POR_EL_TERMINAL}</p>
      </header>
      <p className="rounded-md border border-border bg-card p-3 text-sm text-muted-foreground">
        {nombre} no es el repositorio de FORTRESS. El Motor existe para que FORTRESS se repare a si
        misma, con su firma y sus topes. Para reparar este proyecto, abre el{' '}
        <span className="text-foreground">Terminal</span>: resuelve cualquier severidad y su trabajo
        aterriza en el Historial.
      </p>
    </div>
  )
}
