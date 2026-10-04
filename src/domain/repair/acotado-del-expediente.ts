/**
 * El acotado del expediente de OMEGA (DEUDAS §18, firmado dentro de ADR-112).
 *
 * MEDIDO EN VIVO el 2026-10-03: el expediente del CVE con el package-lock
 * ENTERO ×2 (370 KB cada lado) costo $8,90 y salio EXIT=1 SIN veredicto; el
 * MISMO expediente con la nota costo $1,04 y salio APROBADO — con OMEGA
 * citando ADR-111 y reconociendo el ruido del lock por su perfil. El revisor
 * juzga con el DIFF (doctrina de ADR-111 §5: nadie lee el lock linea a
 * linea); el cuerpo entero de un fichero gordo solo quema contexto y dinero.
 *
 * EL TOPE ES DE DINERO, no de transporte (eso ya lo resolvio ADR-112): 32 KiB
 * deja pasar CUALQUIER fichero del repo propio con margen de sobra —la regla
 * de 75 lineas los tiene en ~4 KB— y tambien el codigo razonable de un repo
 * de CLIENTE (el Terminal usa el mismo juicio), mientras corta la clase
 * lock/minificado/generado, que es la que nadie lee. En el peor caso un
 * fichero admitido cuesta ~8k tokens por lado.
 *
 * La nota dice QUE falto y DONDE mirar: un hueco mudo seria un expediente
 * mentiroso, y OMEGA puede decir PARCIAL si de verdad necesitara el cuerpo.
 */
export const TOPE_DE_FICHERO_EN_EXPEDIENTE = 32 * 1024

export function acotarContenido(
  path: string,
  content: string,
  tope = TOPE_DE_FICHERO_EN_EXPEDIENTE
): string {
  if (content.length <= tope) return content
  const kb = Math.round(content.length / 1024)
  return `[${path} omitido por tamano (${kb} KB); el diff muestra sus cambios]`
}
