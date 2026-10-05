import { useState } from 'react'
import { CAPABILITY_KINDS, type CapabilityKind } from '@domain/system/capability'
import { proposeCapability } from '../../services/self-improvement-service'

const FIELD = 'rounded border border-border bg-background px-2 py-1 text-xs text-foreground'

/** Alta manual de una capacidad (humano-iniciada). No genera ni ejecuta nada. */
export function ProposeCapability(): React.JSX.Element {
  const [name, setName] = useState('')
  const [kind, setKind] = useState<CapabilityKind>('agente')

  const submit = (): void => {
    if (name.trim().length === 0) return
    void proposeCapability({ kind, name: name.trim(), originObservation: 'manual' }).then(() =>
      setName('')
    )
  }

  return (
    <section className="rounded-lg border border-border bg-card p-3">
      <h3 className="text-sm text-foreground">Proponer capacidad</h3>
      <p className="text-[11px] text-muted-foreground">
        La registra en propuesta; asciende por episodios reales, con OMEGA como testigo.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-label="Nombre de la capacidad"
          placeholder="Nombre de la capacidad"
          className={`min-w-0 flex-1 ${FIELD}`}
        />
        <select
          value={kind}
          onChange={(event) => setKind(event.target.value as CapabilityKind)}
          aria-label="Tipo de capacidad"
          className={FIELD}
        >
          {CAPABILITY_KINDS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={submit}
          className="rounded bg-primary/10 px-2 py-1 text-xs text-primary hover:bg-primary/20"
        >
          Proponer
        </button>
      </div>
    </section>
  )
}
