import { app } from 'electron'

export interface HomeDir {
  readonly label: string
  readonly path: string
}

/**
 * Atajos a las carpetas del usuario. Se piden a Electron y no se construyen a
 * mano porque dependen del idioma del sistema: aqui son "Escritorio" y
 * "Documentos", en otro equipo serian "Desktop" y "Documents".
 */
export function homeDirs(): readonly HomeDir[] {
  const candidatos: ReadonlyArray<readonly [string, Parameters<typeof app.getPath>[0]]> = [
    ['Escritorio', 'desktop'],
    ['Documentos', 'documents'],
    ['Carpeta personal', 'home']
  ]

  return candidatos.flatMap(([label, key]) => {
    try {
      return [{ label, path: app.getPath(key) }]
    } catch {
      return []
    }
  })
}
