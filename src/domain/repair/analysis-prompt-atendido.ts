/**
 * Lo que FORTRESS ya trato, dicho al analista para que no lo vuelva a anotar.
 *
 * Va al FINAL, pegado a la peticion de `notes`, porque es su contrapeso: ahi se
 * le pide que anote lo que le falto, y aqui se le dice que de eso ya hay parte.
 * Sin esta lista cada invocacion es una sesion nueva sin memoria —el analista no
 * insiste, es que nadie le ha contado nada—, y el backlog se llena de la misma
 * observacion escrita treinta veces por treinta corridas distintas.
 *
 * Se le pide que NO lo repita, no que lo de por bueno: si al mirar el codigo ve
 * que un descarte fue un error, decirlo es exactamente su trabajo. Callarlo por
 * obediencia convertiria esta lista en una forma de enterrar defectos.
 */
export const ENCABEZADO = [
  '',
  'YA ATENDIDO — FORTRESS ya trato estas observaciones (arregladas, o miradas y',
  'descartadas con su motivo). NO las vuelvas a poner en "notes": ya estan en el',
  'expediente y repetirlas solo tapa lo que si es nuevo. Las descartadas siguen en',
  'el codigo A PROPOSITO. Si al leer el codigo ves que un descarte fue un error,',
  'dilo — eso es hallazgo nuevo, no repeticion:'
]

/**
 * Sin cerradas no hay seccion: un encabezado con nada debajo no dice "no hay
 * nada", sugiere que se perdio algo, y el modelo llena los huecos que le dejas.
 */
export function seccionAtendido(atendidas: readonly string[]): readonly string[] {
  if (atendidas.length === 0) return []
  return [...ENCABEZADO, ...atendidas.map((linea) => `- ${linea}`)]
}
