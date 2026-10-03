import { GRAPH_READ_TOOLS } from '@domain/connectors/graph-mcp'

/** Lectura de ficheros. El grafo es lo primero, pero el veredicto se da leyendo
 *  el archivo real: verificar linea por linea es literalmente lo que se pide. */
const FICHEROS = ['Read', 'Grep', 'Glob']

/**
 * El allowlist de los tres agentes del motor, DERIVADO del vocabulario del
 * dominio en vez de reescrito a mano.
 *
 * Estaba copiado tres veces —analista, generador y OMEGA— y las tres copias se
 * quedaron cortas frente al vocabulario: faltaban `query_graph` y
 * `get_graph_schema`, de LECTURA. (Se creyo que faltaban tambien `list_projects`
 * e `index_status`: no existen en el servidor fijado, y hoy el vocabulario se
 * DERIVA de lo que el servidor expone.)
 *
 * El efecto no fue una excepcion sino una perdida silenciosa: en headless una
 * herramienta fuera de la lista se auto-deniega, y el analista acababa sacando
 * el nombre del proyecto del MENSAJE DE ERROR de `search_graph`, que lo lista
 * como pista. Funcionaba de rebote. Lo dijo 79 veces en su cuaderno de
 * auto-mejora antes de que alguien lo leyera: el bucle de la Fase 4 existe para
 * que la 80 no haga falta.
 *
 * Derivarlo cierra la clase entera: una herramienta nueva en el vocabulario
 * llega sola a los tres, sin que nadie se acuerde de tres ficheros.
 */
export const TOOLS_LECTURA = [...GRAPH_READ_TOOLS, ...FICHEROS].join(',')

/**
 * ADR-111: la UNICA entrada Bash del generador, y es una FORMA, no un permiso
 * abierto. Comodin EN MEDIO —jamas el prefijo `:*`, que aprobaria el install
 * normal: recompila nativos y muere en la caja (medido 2026-10-02)—. Contra la
 * capa de permisos real (2026-10-03, CLI 2.1.288): aprueba `npm install
 * <paquete>@<version> [--save-dev] --package-lock-only --ignore-scripts`;
 * niega sin los flags, con algo DESPUES de ellos, `npm run`/`exec`, y el
 * comando encadenado ENTERO si el otro tramo no tiene su propia aprobacion.
 * El comodin no casa vacio: el prompt nombra siempre paquete y version.
 */
export const NPM_SOLO_LOCK = 'Bash(npm install * --package-lock-only --ignore-scripts)'

/** El generador ADEMAS edita, y ADEMAS puede regenerar el lock (ADR-111) —
 *  solo en la forma segura de arriba. Para TODO lo demas Bash sigue pidiendo
 *  una aprobacion que en headless nadie da (medido 2026-10-02: 5 negativas;
 *  el docblock que decia «lo tiene igual» era verdad solo para los comandos
 *  de lectura que el CLI auto-aprueba). El commit y el gate siguen siendo
 *  del motor, no suyos. */
export const TOOLS_EDICION = [...GRAPH_READ_TOOLS, ...FICHEROS, 'Edit', 'Write', NPM_SOLO_LOCK].join(',') // prettier-ignore
