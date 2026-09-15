import { sanearParaPrompt } from '../shared/sanear-para-prompt'
import type { Severity } from '../shared/severity'

/**
 * Lo que el Terminal sabe del hallazgo que resuelve (ADR-088, pieza 2), ya
 * releido de la base. Sin evidencia: el escaner no la guarda por hallazgo.
 */
export interface HallazgoAResolver {
  readonly id: string
  readonly severity: Severity
  readonly title: string
  readonly file: string
  readonly line: number | null
  readonly tipo: string | null
  readonly simbolo: string | null
  readonly mitigatedNote: string | null
  readonly verificacionNote: string | null
  /** La sesion del productor para este hallazgo (ADR-088, Enmienda 2), o null.
   *  Viaja al CLI como `--resume`, NUNCA al prompt: `formatearHallazgo` no la pinta. */
  readonly sesion: string | null
}

/**
 * Una linea «etiqueta: valor», o ninguna si el valor no consta. Todo pasa por
 * `sanearParaPrompt`: el titulo, la ruta y el simbolo salen del repo AUDITADO,
 * y las notas de un operador o de un agente. Nada entra al prompt en crudo.
 */
const linea = (etiqueta: string, valor: string | null): readonly string[] =>
  valor === null || valor.trim() === '' ? [] : [`- ${etiqueta}: ${sanearParaPrompt(valor)}`]

/** El bloque de UN hallazgo para el prompt del Terminal. */
export function formatearHallazgo(h: HallazgoAResolver): string {
  const ubicacion = h.line === null ? h.file : `${h.file}:${h.line}`
  return [
    ...linea('id', h.id),
    `- severidad: ${h.severity}`,
    ...linea('titulo', h.title),
    ...linea('fichero', ubicacion),
    ...linea('tipo', h.tipo),
    ...linea('simbolo', h.simbolo),
    ...linea('nota de mitigado', h.mitigatedNote),
    ...linea('ultima verificacion', h.verificacionNote)
  ].join('\n')
}

/**
 * El texto con el que se decide el modo del turno: lo que escribio el operador
 * MAS de que va el hallazgo (fichero, titulo y tipo). Con foco, el prompt puede
 * ser un «resuelvelo» neutro; si solo se juzgara ese texto, un hallazgo de auth
 * dejaria de degradar a supervisado. Se compone aqui, en quien llama, para no
 * tocar la regla que decide (`modo-efectivo`, innegociable).
 */
export function textoParaElModo(prompt: string, foco: HallazgoAResolver | null): string {
  if (foco === null) return prompt
  return [prompt, foco.file, foco.title, foco.tipo ?? ''].join('\n')
}
