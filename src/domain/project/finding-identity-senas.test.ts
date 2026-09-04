import { describe, expect, it } from 'vitest'
import { senasDeIdentidad } from './finding-identity'

describe('las dos senas que la clave llevaba dentro', () => {
  it('del formato actual salen el tipo y el simbolo', () => {
    // Una clave real de la base del operador.
    expect(senasDeIdentidad('src/domain/connectors/graph-mcp.ts|allowlist-permisiva|graph_tool_rule')) // prettier-ignore
      .toEqual({ tipo: 'allowlist-permisiva', simbolo: 'graph_tool_rule' })
  })

  it('del formato VIEJO no se inventa nada: severidad|fichero|titulo da null', () => {
    // 127 filas de la base siguen asi. Partirlas igual entregaria un fichero
    // llamandolo tipo, que es peor que no decir nada.
    expect(senasDeIdentidad('MEDIUM|supabase/functions/x/index.ts|permite reenviar')).toEqual({
      tipo: null,
      simbolo: null
    })
  })

  it('las cuatro severidades delatan el formato viejo, no solo una', () => {
    for (const sev of ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']) {
      expect(senasDeIdentidad(`${sev}|a.ts|t`).tipo).toBeNull()
    }
  })

  it('un simbolo vacio es null, no cadena vacia', () => {
    expect(senasDeIdentidad('a.ts|path-traversal|')).toEqual({
      tipo: 'path-traversal',
      simbolo: null
    })
  })

  it('una clave con otro numero de piezas no se fuerza', () => {
    expect(senasDeIdentidad('a|b')).toEqual({ tipo: null, simbolo: null })
    expect(senasDeIdentidad('a|b|c|d')).toEqual({ tipo: null, simbolo: null })
  })
})
