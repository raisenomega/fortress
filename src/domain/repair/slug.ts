/**
 * D8 — slug determinista para la rama del fix: minusculas, sin diacriticos,
 * no-alfanumericos a '-', colapsado, maximo 30 chars, sin '-' en los bordes.
 */
export function toSlug(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30)
    .replace(/-$/g, '')
}
