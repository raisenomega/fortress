/**
 * Los hooks del repo auditado NO corren: son codigo del cliente y este git es
 * nuestro (ADR-092, git opcion B). `core.hooksPath=/dev/null` apaga tambien
 * `post-checkout` y `post-merge`, que `--no-verify` no toca; `core.fsmonitor=`
 * apaga el demonio que el repo pudiera declarar. Una sola lista: los dos `git`
 * del motor la comparten, y una que se quede atras seria un hook que vuelve.
 */
export const SIN_HOOKS = ['-c', 'core.hooksPath=/dev/null', '-c', 'core.fsmonitor='] as const
