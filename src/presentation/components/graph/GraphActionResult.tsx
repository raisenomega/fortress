import { useGraphActionStore } from '../../stores/graph-action-store'

/** Lo que dejan las acciones: progreso de instalar, resultado de verificar, error. */
export function GraphActionResult(): React.JSX.Element {
  const running = useGraphActionStore((state) => state.running)
  const progress = useGraphActionStore((state) => state.progress)
  const verify = useGraphActionStore((state) => state.verify)
  const error = useGraphActionStore((state) => state.error)

  return (
    <>
      {running === 'install' && progress ? (
        <pre className="max-h-24 overflow-y-auto rounded-md bg-secondary/40 p-2 font-mono text-[10px] whitespace-pre-wrap text-muted-foreground">
          {progress}
        </pre>
      ) : null}
      {verify ? (
        <p className="font-mono text-[11px]">
          <span className={verify.connected ? 'text-success' : 'text-critical'}>
            {verify.connected ? '✓ conecta' : '✗ no conecta'}
          </span>
          <span className="text-muted-foreground">
            {` · ${verify.tools.length} tools`}
            {verify.tools.length ? `: ${verify.tools.slice(0, 6).join(', ')}` : ''}
          </span>
        </p>
      ) : null}
      {error ? <p className="text-[11px] text-critical">{error}</p> : null}
    </>
  )
}
