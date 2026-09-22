import type { MotivoSinVerificar } from './no-se-pudo-verificar'

/**
 * Lo que el operador lee cuando el turno se conservo SIN haberse compilado
 * (ADR-091 §4). No es un aviso de cortesia: es lo unico que separa «lo revise y
 * esta bien» de «nadie pudo revisarlo», y sin el, las dos se leen igual.
 *
 * Se dice en el turno y no solo en el parte final porque el operador puede
 * cerrar la app antes de que el lote acabe: lo que se conserva sin verificar
 * tiene que constar en el momento en que se conserva.
 */
export const CONSERVADO_SIN_VERIFICAR =
  '\n\n---\nAVISO: esto se quedo escrito SIN comprobar que el proyecto compila. ' +
  'El revisor miro el cambio, pero aqui no habia con que construirlo —falta la ' +
  'herramienta o el script de verificacion—, asi que nadie lo compilo. ' +
  'Compruebalo tu antes de darlo por bueno.'

const POR_QUE: Record<MotivoSinVerificar, string> = {
  'sin-script': 'el proyecto no declara un script de verificacion',
  'sin-herramienta': 'falta la herramienta que ese script necesita',
  'sin-caja':
    'esta maquina no puede levantar la caja (bwrap) y sin ella no se ejecuta nada del proyecto',
  'sin-enlaces':
    'el disco donde vive el proyecto no admite los enlaces que npm necesita (vfat, un USB)'
}

/**
 * El aviso con SU causa cuando el gate la dio; sin causa, el generico de arriba.
 * Nunca «fallo»: no se midio, y se dice por que. «Falta la herramienta» era la
 * unica frase, y sobre vfat o sin bwrap culpaba a lo que no era.
 */
export function avisoSinVerificar(motivo: MotivoSinVerificar | null): string {
  if (motivo === null) return CONSERVADO_SIN_VERIFICAR
  return `\n\n---\nAVISO: esto se quedo escrito SIN comprobar que el proyecto compila: ${POR_QUE[motivo]}. Nadie lo compilo. Compruebalo tu antes de darlo por bueno.` // prettier-ignore
}
