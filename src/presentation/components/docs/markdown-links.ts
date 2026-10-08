import { isSafeExternalUrl } from '@domain/shared/safe-url'

export interface ParteDeTexto {
  readonly tipo: 'texto' | 'link'
  readonly texto: string
  readonly url?: string
}

/** `[etiqueta](url)` o la URL web pelada. El esquema se juzga al PARSEAR. */
const ENLACE = /\[([^\]]+)\]\(([^)\s]+)\)|(https?:\/\/[^\s)]+)/g

/**
 * Parte una linea en texto y enlaces (PASO 94). El CANDADO vive aqui: solo lo
 * que pasa `isSafeExternalUrl` (la MISMA puerta del dominio que usa main-window
 * para abrir fuera) llega a ser link — un `javascript:`/`file:`/`data:` queda
 * como texto plano, asi no existe clic que gatear. La apertura real la hace el
 * `will-navigate` de main-window: el renderer jamas navega ni abre por si solo.
 */
export function partesConEnlace(texto: string): readonly ParteDeTexto[] {
  const partes: ParteDeTexto[] = []
  let cursor = 0
  for (const m of texto.matchAll(ENLACE)) {
    const url = m[3] ?? m[2]
    const etiqueta = m[3] ?? m[1]
    if (!isSafeExternalUrl(url)) continue
    if (m.index > cursor) partes.push({ tipo: 'texto', texto: texto.slice(cursor, m.index) })
    partes.push({ tipo: 'link', texto: etiqueta, url })
    cursor = m.index + m[0].length
  }
  if (cursor < texto.length || partes.length === 0) {
    partes.push({ tipo: 'texto', texto: texto.slice(cursor) })
  }
  return partes
}
