import { matchesGlob } from '../shared/path-glob'

/**
 * Dos rutas que no comparten nada: una en la raiz y otra honda, con nombres que
 * ningun proyecto declararia. Un patron que casa con LAS DOS no esta nombrando
 * un terreno, esta diciendo "todo".
 */
const SONDAS: readonly string[] = ['zzz-sonda', 'a/b/zzz-sonda.ts']

/**
 * Si un glob del `.fortress/config` puede ensanchar la correa de alcance.
 *
 * Lo escribe el REPO AUDITADO, que no es fuente de confianza, y de ahi va a
 * `permitido()`, que decide si un fichero tocado por el generador es violacion.
 * Solo se comprobaba que fuera un array de cadenas.
 *
 * Se rechazan tres formas, y conviene saber que hace hoy cada una:
 *
 * UNIVERSAL —dos asteriscos, solos o seguidos de barra y otro— es la unica que
 * hacia dano de verdad: abre el
 * proyecto ENTERO —medido: con ella pasan `src/domain/a.ts` y `package.json` a
 * la vez— y con eso la correa deja de existir. Un repo auditado podia apagar su
 * propia vigilancia escribiendo dos asteriscos.
 *
 * ABSOLUTA (`/**`) y CON `..` (`../**`) no abrian nada: `fuera()` y la resta
 * INNEGOCIABLE de `scope-check` ya las tapan, y esta medido —abren cero
 * ficheros—. Se rechazan igual porque aceptarlas en silencio esconde un error:
 * quien escribio `/**` creyo estar abriendo algo y no abrio nada, y prefiere
 * enterarse a que su grupo no haga lo que cree.
 *
 * No se rechaza lo ancho-pero-acotado —`src/` con dos asteriscos, o los `.ts`
 * de todo el arbol—: nombra un terreno de verdad, aunque sea grande, y esa es
 * una decision del proyecto.
 */
export function globDeAlcanceValido(patron: string): boolean {
  if (patron === '' || patron.startsWith('/')) return false
  if (patron.split('/').includes('..')) return false
  return !SONDAS.every((sonda) => matchesGlob(sonda, patron))
}

/** Todos, o ninguno. Ver `parseScopeGroups`: media declaracion entendida es
 *  peor que ninguna, porque el operador quiso decir algo y no se sabe que. */
export function globsDeAlcance(raw: readonly string[]): readonly string[] | null {
  return raw.every(globDeAlcanceValido) ? raw : null
}
