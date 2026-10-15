/**
 * El suelo duro del apagado: GARANTIZA que el main termine aunque `app.exit`
 * se estanque (la X —main vivo en `do_poll` tras `alSalir`, con `app.exit(0)`
 * que no mata—). `process.exit` salta la maquinaria de Electron y los handles
 * vivos del loop; el watchdog lo dispara si a los `ms` el proceso sigue en pie.
 *
 * NO explica la raiz (quien retiene los fds / por que `app.exit` no mata): NETEA
 * la terminacion. Va `unref()`'d A PROPOSITO: en un cierre sano el proceso muere
 * antes y el timer se abandona sin disparar —solo muerde en el caso patologico—.
 * Se arma DESPUES de `alSalir` (el checkpoint del WAL ya paso), asi no interrumpe
 * el cierre de la base. Deps inyectadas: puro, testeable sin electron ni reloj real.
 */
export interface Temporizador {
  unref(): void
}

export interface DepsWatchdog {
  readonly timer?: (cb: () => void, ms: number) => Temporizador
  readonly salir?: (codigo: number) => void
  readonly ms?: number
}

export function armarWatchdog(codigo: number, deps: DepsWatchdog = {}): Temporizador {
  const timer = deps.timer ?? ((cb, ms) => setTimeout(cb, ms))
  const salir = deps.salir ?? ((c) => process.exit(c))
  const t = timer(() => salir(codigo), deps.ms ?? 2000)
  t.unref()
  return t
}
