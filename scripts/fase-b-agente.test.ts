import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BUDGET_FLAG, DEFAULT_PER_RUN } from '../src/domain/settings/run-budget.ts'
import { argumentosDelAgente, entornoDelAgente, topeDelAgente } from './fase-b-agente.ts'

// Una base de mentira: los ajustes del operador y el gasto de hoy en agent_runs.
type Base = Parameters<typeof topeDelAgente>[0]
const base = (ajustes: Record<string, string>, hoy: number): Base => ({
  prepare: (sql) => ({
    get: (k) => (sql.includes('agent_runs') ? { usd: hoy } : { value: ajustes[String(k)] })
  })
})

test('el tope configurado por el operador es el que viaja al flag, no el de por defecto', () => {
  const tope = topeDelAgente(base({ budget_per_run_usd: '0.5', budget_per_day_usd: '10' }, 0))
  const args = argumentosDelAgente('hola', tope)
  assert.equal(args[args.indexOf(BUDGET_FLAG) + 1], '0.5')
})

test('con el diario agotado no se lanza: corta con el mensaje del tope', () => {
  const agotada = base({ budget_per_run_usd: '3', budget_per_day_usd: '2' }, 2.5)
  assert.throws(() => topeDelAgente(agotada), /Tope diario alcanzado/)
})

// Uso: node --import ./scripts/lib/cargar-ts.mjs --test scripts/fase-b-agente.test.ts
// El contrato de buildArgs: el tope viaja y cero lo desactiva; sin el, N hallazgos sin techo.
test('el tope de gasto viaja por defecto con el valor medido', () => {
  const args = argumentosDelAgente('hola')
  assert.equal(args[args.indexOf(BUDGET_FLAG) + 1], String(DEFAULT_PER_RUN))
})

test('un tope de cero desactiva el limite, si el operador lo decide', () => {
  assert.ok(!argumentosDelAgente('hola', 0).includes(BUDGET_FLAG))
})

test('el prompt sigue justo despues de -p, en modo plan', () => {
  const args = argumentosDelAgente('clasifica el hallazgo')
  assert.equal(args[args.indexOf('-p') + 1], 'clasifica el hallazgo')
  assert.equal(args[args.indexOf('--permission-mode') + 1], 'plan')
})

// CRITICAL 351abcd1: sin el par, los hooks del repo auditado corren FUERA de la caja.
// 'plan' no quita Bash: solo --disallowedTools lo impide (lo-que-se-le-quita.test.ts).
const denegadas = (a: string[]): string[] => a.slice(a.indexOf('--disallowedTools') + 1, a.indexOf('--strict-mcp-config')) // prettier-ignore
test('sin confianza, SOLO las fuentes del operador, y sin Bash ni red', () => {
  const args = argumentosDelAgente('hola')
  assert.equal(args[args.indexOf('--setting-sources') + 1], 'user')
  assert.deepEqual(denegadas(args), ['Bash', 'WebSearch', 'WebFetch'])
})

test('con confianza, las de proyecto cargan A PROPOSITO, y Bash sigue denegado', () => {
  const args = argumentosDelAgente('hola', DEFAULT_PER_RUN, true)
  assert.ok(!args.includes('--setting-sources'))
  assert.deepEqual(denegadas(args), ['Bash'])
})

// El cerco MCP (medir-deriva.test.ts): el flag estricto sin --mcp-config cierra el conjunto a vacio.
test('cierra el conjunto MCP: --strict-mcp-config viaja y sin servidor alguno', () => {
  const args = argumentosDelAgente('hola')
  assert.ok(args.includes('--strict-mcp-config'))
  assert.ok(!args.includes('--mcp-config'))
})

// Lista blanca, no recorte: lo que no se nombra no llega al hijo (git-env.test.ts).
test('el hijo no hereda credenciales del operador, y si PATH, HOME y la privacidad', () => {
  const centinelas = ['GH_TOKEN', 'ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN', 'ANTHROPIC_BASE_URL']
  const previo = { ...process.env }
  for (const c of centinelas) process.env[c] = 'centinela'
  const env = entornoDelAgente()
  for (const c of centinelas) if (previo[c] === undefined) delete process.env[c]; else process.env[c] = previo[c] // prettier-ignore
  for (const c of centinelas) assert.equal(env[c], undefined, c)
  assert.deepEqual([env.PATH, env.HOME], [process.env.PATH, process.env.HOME])
  assert.equal(env.DISABLE_FEEDBACK_COMMAND, '1')
  assert.equal(env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC, '1')
})
