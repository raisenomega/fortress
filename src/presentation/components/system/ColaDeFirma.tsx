import { useState } from 'react'
import { firmarPropuesta } from '../../services/firma-service'
import { Icon } from '../common/Icon'
import type { EnCola } from './cola-de-firma'

interface ColaDeFirmaProps {
  readonly cola: readonly EnCola[]
}

/** Donde vive el fix, en una linea: lo que el operador necesita para decidir. */
function sitio(item: EnCola): string {
  const f = item.finding
  if (!f) return `hallazgo ${item.proposal.findingId.slice(0, 6)}`
  return `${f.severity} ${f.file}${f.line === null ? '' : `:${f.line}`}`
}

/**
 * Las propuestas que esperan firma, en fila y con un solo boton.
 *
 * Cuando el motor corre hasta el gate acumula, y buscar cada una en el
 * expediente general era el trabajo que hacia inviable el modo. El boton actua
 * SIEMPRE sobre la cabeza de la cola: firmar la saca, la siguiente ocupa su
 * sitio, y el mismo clic repetido vacia la cola de corrido.
 */
export function ColaDeFirma({ cola }: ColaDeFirmaProps): React.JSX.Element | null {
  const [firmando, setFirmando] = useState(false)
  if (cola.length === 0) return null

  const cabeza = cola[0]
  const firmar = async (): Promise<void> => {
    setFirmando(true)
    try {
      await firmarPropuesta(cabeza.proposal.projectId, cabeza.proposal.id)
    } finally {
      setFirmando(false)
    }
  }

  return (
    <section className="border-primary/40 space-y-1 rounded border p-2">
      <div className="flex items-center gap-2">
        <span className="text-primary flex-1 text-xs">
          {cola.length} {cola.length === 1 ? 'propuesta espera' : 'propuestas esperan'} firma
        </span>
        <button
          type="button"
          disabled={firmando}
          onClick={() => void firmar()}
          className="border-primary/50 text-primary hover:bg-primary/10 flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] tracking-wide uppercase disabled:opacity-60"
        >
          <span className={firmando ? 'animate-spin' : ''}>
            <Icon name={firmando ? 'refresh-cw' : 'eye'} size={10} />
          </span>
          {firmando ? 'Juzgando...' : 'Firmar la siguiente'}
        </button>
      </div>
      {cola.map((item, i) => (
        <p
          key={item.proposal.id}
          className={`flex gap-2 text-[11px] ${i === 0 ? 'text-foreground' : 'text-muted-foreground'}`}
        >
          <span className="font-mono">{item.proposal.id.slice(0, 6)}</span>
          <span className="min-w-0 flex-1 truncate">{sitio(item)}</span>
        </p>
      ))}
    </section>
  )
}
