import type { MotorStatus } from '@domain/repair/motor-status'

/**
 * Lo unico que este chip tiene que decir: que el motor esta PARADO.
 *
 * Contaba propuestas vivas —"Pendientes: N"— y ese numero resulto ser el mismo
 * que el del chip de firma siempre que el motor no esta corriendo: en reposo,
 * toda propuesta viva es una que espera firma. Dos chips con la misma cifra al
 * lado se leen como dos cosas distintas que no lo son.
 *
 * La contaminacion, en cambio, no la dice nadie mas, y es la que importa:
 * `guardRun` bloquea el proyecto entero hasta que alguien lo revise, asi que
 * mientras este encendido el motor no avanza por mucho que se le pida.
 */
export function detenido(status: MotorStatus): { readonly razon: string } | null {
  return status.kind === 'stopped-critical' ? { razon: status.reason } : null
}

/** Lo que el chip no cabe a decir: por que esta parado. */
export function tituloDetenido(razon: string): string {
  return `Motor detenido — ${razon}. No avanzara hasta que alguien lo revise`
}
