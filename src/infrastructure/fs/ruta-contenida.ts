import { existsSync, realpathSync } from 'fs'
import { basename, dirname, isAbsolute, join, relative } from 'path'

/**
 * La ruta REAL de un fichero dentro de una raiz, o null si se sale de ella.
 *
 * Componer con `join` es un filtro LEXICO, y un enlace simbolico no es lexico:
 * `COGNITION-LOG.md` puede ser un enlace a las claves ssh del operador, y
 * `writeFileSync` lo sigue sin preguntar. En un repositorio ajeno —que es lo que
 * esta app existe para auditar— ese enlace lo commitea cualquiera.
 *
 * Se resuelven las DOS puntas, y eso no es celo: la raiz del proyecto puede ser
 * a su vez un enlace, y comparar la ruta real contra la nominal daria fuga falsa
 * en cada proyecto que viva bajo uno. El argumento entero ya estaba escrito en
 * `docs-reader`, aplicado en un solo sitio; esto es el mismo control, compartido.
 *
 * Si el fichero NO existe todavia —que es el caso de toda escritura nueva—
 * `realpath` no puede resolverlo, asi que se resuelve su DIRECTORIO y se le pega
 * el nombre. Ahi esta el enlace que importa: el que lleva la carpeta fuera.
 *
 * Null cuando escapa Y cuando no se puede saber. No poder resolver una ruta no
 * es permiso para escribir en ella.
 */
export function rutaContenida(raiz: string, relativo: string): string | null {
  try {
    const root = realpathSync(raiz)
    const destino = join(root, relativo)
    const real = existsSync(destino)
      ? realpathSync(destino)
      : join(realpathSync(dirname(destino)), basename(destino))
    const rel = relative(root, real)
    return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel) ? real : null
  } catch {
    return null
  }
}
