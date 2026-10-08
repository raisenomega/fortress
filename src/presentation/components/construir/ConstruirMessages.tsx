import { antesDeNotas } from '@domain/system/corte-de-notas'
import { useConstruirStore } from '../../stores/construir-store'
import { LineaDelBorrador } from './LineaDelBorrador'
import { MensajeDelConstruir } from './MensajeDelConstruir'

/** Historial de construir pintado como lineas de terminal (PASO 84): prompt
 *  dorado para el operador, respuesta en markdown (PASO 94), y el borrador en
 *  vivo con la palabra de la herramienta coloreada. */
export function ConstruirMessages(): React.JSX.Element {
  const messages = useConstruirStore((s) => s.messages)
  const busy = useConstruirStore((s) => s.busy)
  const draft = useConstruirStore((s) => s.draft)

  return (
    <div className="flex-1 space-y-3 overflow-y-auto px-1 py-3 font-mono text-[13px] leading-relaxed">
      {messages.length === 0 && !busy ? (
        <p className="pt-10 text-center text-xs text-muted-foreground">
          Describe lo que quieres. Elige el modo con la flecha.
        </p>
      ) : null}
      {messages.map((msg, i) => (
        <MensajeDelConstruir key={i} msg={msg} />
      ))}
      {/* El borrador en vivo: el bloque NOTAS se corta en cuanto asoma. */}
      {draft !== null ? (
        <div className="flex gap-2">
          <span className="w-3 shrink-0" />
          <div className="min-w-0 flex-1 break-words whitespace-pre-wrap text-muted-foreground">
            {antesDeNotas(draft)
              .split('\n')
              .map((linea, i) => (
                <LineaDelBorrador key={i} linea={linea} />
              ))}
            <span className="ml-0.5 inline-block h-3.5 w-2 animate-pulse bg-primary align-text-bottom" />
          </div>
        </div>
      ) : null}
      {busy && draft === null ? (
        <p className="text-xs text-muted-foreground">Trabajando...</p>
      ) : null}
    </div>
  )
}
