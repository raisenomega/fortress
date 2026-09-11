import type { ChildProcessWithoutNullStreams } from 'child_process'

/** Proceso de mentira con las dos salidas que `collectRun` engancha. */
export function hijoFalso(): ChildProcessWithoutNullStreams & {
  killed: string[]
  cerrar: () => void
} {
  const listeners: Record<string, Array<(arg: unknown) => void>> = {}
  const on = (event: string, handler: (arg: unknown) => void): unknown => {
    ;(listeners[event] ??= []).push(handler)
    return null
  }
  const child = {
    killed: [] as string[],
    kill: (signal: string) => void child.killed.push(signal),
    stdout: { on, once: on, removeListener: () => undefined, resume: () => undefined },
    stderr: { on },
    on,
    cerrar: () => (listeners.close ?? []).forEach((h) => h(0))
  }
  return child as unknown as ChildProcessWithoutNullStreams & {
    killed: string[]
    cerrar: () => void
  }
}
