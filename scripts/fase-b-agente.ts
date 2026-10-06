import { spawnSync } from 'child_process'
import { fuentesDeSettings } from '../src/domain/settings/fuentes-de-settings.ts'
import { BUDGET_FLAG, DEFAULT_PER_RUN, dayLimitReached, parseBudget } from '../src/domain/settings/run-budget.ts' // prettier-ignore
import { windowStart } from '../src/domain/telemetry/time-window.ts'
import { buildEnv } from '../src/infrastructure/claude-code/build-env.ts'
import { conSandbox } from '../src/infrastructure/sandbox/con-sandbox.ts'

/**
 * El entorno del hijo: el mismo paso que los spawns de la app (`buildEnv`, sin la
 * sesion viva y con la privacidad del ADR-088), y sin la API key de la shell del
 * operador: el clasificador factura con el login OAuth, y la caja no limpia env.
 */
export function entornoDelAgente(): NodeJS.ProcessEnv {
  const env = buildEnv(null)
  delete env.ANTHROPIC_API_KEY
  return env
}

export interface Respuesta {
  /** El ultimo bloque JSON tal cual: quien llama sabe que clave espera. */
  readonly crudo: Record<string, unknown>
  readonly coste: number
}

/**
 * Los argumentos del `claude -p`, con la red de seguridad del tope de gasto
 * (el patron de `buildArgs`): sin tope, una corrida sobre un repo enorme sigue
 * leyendo hasta agotar la cuota, y los lotes la multiplican por N hallazgos.
 * Cero lo desactiva, si el operador lo decide asi.
 */
export function argumentosDelAgente(
  prompt: string,
  maxUsd = DEFAULT_PER_RUN,
  // trusted -> cargan las fuentes de proyecto; los scripts clasifican repos
  // arbitrarios, asi que nadie lo supone: quien tenga el bit, que lo pase.
  trusted = false
): string[] {
  // Sin confianza, los settings del repo auditado NO cargan (`fuentes-de-settings`).
  // El clasificador no usa grafo ni servidor propio: el flag estricto sin --mcp-config
  // cierra el conjunto MCP a VACIO. Sin el, el hijo monta los servidores de
  // ~/.claude.json del operador con cwd en el arbol auditado (SECURITY-MODEL:
  // explicitos, no automaticos) — capa distinta de --setting-sources.
  // prettier-ignore
  const base = ['-p', prompt, '--output-format', 'json', '--permission-mode', 'plan', '--strict-mcp-config', ...fuentesDeSettings(trusted)]
  if (maxUsd > 0) base.push(BUDGET_FLAG, String(maxUsd))
  return base
}

// El tope del operador (como medir-deriva y topeDiarioAlcanzado); corta si el diario esta
// agotado. Antes del db.close() del llamador; este gasto NO suma a agent_runs (readonly).
export function topeDelAgente(db: { prepare(s: string): { get(...p: unknown[]): unknown } }): number {
  const ajuste = (k: string): string | null => (db.prepare('SELECT value FROM settings WHERE key = ?').get(k) as { value: string } | undefined)?.value ?? null // prettier-ignore
  const tope = parseBudget(ajuste('budget_per_run_usd'), ajuste('budget_per_day_usd'))
  const hoy = (db.prepare('SELECT COALESCE(SUM(cost_usd), 0) AS usd FROM agent_runs WHERE at >= ?').get(windowStart(new Date(), 'hoy')) as { usd: number }).usd // prettier-ignore
  const agotado = dayLimitReached(tope, hoy)
  if (agotado !== null) throw new Error(agotado)
  return tope.perRun
}

/**
 * Una llamada a `claude -p` en modo plan sobre el proyecto auditado, DENTRO de la
 * caja del CLI (ADR-092): lee el repo del cliente para decidir el simbolo y la
 * gemela, y nada mas. Sin caja no se lanza. El tope, obligatorio, sale de topeDelAgente.
 */
export function preguntarAlAgente(prompt: string, proyectoPath: string, maxUsd: number): Respuesta {
  const args = conSandbox(argumentosDelAgente(prompt, maxUsd), proyectoPath)
  if (!args.ok) throw new Error(`sin caja: ${args.error}`)
  const salida = spawnSync('claude', [...args.value], { cwd: proyectoPath, env: entornoDelAgente(), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }) // prettier-ignore
  if (salida.status !== 0) throw new Error(`el clasificador salio con ${salida.status}: ${salida.stderr.slice(0, 300)}`) // prettier-ignore
  const res = JSON.parse(salida.stdout) as { result?: string; total_cost_usd?: number }
  const bloques = [...(res.result ?? '').matchAll(/```json\s*([\s\S]*?)```/g)]
  const ultimo = bloques.at(-1)
  if (ultimo === undefined) throw new Error('el clasificador no devolvio bloque json')
  return { crudo: JSON.parse(ultimo[1]) as Record<string, unknown>, coste: res.total_cost_usd ?? 0 }
}
