import type { Evidencia, FormaDeEvidencia } from './evidencia-obsolescencia'

const FORMAS: readonly string[] = ['ausente', 'presente']

const texto = (valor: unknown): string => (typeof valor === 'string' ? valor.trim() : '')

/**
 * Saca la evidencia del JSON del analista, o `undefined` si no vino en forma.
 *
 * Vive en el dominio y no en el parser porque es la MISMA regla que gobierna la
 * extincion: lo que no se entiende no cuenta como prueba. Devolver `undefined`
 * ante una clave torcida no pierde nada —el hallazgo no muere, se mitiga— y
 * evita que un objeto a medias se lea como media prueba.
 *
 * La `forma` se valida contra el vocabulario cerrado: una tercera palabra
 * inventada por el modelo no puede colarse como si fuera una de las dos, porque
 * la comparacion de `estaProbado` es un igual y cualquier otra cosa se
 * comportaria como `ausente` sin que nadie lo hubiera decidido.
 */
export function leerEvidencia(bruto: unknown): Evidencia | undefined {
  if (bruto === null || typeof bruto !== 'object') return undefined
  const campos = bruto as Record<string, unknown>

  const marcador = texto(campos.marcador)
  const forma = texto(campos.forma)
  if (marcador === '' || !FORMAS.includes(forma)) return undefined

  const commit = texto(campos.commit)
  return {
    marcador,
    forma: forma as FormaDeEvidencia,
    ...(commit === '' ? {} : { commit })
  }
}
