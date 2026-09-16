import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/** El lote simplificado (ADR-088): un gesto, y el Enter del operador manda.
 *  Se lee el FUENTE, como sus hermanos: aqui no se pintan componentes. */
const fuente = (ruta: string): string => readFileSync(join(process.cwd(), ruta), 'utf8')
const SCAN = 'src/presentation/components/scan/'

describe('el lote es UN gesto: precarga, y el Enter del operador lo manda', () => {
  it('la barra tiene un solo boton de accion, sin aprobacion aparte', () => {
    const barra = fuente(`${SCAN}BarraDelLote.tsx`)

    expect(barra).toMatch(/onClick=\{onPreparar\}/)
    expect(barra).not.toMatch(/onAprobar|Aprobar plan/)
  })

  it('sin leyendas que abrumen: ni costes, ni minutos, ni «sin preguntar»', () => {
    // Lo que el cliente LEE, sin los comentarios del codigo.
    const barra = fuente(`${SCAN}BarraDelLote.tsx`)
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')

    expect(barra).not.toMatch(/editara sin volver a preguntar|\$\d|minutos|agentes|coste/)
  })

  it('con un lote precargado, el Enter NO pasa por la plan-card', () => {
    const puerta = fuente('src/presentation/services/puerta-del-envio.ts')

    expect(puerta).toMatch(
      /if \(envio\.projectId !== null && lotePendienteDe\(envio\.projectId\)\) \{\s*void planYResolverLote\(/
    )
  })

  it('y ese Enter manda el mensaje y detras arranca la cola', () => {
    expect(fuente('src/presentation/services/lote-por-enter.ts')).toMatch(
      /await sendMessage\(\{ projectId, prompt, mode, excludedAgents \}\)\s*await resolverLotePendiente\(projectId\)/
    )
  })

  it('al aprobar ya no se escribe ningun aviso largo en el chat', () => {
    const servicio = fuente('src/presentation/services/resolver-lote-en-terminal.ts')

    expect(servicio).not.toMatch(/avisoDeAprobacion/)
  })

  it('en autonomo la barra lo dice ANTES de pulsar, y no repite toasts', () => {
    expect(fuente(`${SCAN}BarraDelLote.tsx`)).toContain('El lote resuelve en modo Supervisado')
    expect(fuente('src/presentation/services/preparar-lote.ts')).not.toMatch(
      /notify|AVISO_AUTONOMO/
    )
  })
})
