import type { FilaDelInforme, GrupoDelInforme } from '../src/domain/project/informe-de-fusion.ts'

const corto = (t: string): string => (t.length <= 62 ? t : `${t.slice(0, 61)}…`)
const linea = (f: FilaDelInforme): string => `    ${f.id} · sev=${f.severity} · ${corto(f.title)}`

/** Un grupo, tal y como se aprueba: la clave por la que agrupa, quien sobrevive,
 *  quien se absorbe, y si al fundirse se perderia gravedad. */
function grupo(g: GrupoDelInforme): readonly string[] {
  const discrepa = g.discrepa ? 'si' : 'no'
  return [
    `CLAVE: ${g.identidad}`,
    `  miembros: ${g.absorbidas.length + 1}`,
    `  superviviente:${linea(g.superviviente).slice(3)}`,
    '  absorbidas:',
    ...g.absorbidas.map(linea),
    `  SEVERIDAD: superviviente=${g.severidadSuperviviente} · maxima-del-grupo=${g.severidadMaxima} · DISCREPA=${discrepa}`, // prettier-ignore
    ''
  ]
}

/** El informe entero. Devuelve lineas en vez de imprimirlas: asi se puede
 *  probar sin capturar la consola, y quien llama decide donde van. */
export function salidaDelPlan(
  proyecto: string,
  vivas: number,
  sinClasificar: number,
  grupos: readonly GrupoDelInforme[]
): readonly string[] {
  const filas = grupos.reduce((n, g) => n + g.absorbidas.length + 1, 0)
  const discrepan = grupos.filter((g) => g.discrepa).length
  return [
    `MODO PLAN (solo lectura) · proyecto=${proyecto} · filas abiertas=${vivas}`,
    'Ninguna fila se toca: esto es lo que la fusion HARIA si se aprobara.',
    '',
    ...grupos.flatMap(grupo),
    `TOTAL: ${grupos.length} grupos · ${filas} filas implicadas · ${filas - grupos.length} se absorberian`, // prettier-ignore
    `SEVERIDAD: ${discrepan} de ${grupos.length} grupos perderian gravedad al fundirse`,
    // Un cero sin explicacion es una trampa: parece "no hay duplicados" cuando
    // puede ser "la fusion no los ve". Solo empatan las claves de hoy.
    `SIN CLASIFICAR: ${sinClasificar} de ${vivas} filas llevan identidad anterior a ADR-067 (fichero|tipo|simbolo ausente), y la fusion NO puede agruparlas` // prettier-ignore
  ]
}
