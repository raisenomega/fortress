import { useEffect, useRef } from 'react'

interface ScanProgressProps {
  readonly text: string
}

/**
 * Un escaneo tarda minutos. Sin esto la app parece colgada, y el operador no
 * puede distinguir "esta leyendo el repo" de "se murio el proceso".
 */
export function ScanProgress({ text }: ScanProgressProps): React.JSX.Element | null {
  const box = useRef<HTMLPreElement>(null)

  useEffect(() => {
    // Seguir el final: lo interesante es lo ultimo que hizo el agente.
    if (box.current) box.current.scrollTop = box.current.scrollHeight
  }, [text])

  return (
    <pre
      ref={box}
      aria-label="Progreso del escaneo"
      className="max-h-40 overflow-y-auto rounded-md border border-border bg-secondary/40 px-3 py-2 font-mono text-[11px] whitespace-pre-wrap text-muted-foreground"
    >
      {text.trim() === '' ? 'Arrancando el escaneo...' : text}
    </pre>
  )
}
