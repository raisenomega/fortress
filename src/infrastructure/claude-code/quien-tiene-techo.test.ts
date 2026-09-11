import { readFileSync } from 'fs'
import { join } from 'path'
import { describe, expect, it } from 'vitest'

/**
 * Quien crea el agente decide si tiene reloj, y esa decision se toma en SEIS
 * sitios. Este barrido la fija: el escaneo va sin techo (ADR-082, Enmienda 3) y
 * los otros cinco conservan el suyo por no pedir nada.
 *
 * Se lee el FUENTE, como `innegociables-derivados`: la eleccion no deja rastro
 * en ningun tipo —los dos caminos compilan igual— asi que el unico sitio donde
 * se puede comprobar es donde se escribe.
 */
const CON_RELOJ: readonly string[] = [
  'src/infrastructure/ipc/chat-engines.ts',
  'src/infrastructure/build/build-target.ts',
  'src/infrastructure/genesis/genesis-ops.ts',
  'src/infrastructure/ipc/agent-draft-handlers.ts',
  'src/infrastructure/ipc/capability-episode-handlers.ts'
]

const SIN_RELOJ = 'src/infrastructure/scan/armar-escaneo.ts'

const fuente = (ruta: string): string => readFileSync(join(process.cwd(), ruta), 'utf8')

describe('el escaneo va sin techo y nadie mas', () => {
  it('armar-escaneo pide SIN_TECHO explicitamente', () => {
    expect(fuente(SIN_RELOJ)).toContain('SIN_TECHO')
  })

  it.each(CON_RELOJ)('%s NO pide techo: conserva los 15 minutos', (ruta) => {
    const texto = fuente(ruta)

    expect(texto).toContain('createClaudeCodeAgent')
    expect(texto).not.toContain('SIN_TECHO')
    expect(texto).not.toContain('TECHO_POR_DEFECTO')
  })

  it('siguen siendo SEIS los que crean el agente: ni uno nuevo sin decidir', () => {
    const todos = [SIN_RELOJ, ...CON_RELOJ]

    expect(todos.filter((r) => fuente(r).includes('createClaudeCodeAgent('))).toHaveLength(6)
  })
})

describe('sin reloj, Detener tiene que poder alcanzar al proceso', () => {
  it('el juez de aplicabilidad manda su projectId EN LA PETICION, o nadie podria matarlo', () => {
    const juez = fuente('src/infrastructure/scan/juez-de-aplicabilidad.ts')

    // En la peticion, no solo en la firma: el nombre del parametro sobrevive a
    // quitarlo del objeto, y entonces el hijo se registra sin dueño.
    expect(juez).toMatch(/projectPath,\s*\n\s*projectId,/)
  })

  it('y el agente registra al hijo con ese dueño', () => {
    expect(fuente('src/infrastructure/claude-code/claude-code-agent.ts')).toContain(
      'trackChild(child, request.projectId'
    )
  })
})
