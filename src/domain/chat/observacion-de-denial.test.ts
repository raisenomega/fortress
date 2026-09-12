import { describe, expect, it } from 'vitest'
import { observacionDeDenial, observacionesDeDenials } from './observacion-de-denial'

describe('el area sale del NOMBRE de la herramienta, y es determinista', () => {
  it('Bash y las herramientas de fichero son permisos-de-herramienta', () => {
    for (const t of ['Bash', 'Read', 'Write', 'Edit', 'Grep', 'WebFetch']) {
      expect(observacionDeDenial(t, 'autonomo').area).toBe('permisos-de-herramienta')
    }
  })

  it('el grafo se parte en dos: consultar no es mantener el indice', () => {
    // Son las dos clases que el corpus separo, con 75 y 52 observaciones, y el
    // operador ya se topo con las dos: `search_graph` denegado en supervisado,
    // e `index_status` tambien.
    expect(observacionDeDenial('mcp__codebase-memory__search_graph', 'supervisado').area).toBe(
      'consulta-del-grafo'
    )
    expect(observacionDeDenial('mcp__codebase-memory__index_status', 'supervisado').area).toBe(
      'indice-del-grafo'
    )
    expect(observacionDeDenial('mcp__codebase-memory__list_projects', 'supervisado').area).toBe(
      'indice-del-grafo'
    )
  })

  it('una herramienta que no mapea cae al cajon declarado, no se inventa clase', () => {
    expect(observacionDeDenial('HerramientaQueAunNoExiste', 'plan').area).toBe('otro')
  })

  it('siempre es una limitacion: es FORTRESS frenando a su propio agente', () => {
    expect(observacionDeDenial('Bash', 'autonomo').kind).toBe('limitacion')
  })
})

describe('SEGURA POR CONSTRUCCION: la nota no puede llevar codigo del cliente', () => {
  it('solo el nombre y el modo — ni rutas, ni comando', () => {
    // Los denials reales de la base traen `ls -la /home/jojo/Escritorio/...`.
    // El comando queda FUERA: esta nota no necesita que el cerco la salve
    // porque no tiene nada que redactar.
    const { note } = observacionDeDenial('Bash', 'autonomo')

    expect(note).toBe('FORTRESS le nego la herramienta Bash al agente en modo autonomo')
    expect(note).not.toContain('/home/')
    expect(note).not.toMatch(/[\w./-]+\.\w+:\d+/)
  })
})

describe('un turno deja UNA nota por herramienta, no una por bloqueo', () => {
  it('siete Bash denegados en una respuesta son UN limite', () => {
    // El turno real de la base bloqueo siete comandos, todos de Bash.
    const siete = Array.from({ length: 7 }, () => 'Bash')

    expect(observacionesDeDenials(siete, 'autonomo')).toHaveLength(1)
  })

  it('pero dos herramientas distintas son dos observaciones', () => {
    const dos = observacionesDeDenials(
      ['mcp__codebase-memory__list_projects', 'mcp__codebase-memory__search_graph'],
      'supervisado'
    )

    expect(dos.map((n) => n.area)).toEqual(['indice-del-grafo', 'consulta-del-grafo'])
  })

  it('sin bloqueos no hay notas: no se rellena por rellenar', () => {
    expect(observacionesDeDenials([], 'autonomo')).toEqual([])
  })
})
