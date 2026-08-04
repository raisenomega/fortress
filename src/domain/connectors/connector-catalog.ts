import type { Connector } from './connector'

/**
 * Catalogo predefinido. Solo endpoints publicados por el propio fabricante:
 * una URL inventada aqui es un servidor MCP que el operador activaria a ciegas.
 * Los que no publican endpoint remoto van con url vacia y se marcan "via CLI".
 */
export const BUILTIN_CONNECTORS: readonly Connector[] = [
  {
    id: 'figma',
    name: 'Figma',
    url: 'https://mcp.figma.com/mcp',
    description: 'Lee disenos, componentes y tokens desde tus archivos de Figma.',
    category: 'diseno',
    builtin: true
  },
  {
    id: 'canva',
    name: 'Canva',
    url: 'https://mcp.canva.com/mcp',
    description: 'Crea y edita disenos de Canva desde el chat.',
    category: 'diseno',
    builtin: true
  },
  {
    id: 'github',
    name: 'GitHub',
    url: '',
    description: 'Issues, PRs y repositorios. Se conecta via CLI (gh), no por URL.',
    category: 'desarrollo',
    builtin: true
  },
  {
    id: 'supabase',
    name: 'Supabase',
    url: '',
    description: 'Base de datos, auth y storage. Se conecta via CLI, no por URL.',
    category: 'datos',
    builtin: true
  },
  {
    id: 'linear',
    name: 'Linear',
    url: 'https://mcp.linear.app/mcp',
    description: 'Issues, ciclos y proyectos de Linear.',
    category: 'productividad',
    builtin: true
  },
  {
    id: 'slack',
    name: 'Slack',
    url: '',
    description: 'Mensajes y canales. Sin endpoint remoto oficial: pega la URL de tu servidor.',
    category: 'productividad',
    builtin: true
  },
  {
    id: 'notion',
    name: 'Notion',
    url: 'https://mcp.notion.com/mcp',
    description: 'Paginas y bases de datos de tu workspace de Notion.',
    category: 'productividad',
    builtin: true
  },
  {
    id: 'sentry',
    name: 'Sentry',
    url: 'https://mcp.sentry.dev/mcp',
    description: 'Errores, trazas y releases de Sentry.',
    category: 'observabilidad',
    builtin: true
  }
]
