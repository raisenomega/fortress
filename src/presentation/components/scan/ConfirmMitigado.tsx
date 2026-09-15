import { useState } from 'react'
import type { Finding } from '@domain/project/finding'
import { Modal } from '../common/Modal'

interface ConfirmMitigadoProps {
  readonly finding: Finding
  readonly onCancel: () => void
  readonly onConfirm: (nota: string) => void
}

const CAMPO =
  'border-border bg-background/40 text-foreground placeholder:text-muted-foreground w-full rounded-md border px-2 py-1.5 text-xs'

/**
 * La nota de "esto ya esta arreglado", pedida en un modal.
 *
 * Antes la pedia `window.prompt`, que Electron NO implementa: lanzaba "prompt()
 * is not supported." y la excepcion moria muda —sin try/catch y sin error
 * boundary—, asi que la llave inglesa nunca hizo nada. El mecanismo de debajo
 * estaba sano y probado; lo unico roto era su disparador.
 *
 * La nota sigue siendo OBLIGATORIA, y por el mismo motivo que cuando la exigia
 * el prompt: es la unica pista de donde vive el fix si no esta aqui.
 */
export function ConfirmMitigado(props: ConfirmMitigadoProps): React.JSX.Element {
  const { finding, onCancel, onConfirm } = props
  const [nota, setNota] = useState('')
  const vacia = nota.trim() === ''

  return (
    <Modal title="Marcar como ya arreglado" onClose={onCancel}>
      <div className="space-y-3">
        <p className="text-foreground text-sm">{finding.title}</p>
        <label className="block space-y-1">
          <span className="text-muted-foreground text-xs">Que lo arregla</span>
          <input
            value={nota}
            onChange={(event) => setNota(event.target.value)}
            placeholder="por ejemplo el sha del commit, o donde vive el fix"
            className={CAMPO}
          />
        </label>
        <p className="text-muted-foreground text-xs">
          Sale de la cola del motor, que dejara de pedir trabajo por el. Sigue visible en el tablero
          y sigue contando para la nota: que este arreglado lo confirma la verificacion dirigida —un
          analista lee el fichero y tiene que probarlo—, no esta marca.
        </p>
        <p className="text-medium text-xs">
          La nota se muestra bajo el hallazgo. Es la unica pista de donde esta el fix cuando vive en
          otro fichero.
        </p>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="tap border-border text-muted-foreground hover:text-foreground rounded-md border px-3 py-1.5 text-xs"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={vacia}
            onClick={() => onConfirm(nota)}
            className="tap bg-primary text-background rounded-md px-3 py-1.5 text-xs font-semibold hover:brightness-110 disabled:opacity-40"
          >
            Marcar
          </button>
        </div>
      </div>
    </Modal>
  )
}
