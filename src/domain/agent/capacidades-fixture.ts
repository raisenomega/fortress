import type { Capacidades } from './capacidades-del-agente'

/** Lo que tienen los cuatro agentes del motor, medido en vivo el 2026-09-21. */
export const CON_BASH: Capacidades = { bash: true, edita: false }
/** El modo `lectura` del Terminal: `--disallowedTools Bash`. */
export const SIN_BASH: Capacidades = { bash: false, edita: false }
