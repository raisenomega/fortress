/** Absoluta, sin NUL y sin `..`: lo unico que se le pasa a bwrap como ruta. */
export const rutaLimpia = (ruta: string): boolean =>
  ruta.startsWith('/') && !ruta.includes('\0') && !ruta.split('/').includes('..')

/** Si `hija` es `padre` o vive debajo. Por SEGMENTOS: `/home/ana2` no esta
 *  dentro de `/home/ana`, y un `startsWith` a secas diria que si. */
export function dentroDe(padre: string, hija: string): boolean {
  const base = padre.endsWith('/') ? padre : `${padre}/`
  return hija === padre || hija.startsWith(base)
}

export interface RutasDeLaCaja {
  readonly proyecto: string
  readonly cwd: string
  readonly home: string
  readonly otras: readonly string[]
}

/**
 * Por que NO se puede montar esto, o null si se puede.
 *
 * El proyecto se monta en ESCRITURA, asi que su anchura es la anchura de la
 * caja: si es `/`, el HOME o un ancestro suyo, la caja entera queda abierta y el
 * resto de los flags pasan a ser decoracion. No se «acota un poco»: no se monta.
 */
export function porQueNoSeMonta(r: RutasDeLaCaja): string | null {
  const todas = [r.proyecto, r.cwd, r.home, ...r.otras]
  if (!todas.every(rutaLimpia)) return 'ruta-no-absoluta-o-sucia'
  if (r.proyecto === '/' || dentroDe(r.proyecto, r.home)) return 'proyecto-demasiado-ancho'
  if (!dentroDe(r.proyecto, r.cwd)) return 'cwd-fuera-del-proyecto'
  return null
}
