import { describe, expect, it } from 'vitest'
import { parseConnectorUrl } from './connector-url'

const PRIVADOS = [
  'https://127.0.0.1:8080/mcp',
  'https://localhost/mcp',
  'https://169.254.169.254/latest/meta-data',
  'https://10.0.0.5/mcp',
  'https://192.168.1.10/mcp',
  'https://[::1]/mcp',
  // Las mismas, escritas de otro modo: el filtro miraba solo el punteado.
  'https://2130706433/mcp',
  'https://0x7f000001/mcp',
  'https://0177.0.0.1/mcp',
  'https://127.1/mcp'
]

describe('un servidor MCP no puede vivir en la red del operador', () => {
  it.each(PRIVADOS)('%s se rechaza', (url) => {
    // Es un destino al que FORTRESS manda credenciales. Que sea https no lo
    // hace tuyo: 169.254.169.254 son los metadatos de la nube.
    expect(parseConnectorUrl(url)).toMatchObject({ ok: false })
  })

  it.each(['https://mcp.ejemplo.com/sse', 'https://api.github.com/mcp', 'https://8.8.8.8/mcp'])(
    '%s sigue valiendo',
    (url) => {
      expect(parseConnectorUrl(url)).toMatchObject({ ok: true })
    }
  )
})
