/**
 * Como se llama un proyecto dentro del grafo, y por tanto como se llama su `.db`
 * en la cache de codebase-memory-mcp: la ruta absoluta aplanada —sin la barra
 * inicial ni las finales, y con las barras Y LOS ESPACIOS vueltos guiones—. Los
 * guiones bajos y las mayusculas se conservan (`Raisen_FCC` queda igual).
 *
 * UNA SOLA, y es deliberado. Habia dos: esta y `slugDelGrafo`, que daba la pista
 * del nombre al prompt del analista. Se arreglo una y la otra se quedo con el
 * bug —solo barras, sin espacios—, que es exactamente la forma de fallo que el
 * repo ya tiene escrita: «al partir un modulo, la mitad que decidia se quedaba
 * fuera». Dos copias de la misma regla divergen; una sola no puede.
 *
 * Los espacios importan: sin ellos FORTRESS buscaba `…-onn Disk-raisen-nucleo.db`
 * donde el fichero era `…-onn-Disk-raisen-nucleo.db`, leia «sin indice» cuatro
 * grafos ya construidos, y cada «Instalar grafo» relanzaba su indexacion entera.
 *
 * La regla se DERIVA de pares reales, no se supone: cada `.db` guarda su
 * `root_path`, asi que es el propio servidor diciendo con que ruta lo nombro.
 * Ver el test. Si el servidor cambia su esquema, se vuelve a medir.
 *
 * Para el prompt del analista va como PISTA: acertar le ahorra una ronda de
 * turnos averiguando el nombre; fallar no rompe nada, solo cuesta. Lo que NO
 * tiene es red que lo desmienta — `list_projects` no existe en el servidor
 * v0.9.0, aunque este comentario llego a prometerlo.
 */
export function graphSlug(projectPath: string): string {
  return projectPath
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')
    .replace(/[\s/]/g, '-')
}
