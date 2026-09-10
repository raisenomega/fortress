import { type ModuloAuditoria } from './modulo-auditoria'

/**
 * Que fichero delata que modulo (ADR-083, decision 3). Tablas de pares
 * `[senal, modulo]` y no cadenas de `if`, molde `stack.ts`: anadir una senal
 * es anadir una fila, y la razon de un descarte se DERIVA de estas mismas
 * tablas —nadie escribe dos veces la misma lista y nadie las deja divergir.
 *
 * Cuatro tablas porque hay cuatro formas de mirar una ruta, no por capricho:
 * el sufijo, el nombre exacto en la raiz, un trozo de la ruta y el prefijo de
 * una dependencia. Meterlas en una sola exigiria una quinta columna diciendo
 * como comparar, que es la misma informacion escrita peor.
 */
export type TablaDeSenales = ReadonlyArray<readonly [string, ModuloAuditoria]>

/** Por SUFIJO de la ruta. La UI delata M9; un `.tf` delata infraestructura. */
export const POR_EXTENSION: TablaDeSenales = [
  ['.tsx', 'M9'],
  ['.jsx', 'M9'],
  ['.vue', 'M9'],
  ['.svelte', 'M9'],
  ['.tf', 'M2']
]

/** Por nombre EXACTO en la raiz. Un `package.json` anidado no declara el stack. */
export const POR_FICHERO_RAIZ: TablaDeSenales = [
  ['package.json', 'M4'],
  ['requirements.txt', 'M4'],
  ['go.mod', 'M4'],
  ['cargo.toml', 'M4'],
  ['pom.xml', 'M4'],
  ['composer.json', 'M4'],
  ['gemfile', 'M4'],
  ['dockerfile', 'M2'],
  ['docker-compose.yml', 'M2'],
  ['docker-compose.yaml', 'M2']
]

/** Por TROZO de la ruta: lo que vive en una carpeta, no en la raiz. */
export const POR_PATRON: TablaDeSenales = [
  ['.github/workflows/', 'M7'],
  ['.gitlab-ci.yml', 'M7'],
  ['.circleci/', 'M7'],
  ['jenkinsfile', 'M7'],
  ['supabase/', 'M2'],
  ['k8s/', 'M2'],
  ['helm/', 'M2']
]

/** Por PREFIJO de la dependencia: `@anthropic-ai/sdk` cuenta como `@anthropic-ai`. */
export const POR_DEPENDENCIA: TablaDeSenales = [
  ['openai', 'M5'],
  ['@anthropic-ai', 'M5'],
  ['langchain', 'M5'],
  ['@google/generative-ai', 'M5'],
  ['ollama', 'M5']
]

const TODAS: TablaDeSenales = [
  ...POR_EXTENSION,
  ...POR_FICHERO_RAIZ,
  ...POR_PATRON,
  ...POR_DEPENDENCIA
]

/** Los modulos que ESTAS tablas saben decidir. Derivado, nunca escrito aparte. */
export const MODULOS_CON_SENAL: readonly ModuloAuditoria[] = [...new Set(TODAS.map(([, m]) => m))]

/** Las senales de un modulo, para que su descarte diga QUE se busco y no habia. */
export const senalesDe = (modulo: ModuloAuditoria): readonly string[] =>
  TODAS.filter(([, m]) => m === modulo).map(([senal]) => senal)
