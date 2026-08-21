import { Bot } from 'lucide-react'

interface FindingRepairActionProps {
  readonly onRepair: () => void
}

/**
 * Mandar el hallazgo al motor. Vive aparte de `FindingActions` porque no es de
 * la misma clase: descartar y mitigar REGISTRAN una decision del operador sobre
 * el hallazgo —son inmediatas y reversibles—, y esto ARRANCA trabajo, un agente
 * real que tarda minutos y cuesta dinero.
 *
 * Dirigirlo no lo mete en la cola: lo saca de ella. El motor atiende este y no
 * el que su orden habria elegido, quepa o no en el cerco de integracion
 * automatica; si no cabe, el fix acabara pidiendo firma humana, que es la unica
 * via por la que hoy se atiende lo que el cerco no admite.
 */
export function FindingRepairAction({ onRepair }: FindingRepairActionProps): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onRepair}
      title="Que lo repare el motor: lo analiza y propone un fix (agente real, minutos)"
      className="tap mr-2 text-muted-foreground hover:text-foreground"
    >
      <Bot size={13} aria-hidden />
    </button>
  )
}
