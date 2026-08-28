import type { Proposal } from '@domain/repair/proposal'
import { RepairFirmaButton } from './RepairFirmaButton'
import { RepairGateButton } from './RepairGateButton'
import { RepairGenerateButton } from './RepairGenerateButton'
import { RepairRetirarButton } from './RepairRetirarButton'
import { RepairRetryButton } from './RepairRetryButton'

interface RepairProposalAccionesProps {
  readonly proposal: Proposal
  /** Refetch INCONDICIONAL al terminar: sin stale closure (leccion I3.1). */
  readonly onDone: () => void
  /** Igual, pero solo si la fila esta desplegada: generar y gatear tardan. */
  readonly onDoneSiAbierto: () => void
}

/**
 * Los actos disponibles sobre una propuesta, en su fila.
 *
 * Cada boton decide solo si le toca pintarse segun el estado, asi que la fila
 * lleva como mucho dos: el que la hace avanzar y el que la retira.
 *
 * Viven aparte desde que fueron cinco. `RepairProposalRow` estaba exactamente
 * en el limite de 75 lineas y no cabia ni el import del quinto boton: el sitio
 * de esta lista no es el mismo que el de la fila que la aloja.
 */
export function RepairProposalAcciones(props: RepairProposalAccionesProps): React.JSX.Element {
  const { proposal, onDone, onDoneSiAbierto } = props

  return (
    <>
      <RepairGenerateButton proposal={proposal} onDone={onDoneSiAbierto} />
      <RepairGateButton proposal={proposal} onDone={onDoneSiAbierto} />
      <RepairFirmaButton proposal={proposal} onDone={onDone} />
      <RepairRetryButton proposal={proposal} onDone={onDone} />
      <RepairRetirarButton proposal={proposal} onDone={onDone} />
    </>
  )
}
