/**
 * Nombre de carpeta a partir del nombre del proyecto. Se normaliza porque el
 * nombre lo escribe una persona ("Mi App Genial") y la carpeta la van a usar
 * git, npm y la terminal, donde los espacios y las tildes dan problemas.
 */
export function toFolderName(projectName: string): string {
  return projectName
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Nombres que el sistema o las herramientas reservan. */
const RESERVED = new Set(['.', '..', 'node_modules', '.git'])

export function isValidFolderName(name: string): boolean {
  if (name.length === 0 || name.length > 64) return false
  if (RESERVED.has(name)) return false
  return /^[a-z0-9][a-z0-9-]*$/.test(name)
}
