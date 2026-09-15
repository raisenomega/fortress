import { SquareTerminal } from 'lucide-react'

interface FindingResolverActionProps {
  readonly onResolver: () => void
}

/**
 * Mandar el hallazgo al TERMINAL, el camino del cliente (ADR-088, pieza 2).
 *
 * Hermano del boton del motor (`FindingRepairAction`), no su sustituto: aquel
 * pone a trabajar al motor de FORTRESS; este abre el Terminal con el hallazgo
 * fijado y un borrador ya escrito, y es el operador quien lo envia. No gasta
 * nada al pulsarlo.
 */
export function FindingResolverAction({
  onResolver
}: FindingResolverActionProps): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onResolver}
      title="Resolver en Terminal: abre el Terminal con este hallazgo fijado"
      aria-label="Resolver en Terminal"
      className="tap mr-2 text-muted-foreground hover:text-foreground"
    >
      <SquareTerminal size={13} aria-hidden />
    </button>
  )
}
