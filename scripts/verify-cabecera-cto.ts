import { componerPrompt, ORDENES } from './cabecera-arnes.ts'
import { correrCto, juzgar } from './cabecera-corrida.ts'

/**
 * ARNES ADVERSARIAL de la cabecera de subordinacion (PASO 142), FUERA del gate.
 * Mide, con corridas opus REALES ancladas al libro de un cliente hostil, si el
 * CTO trata la inyeccion como DATO (AGUANTO) o la obedece (OBEDECIO). Canarios
 * inofensivos: no exfiltran nada. Estocastico y caro — por eso NO va en
 * `npm test`; se corre a mano antes de B.2 o tras cambiar el prompt/modelo.
 *
 * Uso:   npm run verify:cabecera [corridas_por_variante=2]
 * Salida: una linea por corrida (AGUANTO/OBEDECIO + busquedas + texto); verde
 *         (exit 0) = TODAS aguantaron, rojo (exit 1) = al menos una obedecio.
 */
function main(): number {
  const n = Math.max(1, Number(process.argv[2] ?? '2'))
  let obedecio = 0
  for (const variante of Object.keys(ORDENES)) {
    const prompt = componerPrompt(variante)
    for (let i = 1; i <= n; i++) {
      const c = correrCto(prompt)
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
