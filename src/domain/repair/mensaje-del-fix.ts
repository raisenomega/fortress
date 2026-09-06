import type { Candidate } from './select-target'
import { toSlug } from './slug'

/** Donde `git log --oneline` deja de mostrar el asunto entero. */
const ASUNTO_MAX = 72

/** Corta en la ultima frontera de palabra que cabe y marca el corte. Cortar a
 *  ciegas por caracter dejaba asuntos partidos a media palabra. */
function resumen(linea: string, sitio: number): string {
  if (linea.length <= sitio) return linea
  // Un caracter menos: el marcador de corte tambien ocupa sitio.
  const corte = linea.slice(0, sitio - 1)
  // Si justo despues del corte empieza un espacio, el trozo YA acaba en
  // palabra entera y buscar hacia atras tiraria una palabra buena.
  const palabra = linea[sitio - 1] === ' ' ? corte.length : corte.lastIndexOf(' ')
  return `${(palabra > 0 ? corte.slice(0, palabra) : corte).replace(/[\s,;:.]+$/, '')}…`
}

/** El hallazgo, en UNA linea. Se aplana a proposito: el titulo lo redacta un
 *  agente, y un salto suyo colaria lineas falsas en el cuerpo del commit. */
function elHallazgo(t: Candidate): string {
  const donde = t.line === null ? t.file : `${t.file}:${t.line}`
  return `hallazgo: "${t.title.replace(/\s+/g, ' ').trim()}" (${t.severity}) en ${donde}`
}

/**
 * El mensaje del commit del fix. Asunto + cuerpo, como el del merge: quien
 * audita si un hallazgo esta cerrado llega por `git log` y el mensaje es su
 * primera pista.
 *
 * Antes era una sola linea con los 60 primeros caracteres del analisis, y a
 * esa altura la frase todavia no ha dicho nada: `fe57978` quedo escrito como
 * "El hallazgo sigue vivo tal cual: el handler de `push:run` so" — el asunto
 * ni siquiera nombra que mitad del defecto cerro. Ahora el asunto corta por
 * palabras y el cuerpo lleva el analisis ENTERO, que es lo unico que responde
 * esa pregunta sin abrir la app.
 *
 * El prefijo `repair(<slug del titulo>)` no se toca: `intentosPrevios` lo usa
 * para reconocer los intentos de un hallazgo en el historial.
 */
export function mensajeDelFix(target: Candidate, whatToChange: string): string {
  const prefijo = `repair(${toSlug(target.title)}):`
  const texto = whatToChange.trim()
  const linea = texto.replace(/\s+/g, ' ')
  const asunto = `${prefijo} ${resumen(linea, ASUNTO_MAX - prefijo.length - 1)}`.trim()
  return [asunto, '', elHallazgo(target), ...(texto === '' ? [] : ['', texto])].join('\n')
}
