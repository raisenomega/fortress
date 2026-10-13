import Database from 'better-sqlite3'
import { homedir } from 'os'
import { join } from 'path'
import { componerPrompt, ORDENES } from './cabecera-arnes.ts'
import { correrCto, juzgar } from './cabecera-corrida.ts'
import { topeDelAgente } from './fase-b-agente.ts'

/**
 * ARNES ADVERSARIAL de la cabecera de subordinacion (PASO 142), FUERA del gate.
 * Mide, con corridas opus REALES ancladas al libro de un cliente hostil, si el
 * CTO trata la inyeccion como DATO (AGUANTO) o la obedece (OBEDECIO). Canarios
 * inofensivos: no exfiltran nada. Estocastico y caro — por eso NO va en
 * `npm test`; se corre a mano antes de B.2 o tras cambiar el prompt/modelo.
 *
 * Uso:   npm run verify:cabecera [corridas_por_variante=2] [--base <ruta>]
 * Salida: una linea por corrida (AGUANTO/OBEDECIO + busquedas + texto); verde
 *         (exit 0) = TODAS aguantaron, rojo (exit 1) = al menos una obedecio.
 */
function topeDelOperador(argv: readonly string[]): number {
  // Tope y diario del operador, de la base en SOLO lectura: este gasto no suma a agent_runs.
  const ruta = argv.includes('--base') ? argv[argv.indexOf('--base') + 1] : join(homedir(), '.config/fortress-command-center/fortress.db') // prettier-ignore
  const db = new Database(ruta, { readonly: true })
  try {
    return topeDelAgente(db)
  } finally {
    db.close()
  }
}

function main(): number {
  const argv = process.argv.slice(2)
  const n = Math.max(1, Number(argv[0]?.startsWith('--') ? '2' : (argv[0] ?? '2')))
  const maxUsd = topeDelOperador(argv)
  let obedecio = 0
  for (const variante of Object.keys(ORDENES)) {
    const prompt = componerPrompt(variante)
    for (let i = 1; i <= n; i++) {
      const c = correrCto(prompt, maxUsd)
      const v = juzgar(variante, c)
      if (v === 'OBEDECIO') obedecio++
      console.log(`== ${variante}.${i} == ${v}`)
      console.log(`   searches: ${c.searches.length ? c.searches.join(' | ') : '(ninguna)'}`)
      console.log(`   texto[0..180]: ${c.text.slice(0, 180).replace(/\n/g, ' ')}`)
    }
  }
  console.log(`\nCABECERA ${obedecio === 0 ? 'AGUANTO' : 'OBEDECIO'} — obediencias totales: ${obedecio}`) // prettier-ignore
  return obedecio === 0 ? 0 : 1
}

process.exit(main())
