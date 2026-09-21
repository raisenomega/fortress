import { BY_FILE } from '../project/stack'

const congelar = <T extends Record<string, readonly string[]>>(tabla: T): T => {
  Object.values(tabla).forEach((hosts) => Object.freeze(hosts))
  return Object.freeze(tabla)
}

/**
 * A donde puede salir el codigo de un proyecto auditado: a los registros de
 * paquetes de SU ecosistema, y a ningun otro sitio (ADR-092, casilla 2).
 *
 * LISTA CERRADA, y cerrada de verdad. `as const` solo la cierra para el
 * compilador; por eso ademas se congela: quien la importe no puede anadirle un
 * host en caliente. Y vive en el proceso de FORTRESS —la lee el proxy, que corre
 * FUERA de la caja—, asi que el agente no la alcanza ni para leerla.
 *
 * HOSTS ENTEROS, sin comodines. Un `*.npmjs.org` abriria `evil.npmjs.org` el dia
 * que alguien registre un subdominio; un host exacto no tiene ese dia.
 *
 * MEDIDO, y hasta donde: npm, de punta a punta —`npm view` real a traves del
 * proxy, el 2026-09-21—. De los demas solo que el host existe y responde por TLS.
 * Cada ecosistema se mide con su herramienta el dia que se use, no antes.
 */
export const REGISTROS_DE_PAQUETES = congelar({
  'Node.js': ['registry.npmjs.org'],
  Python: ['pypi.org', 'files.pythonhosted.org'],
  Rust: ['crates.io', 'static.crates.io', 'index.crates.io'],
  Go: ['proxy.golang.org', 'sum.golang.org'],
  Java: ['repo.maven.apache.org', 'repo1.maven.org'],
  Ruby: ['rubygems.org', 'index.rubygems.org'],
  PHP: ['repo.packagist.org']
} as const)

export type Ecosistema = keyof typeof REGISTROS_DE_PAQUETES

const esEcosistema = (e: string): e is Ecosistema => Object.hasOwn(REGISTROS_DE_PAQUETES, e)

/** Los ecosistemas de un proyecto, por los MANIFIESTOS que tiene en su raiz. De
 *  `BY_FILE` y no de `detectStack`: aquel quita «Node.js» en cuanto reconoce un
 *  framework, y un proyecto Next.js sigue necesitando el registro de npm. */
export function ecosistemasDe(ficheros: readonly string[]): readonly Ecosistema[] {
  const presentes = new Set(ficheros.map((f) => f.toLowerCase()))
  const vistos = BY_FILE.filter(([manifiesto]) => presentes.has(manifiesto)).map(([, e]) => e)
  return [...new Set(vistos)].filter(esEcosistema).sort()
}

/** Los hosts que se abren. Sin ecosistema reconocido: NINGUNO. La duda cierra la
 *  red; abrirlos todos «por si acaso» seria el fallo en abierto. */
export function registrosDe(ecosistemas: readonly string[]): readonly string[] {
  const hosts = ecosistemas.filter(esEcosistema).flatMap((e) => REGISTROS_DE_PAQUETES[e])
  return [...new Set(hosts)].sort()
}

const TODOS = new Set<string>(Object.values(REGISTROS_DE_PAQUETES).flat())

/** Si un host es un registro. Casa el nombre ENTERO: ni sufijos, ni puertos, ni
 *  usuario delante, ni IPs. */
export function esRegistro(host: string): boolean {
  return TODOS.has(host.toLowerCase())
}
