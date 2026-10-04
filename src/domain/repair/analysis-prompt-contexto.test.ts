import { describe, expect, it } from 'vitest'
import { EMPTY_CORPUS } from '../project/corpus-descriptor'
import { CON_BASH } from '../agent/capacidades-fixture'
import { buildAnalysisPrompt } from './analysis-prompt'

// prettier-ignore
const TARGET = { id: 'f1', severity: 'LOW' as const, title: 't', file: 'src/a.ts', line: 1, firstSeen: '2026-01-01T00:00:00.000Z', tipo: 'path-traversal', simbolo: 'handleverify' }
const prompt = (): string =>
  buildAnalysisPrompt(TARGET, EMPTY_CORPUS, [], 'home-jojo-repo', CON_BASH)

describe('el analista sabe DESDE CUANDO se ve el hallazgo', () => {
  it('la fecha de deteccion viaja en la cabecera, en corto y DICIENDO que es UTC', () => {
    // Backlog 2026-10-04 (38b3fcb4): el brief decia «Detectado el 2026-10-04»
    // con la caja aun en el 2026-10-03 local — una fecha «del futuro» que
    // sugeria reloj roto. No era bug: era UTC sin etiquetar.
    expect(prompt()).toContain('Detectado el 2026-01-01 (UTC).')
  })

  it('se le dice que la fecha NO prueba nada: el fichero manda', () => {
    // Sin esto, un hallazgo viejo invitaria a declararlo OBSOLETO por antiguo.
    expect(prompt()).toContain('La fecha NO es prueba')
  })

  it('el sha del arbol NO se le da: sin Bash no puede diffear', () => {
    expect(prompt()).not.toContain('sha')
  })
})

describe('el analista sabe como se llama el proyecto en el grafo', () => {
  it('el nombre viaja en el prompt, antes de mandarle usar el grafo', () => {
    const p = prompt()

    expect(p).toContain('este proyecto se llama "home-jojo-repo"')
    expect(p.indexOf('home-jojo-repo')).toBeLessThan(p.indexOf('GRAFO PRIMERO'))
  })

  it('va como PISTA, con la salida si no cuadra: la respuesta de search_graph lista los nombres', () => {
    // El esquema lo decide el servidor. Acertar ahorra turnos; fallar no rompe.
    // `list_projects` no existe en el servidor fijado: era una fantasma.
    expect(prompt()).toContain('search_graph responde con los nombres reales')
    expect(prompt()).not.toContain('list_projects')
  })
})

describe('que hacer cuando el grafo no tiene el proyecto', () => {
  it('le dice que la primera consulta se lo dice, sin herramienta aparte', () => {
    expect(prompt()).toContain('la primera consulta te lo dice')
    expect(prompt()).not.toContain('index_status')
  })

  it('le prohibe indexar: es accion del operador, con gate', () => {
    expect(prompt()).toContain('NO lo indexes tu')
  })

  it('le dice que NO lo anote: es un estado conocido, no un fallo', () => {
    // 53 observaciones repitiendo el mismo estado operativo. Pero solo eso:
    // "lo demas que te falte, si" — no se le manda callar en general.
    expect(prompt()).toContain('no hace falta anotarlo en "notes"')
    expect(prompt()).toContain('lo demas que te falte, si')
  })

  it('la frescura se comprueba contra el disco: no hay herramienta de frescura en el servidor', () => {
    expect(prompt()).toContain('el disco dice QUE hay hoy')
    expect(prompt()).not.toContain('check_index_coverage')
    expect(prompt()).not.toContain('detect_changes')
  })
})
