import { useState } from 'react'
import { firmarPropuesta } from '../../services/firma-service'
import { Icon } from '../common/Icon'
import { sitio, type EnCola } from './cola-de-firma'

interface ColaDeFirmaProps {
  readonly cola: readonly EnCola[]
  readonly visibles: readonly EnCola[]
}

/**
 * Las propuestas que esperan firma, en fila y con un solo boton.
 *
 * Cuando el motor corre hasta el gate acumula, y buscar cada una en el
 * expediente general era el trabajo que hacia inviable el modo. El boton actua
 * SIEMPRE sobre la cabeza de la cola: firmar la saca, la siguiente ocupa su
 * sitio, y el mismo clic repetido vacia la cola de corrido.
 *
 * `visibles` es el trozo paginado; `cola` sigue siendo la cola ENTERA porque el
 * boton no firma lo que se ve, firma la cabeza. Por eso el titulo del boton
 * nombra a cual va: en la pagina dos, la cabeza no esta a la vista y un boton
 * mudo pareceria actuar sobre la primera fila de esa pagina.
 */
export function ColaDeFirma({ cola, visibles }: ColaDeFirmaProps): React.JSX.Element | null {
  const [firmando, setFirmando] = useState(false)
  if (cola.length === 0) return null

  const cabeza = cola[0]
  const firmar = async (): Promise<void> => {
    setFirmando(true)
    try {
      await firmarPropuesta(cabeza.proposal)
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
          title={`Firmara ${cabeza.proposal.id.slice(0, 6)} — ${sitio(cabeza)}`}
          onClick={() => void firmar()}
          className="border-primary/50 text-primary hover:bg-primary/10 flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] tracking-wide uppercase disabled:opacity-60"
        >
          <span className={firmando ? 'animate-spin' : ''}>
            <Icon name={firmando ? 'refresh-cw' : 'eye'} size={10} />
          </span>
          {firmando ? 'Firmando...' : 'Firmar la siguiente'}
        </button>
      </div>
      {visibles.map((item) => (
        <p
          key={item.proposal.id}
          className={`flex gap-2 text-[11px] ${item.proposal.id === cabeza.proposal.id ? 'text-foreground' : 'text-muted-foreground'}`}
        >
          <span className="font-mono">{item.proposal.id.slice(0, 6)}</span>
          <span className="min-w-0 flex-1 truncate">{sitio(item)}</span>
        </p>
      ))}
    </section>
  )
}
