import type { Capability } from '@domain/system/capability'

interface CapabilityCardProps {
  readonly capability: Capability
  readonly onOpen: (id: string) => void
}

/** Resumen clicable; el detalle y las acciones viven en el modal. */
export function CapabilityCard({ capability, onOpen }: CapabilityCardProps): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={() => onOpen(capability.id)}
      className="w-full rounded-lg border border-border bg-card p-3 text-left hover:border-primary/40"
    >
      <header className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-foreground">{capability.name}</span>
        <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[11px] text-primary">
          {capability.kind}
        </span>
        <span className="ml-auto text-[11px] text-muted-foreground">{capability.phase}</span>
      </header>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {capability.episodes} episodios · madurez {capability.maturity}
        {capability.omegaVeto.vetoed ? ' · OMEGA veta' : ''}
      </p>
    </button>
  )
}
