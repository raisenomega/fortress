import { Square } from 'lucide-react'

interface SendButtonProps {
  readonly running: boolean
  readonly disabled: boolean
  readonly onStop: () => void
}

/**
 * El mismo boton envia y detiene. Mientras un workflow corre, enviar otro no
 * tiene sentido y detener es lo unico que el operador quiere poder hacer: un
 * "listo para produccion" son siete agentes y varios minutos.
 */
export function SendButton({ running, disabled, onStop }: SendButtonProps): React.JSX.Element {
  if (running) {
    return (
      <button
        type="button"
        onClick={onStop}
        title="Detener. Lo ya guardado se queda; los pasos que faltan no se ejecutan"
        className="tap flex h-10 items-center gap-1.5 rounded-md bg-critical px-4 text-sm font-semibold text-destructive-foreground hover:brightness-110"
      >
        <Square size={13} aria-hidden />
        Detener
      </button>
    )
  }

  return (
    <button
      type="submit"
      disabled={disabled}
      className="tap h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-40"
    >
      Enviar
    </button>
  )
}
