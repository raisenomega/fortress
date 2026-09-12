import { describe, expect, it } from 'vitest'
import { describeDenial, nombreDeHerramienta } from './lectura-del-denial'

/** Un denial REAL del CLI, con el comando que trajo uno de los seis turnos
 *  bloqueados de la base del operador. */
const CON_COMANDO = {
  tool_name: 'Bash',
  tool_input: { command: 'ls -la /home/jojo/Escritorio/Raisen_FCC/ && echo "---"' }
}

describe('las dos lecturas de un denial sirven a cosas distintas', () => {
  it('la del OPERADOR prefiere el comando: es lo que le deja entender que paso', () => {
    expect(describeDenial(CON_COMANDO)).toContain('/home/jojo/Escritorio')
  })

  it('la que APRENDE FORTRESS se queda con el nombre, y AHI esta la garantia', () => {
    // El punto exacto donde se elige. La nota de auto-mejora sale de aqui, y si
    // esto devolviera el comando, la ruta del cliente viajaria al backlog
    // exportable sin que ningun cerco la mirase: `observacionDeDenial` recibe ya
    // una cadena y no puede saber de donde vino.
    const nombre = nombreDeHerramienta(CON_COMANDO)

    expect(nombre).toBe('Bash')
    expect(nombre).not.toContain('/home/')
    expect(nombre).not.toContain('Raisen_FCC')
  })

  it('una herramienta MCP viaja entera: su nombre ya es generico', () => {
    const mcp = { tool_name: 'mcp__codebase-memory__search_graph' }

    expect(nombreDeHerramienta(mcp)).toBe('mcp__codebase-memory__search_graph')
  })

  it('sin nombre no se inventa: `desconocida`, que es un valor que se ve', () => {
    expect(nombreDeHerramienta({ tool_input: { command: 'rm -rf /cliente' } })).toBe('desconocida')
    expect(nombreDeHerramienta(null)).toBe('desconocida')
  })

  it('y el secreto del comando sigue tachado en la lectura del operador', () => {
    const conToken = { tool_name: 'Bash', tool_input: { command: 'export TOKEN=ghp_abcdefghij1234567890' } } // prettier-ignore

    expect(describeDenial(conToken)).not.toContain('ghp_abcdefghij1234567890')
  })
})
