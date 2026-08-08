import type { DetectedFinding } from '../scan/detected-finding'

/** Mapa de atencion real: los archivos con hallazgos, pesados por cuantos tienen. */
export function buildAttention(findings: readonly DetectedFinding[]): string {
  const porArchivo = new Map<string, number>()
  for (const f of findings) porArchivo.set(f.file, (porArchivo.get(f.file) ?? 0) + 1)

  if (porArchivo.size === 0) return ['## MAPA DE ATENCION', '', 'Sin hallazgos.', ''].join('\n')

  const max = Math.max(...porArchivo.values())
  const lineas = [...porArchivo.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([file, n]) => `${file}  ${(n / max).toFixed(2)}  ${n} hallazgo(s)`)

  return ['## MAPA DE ATENCION', '', ...lineas, ''].join('\n')
}
