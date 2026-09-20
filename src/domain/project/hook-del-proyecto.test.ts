import { describe, expect, it } from 'vitest'
import { guionDe, hooksDeclarados, interpreteDe } from './hook-del-proyecto'
import { RAISEN_NUCLEO } from './hook-fixture'

describe('el pre-vuelo lee los hooks como DATO, no como prosa', () => {
  it('saca el PreToolUse con su matcher y su comando', () => {
    expect(hooksDeclarados(RAISEN_NUCLEO, 'PreToolUse')).toEqual([
      { matcher: 'Write|Edit|MultiEdit', comando: 'python .claude/hooks/protect-invariants.py' }
    ])
  })

  it('la entrada `Stop` con la forma vieja no tumba la lectura', () => {
    // Un parser estricto tiraria el fichero ENTERO por esa linea y dejaria de
    // ver el PreToolUse que si esta bien — que es justo la barrera a mirar.
    expect(hooksDeclarados(RAISEN_NUCLEO, 'Stop')).toEqual([])
    expect(hooksDeclarados(RAISEN_NUCLEO, 'PreToolUse')).toHaveLength(1)
  })

  it('un settings sin hooks, o basura, da lista vacia sin reventar', () => {
    for (const x of [null, undefined, 42, {}, { hooks: 'no' }, { hooks: { PreToolUse: 7 } }]) {
      expect(hooksDeclarados(x, 'PreToolUse')).toEqual([])
    }
  })

  it('una entrada sin `command` se ignora, no se cuela como comando vacio', () => {
    const raro = { hooks: { PreToolUse: [{ matcher: 'Write', hooks: [{ type: 'command' }] }] } }

    expect(hooksDeclarados(raro, 'PreToolUse')).toEqual([])
  })

  it('sin matcher, el matcher es vacio y el hook sigue contando', () => {
    const suelto = { hooks: { PreToolUse: [{ hooks: [{ command: 'python x.py' }] }] } }

    expect(hooksDeclarados(suelto, 'PreToolUse')).toEqual([{ matcher: '', comando: 'python x.py' }])
  })
})

describe('y separa el comando en sus piezas', () => {
  it('el interprete es el primer token: quien tiene que existir', () => {
    expect(interpreteDe('python .claude/hooks/protect-invariants.py')).toBe('python')
    expect(interpreteDe('   bash  x.sh ')).toBe('bash')
    expect(interpreteDe('')).toBe('')
  })

  it('el guion va SIN su carpeta, o el cerco de ADR-085 se lo llevaria', () => {
    expect(guionDe('python .claude/hooks/protect-invariants.py')).toBe('protect-invariants.py')
    expect(guionDe('python')).toBe('')
  })
})
