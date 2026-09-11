import { describe, expect, it } from 'vitest'
import { tipoDeLaIdentidad } from './finding-identity'

describe('el tipo que la clave lleva dentro', () => {
  it('del formato de hoy sale el tipo, que esta en el tercer trozo', () => {
    expect(tipoDeLaIdentidad('src/domain/connectors/graph-mcp.ts|31|allowlist-permisiva')).toBe(
      'allowlist-permisiva'
    )
  })

  it('un defecto sin linea tambien responde: `-` es una linea valida', () => {
    // Las sondas emiten hallazgos sin linea —«los tests fallan»— y su clase
    // sigue constando.
    expect(tipoDeLaIdentidad('src/a.ts|-|otro')).toBe('otro')
  })

  it('del formato pre-ADR-067 no se inventa nada: severidad|fichero|titulo da null', () => {
    // 98 filas de la base del operador siguen asi. Partirlas igual entregaria
    // un fichero llamandolo tipo, que es peor que no decir nada.
    expect(tipoDeLaIdentidad('MEDIUM|supabase/functions/x/index.ts|permite reenviar')).toBeNull()
  })

  it('las cuatro severidades delatan ese formato, no solo una', () => {
    for (const sev of ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']) {
      expect(tipoDeLaIdentidad(`${sev}|a.ts|t`)).toBeNull()
    }
  })

  it('y del formato de ADR-067 tampoco: su segundo trozo es un TIPO, no una linea', () => {
    // `fichero|tipo|simbolo`. Sin esta guarda devolveria `graph_tool_rule`
    // —un simbolo— llamandolo tipo, y el analista recibiria una clase que no
    // existe en el vocabulario. Con la formula nueva no deberian quedar, pero
    // el backfill se salta las que no puede tocar y esto lee lo que haya.
    expect(tipoDeLaIdentidad('a.ts|allowlist-permisiva|graph_tool_rule')).toBeNull()
  })

  it('un tipo vacio es null, no cadena vacia', () => {
    expect(tipoDeLaIdentidad('a.ts|12|')).toBeNull()
  })

  it('una clave con otro numero de piezas no se fuerza', () => {
    expect(tipoDeLaIdentidad('a|b')).toBeNull()
    expect(tipoDeLaIdentidad('a|12|c|d')).toBeNull()
  })
})
