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

// `textoParaElModo` vivia aqui: componia prompt + hallazgo para que el freno de
// palabras lo juzgara. Retirado el freno (ADR-089) no lo lee nadie, y un
// fichero que nadie llama es justo como nacio el problema que ese ADR cierra.
