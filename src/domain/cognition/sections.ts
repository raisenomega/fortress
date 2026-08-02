export interface Section {
  readonly heading: string
  readonly body: string
}

/** Sin tildes y en mayusculas: los titulos del log las llevan, las busquedas no. */
export function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().trim()
}

/**
 * Parte el documento por titulos de nivel dos. Se devuelve una lista y no un
 * mapa a proposito: los patrones y las reflexiones tambien son titulos de
 * nivel dos y hay muchos, asi que el orden y las repeticiones importan.
 */
export function splitSections(markdown: string): readonly Section[] {
  return markdown
    .split(/^##\s+/m)
    .slice(1)
    .map((part) => {
      const breakAt = part.indexOf('\n')
      if (breakAt === -1) return { heading: part.trim(), body: '' }
      return { heading: part.slice(0, breakAt).trim(), body: part.slice(breakAt + 1) }
    })
}

export function findSection(sections: readonly Section[], name: string): string | null {
  const target = normalize(name)
  return sections.find((section) => normalize(section.heading).startsWith(target))?.body ?? null
}
