import { existsSync } from 'node:fs'
import { dirname, resolve as resolvePath } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

/**
 * Lo que un script de node NO sabe hacer con el codigo de `src`: los alias
 * (`@domain/*`) y los imports sin extension. Son de bundler (tsconfig
 * `moduleResolution: bundler`); node ESM exige el fichero exacto. Sin esto un
 * script solo podia cargar modulos SIN imports, y `fusion-plan.ts` se pudrio en
 * silencio. Se registra con `node --import ./scripts/lib/cargar-ts.mjs`.
 */
const RAIZ = resolvePath(dirname(fileURLToPath(import.meta.url)), '..', '..')
const ALIAS = { '@domain/': 'src/domain/', '@application/': 'src/application/', '@infrastructure/': 'src/infrastructure/' } // prettier-ignore

const conExtension = (ruta) => (existsSync(`${ruta}.ts`) ? `${ruta}.ts` : ruta)

export async function resolve(specifier, context, next) {
  for (const [alias, carpeta] of Object.entries(ALIAS)) {
    if (specifier.startsWith(alias)) {
      const ruta = resolvePath(RAIZ, carpeta, specifier.slice(alias.length))
      return next(pathToFileURL(conExtension(ruta)).href, context)
    }
  }
  if ((specifier.startsWith('./') || specifier.startsWith('../')) && !/\.[a-z]+$/.test(specifier)) {
    const base = resolvePath(dirname(fileURLToPath(context.parentURL)), specifier)
    return next(pathToFileURL(conExtension(base)).href, context)
  }
  return next(specifier, context)
}
