import { readFileSync } from 'fs'
import { join } from 'path'
import { describe, expect, it } from 'vitest'

/**
 * Quien crea el agente decide si tiene reloj, y esa decision se toma en SEIS
 * sitios. Este barrido la fija: el escaneo (ADR-082, Enmienda 3) y el Terminal
 * (ADR-088, pieza 1; ADR-082, Enmienda 4) van sin techo, y los otros cuatro
 * conservan el suyo por no pedir nada.
 *
 * Se lee el FUENTE, como `innegociables-derivados`: la eleccion no deja rastro
 * en ningun tipo —los dos caminos compilan igual— asi que el unico sitio donde
 * se puede comprobar es donde se escribe.
 */
const CON_RELOJ: readonly string[] = [
  'src/infrastructure/build/build-target.ts',
  'src/infrastructure/genesis/genesis-ops.ts',
  'src/infrastructure/ipc/agent-draft-handlers.ts',
  'src/infrastructure/ipc/capability-episode-handlers.ts'
]

const SIN_RELOJ: readonly string[] = [
  'src/infrastructure/scan/armar-escaneo.ts',
  'src/infrastructure/ipc/chat-engines.ts'
]

const fuente = (ruta: string): string => readFileSync(join(process.cwd(), ruta), 'utf8')

describe('el escaneo y el Terminal van sin techo, y nadie mas', () => {
  it.each(SIN_RELOJ)('%s pide SIN_TECHO, la MISMA constante de run-claude-process', (ruta) => {
    const texto = fuente(ruta)

    expect(texto).toContain("import { SIN_TECHO } from '../claude-code/run-claude-process'")
    expect(texto).toMatch(/createClaudeCodeAgent\([\s\S]*?SIN_TECHO\s*\)/)
  })

  it.each(CON_RELOJ)('%s NO pide techo: conserva los 15 minutos', (ruta) => {
    // Build, Genesis, borradores y episodios: el Terminal salio de aqui (ADR-088).
    const texto = fuente(ruta)

    expect(texto).toContain('createClaudeCodeAgent')
    expect(texto).not.toContain('SIN_TECHO')
    expect(texto).not.toContain('TECHO_POR_DEFECTO')
  })

  it('siguen siendo SEIS los que crean el agente: ni uno nuevo sin decidir', () => {
    const todos = [...SIN_RELOJ, ...CON_RELOJ]

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

  it.each([
    ['conversacion', 'src/application/chat/reply-from-chat.ts'],
    ['entrevista', 'src/application/chat/reply-from-configuration.ts'],
    ['workflow', 'src/application/workflow/run-step.ts']
  ])('Terminal · %s manda su projectId EN LA PETICION', (_camino, ruta) => {
    expect(fuente(ruta)).toMatch(/projectId:\s*(options|deps)\.project\.id/)
  })

  it('y el agente registra al hijo con ese dueño', () => {
    expect(fuente('src/infrastructure/claude-code/claude-code-agent.ts')).toContain(
      'trackChild(child, request.projectId'
    )
  })
})
