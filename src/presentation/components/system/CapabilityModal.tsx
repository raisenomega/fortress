import { nextMilestone } from '@domain/system/capability-lifecycle'
import { promoteCapability } from '../../services/self-improvement-service'
import { useCapabilities } from '../../stores/self-improvement-store'
import { Modal } from '../common/Modal'
import { AgentDraftEditor } from './AgentDraftEditor'
import { CapabilityNotes } from './CapabilityNotes'
import { MaturityBar } from './MaturityBar'
import { RunEpisodeButton } from './RunEpisodeButton'

interface CapabilityModalProps {
  readonly capabilityId: string
  readonly onClose: () => void
}

const LEARN_NOTE =
  'Aprende resolviendo escenarios: cada episodio cuenta y sube su madurez. Hoy cada ' +
  'episodio es un disparo acotado (un clic); falta que lo haga en bucle por su cuenta, ' +
  'con topes de coste: esa es la ultima frontera.'

export function CapabilityModal({
  capabilityId,
  onClose
}: CapabilityModalProps): React.JSX.Element | null {
  const capability = useCapabilities().find((item) => item.id === capabilityId)
  if (!capability) return null
  const { promotion, omegaVeto, episodes } = capability
  const faltan = nextMilestone(episodes)
  return (
    <Modal title={capability.name} onClose={onClose}>
      <div className="space-y-4 text-xs text-muted-foreground">
        <p>
          <span className="font-mono text-primary">{capability.kind}</span> · fase{' '}
          <span className="text-foreground">{capability.phase}</span>
        </p>
        <div>
          <p className="mb-1">
            {episodes} episodios · madurez {capability.maturity}
            {faltan === null ? ' · oficial' : ` · faltan ${faltan} para el proximo salto`}
          </p>
          <MaturityBar episodes={episodes} />
        </div>
        <p>
          OMEGA:{' '}
          {omegaVeto.vetoed ? (
            <span className="text-critical">{omegaVeto.reason}</span>
          ) : (
            <span className="text-foreground">sin veto (banda {omegaVeto.band})</span>
          )}
        </p>
        {promotion.eligible && !omegaVeto.vetoed ? (
          <button
            type="button"
            onClick={() => void promoteCapability(capability.id, promotion.needsHuman)}
            className="rounded bg-primary/10 px-2 py-1 text-primary hover:bg-primary/20"
          >
            {promotion.needsHuman
              ? `Aprobar y promover a ${promotion.to}`
              : `Promover a ${promotion.to}`}
          </button>
        ) : null}
        <RunEpisodeButton capabilityId={capability.id} />
        {capability.kind === 'agente' ? <AgentDraftEditor capabilityId={capability.id} /> : null}
        <CapabilityNotes capabilityId={capability.id} />
        <p className="border-t border-border pt-3 text-[11px]">{LEARN_NOTE}</p>
      </div>
    </Modal>
  )
}
