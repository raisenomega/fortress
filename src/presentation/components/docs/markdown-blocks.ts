export interface MdBlock {
  readonly type: 'code' | 'heading' | 'list' | 'text'
  readonly level?: number
  readonly lines: readonly string[]
}

/**
 * Divide un .md en bloques (encabezados, listas, codigo cercado, parrafos). Puro
 * y sin React: la parte de render lo mapea a elementos. Cubre lo que traen los
 * documentos de gobierno; no pretende ser un parser completo de Markdown.
 */
export function splitBlocks(text: string): MdBlock[] {
  const out: MdBlock[] = []
  const lines = text.split('\n')
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith('```')) {
      const body: string[] = []
      i += 1
      while (i < lines.length && !lines[i].startsWith('```')) body.push(lines[i++])
      i += 1
      out.push({ type: 'code', lines: body })
    } else if (/^#{1,3}\s+/.test(line)) {
      out.push({
        type: 'heading',
        level: /^#+/.exec(line)?.[0].length ?? 1,
        lines: [line.replace(/^#+\s+/, '')]
      })
      i += 1
    } else if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i]))
        items.push(lines[i++].replace(/^\s*[-*]\s+/, ''))
      out.push({ type: 'list', lines: items })
    } else if (line.trim() === '') {
      i += 1
    } else {
      out.push({ type: 'text', lines: [line] })
      i += 1
    }
  }
  return out
}
