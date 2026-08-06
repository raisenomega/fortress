/**
 * Ruta absoluta en POSIX (`/...`) o Windows (`C:\` o UNC `\\`). El renderer no
 * es fuente de confianza: una ruta relativa o con `..` no debe entrar como raiz
 * de proyecto ni recibir un `git init` antes de validarse.
 */
export function isAbsoluteProjectPath(p: unknown): p is string {
  return (
    typeof p === 'string' &&
    (p.startsWith('/') || /^[a-zA-Z]:[\\/]/.test(p) || p.startsWith('\\\\'))
  )
}
