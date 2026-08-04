import type { Capability } from '@domain/system/capability'

interface CapabilityCardProps {
  readonly capability: Capability
  readonly onPromote: (id: string, humanApproved: boolean) => void
}

/** Etiqueta del boton: para un agente el clic ES la aprobacion humana. */
function promoteLabel(capability: Capability): string {
  const to = capability.promotion.to
  return capability.promotion.needsHuman ? `Aprobar y promover a ${to}` : `Promover a ${to}`
}

export function CapabilityCard({ capability, onPromote }: CapabilityCardProps): React.JSX.Element {
  const { promotion, omegaVeto } = capability
  return (
    <article className="rounded-lg border border-border bg-card p-3">
      <header className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-foreground">{capability.name}</span>
        <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[11px] text-primary">
          {capability.kind}
        </span>
        <span className="ml-auto text-[11px] text-muted-foreground">{capability.phase}</span>
      </header>

      <p className="mt-1 text-[11px] text-muted-foreground">
        {capability.episodes} episodios · madurez {capability.maturity}
      </p>

      {omegaVeto.vetoed ? (
        <p className="mt-2 text-[11px] text-critical">{omegaVeto.reason}</p>
      ) : promotion.eligible ? (
        <button
          type="button"
          onClick={() => onPromote(capability.id, promotion.needsHuman)}
          className="mt-2 text-[11px] text-muted-foreground hover:text-primary"
        >
          {promoteLabel(capability)}
        </button>
      ) : (
        <p className="mt-2 text-[11px] text-muted-foreground">Sin salto pendiente</p>
      )}
    </article>
  )
}
