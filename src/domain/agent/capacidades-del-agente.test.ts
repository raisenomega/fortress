import { describe, expect, it } from 'vitest'
import { bloqueDeCapacidades, capacidadesDe } from './capacidades-del-agente'

/**
 * Las capacidades se LEEN de los args, no se afirman. La premisa medida el
 * 2026-09-20: `--allowedTools` solo pre-aprueba; lo unico que quita una
 * herramienta es `--disallowedTools`. Y el 2026-09-21, en vivo: los cuatro
 * agentes del motor —sin `--disallowedTools`— corrieron Bash.
 */
describe('capacidadesDe: lo que dicen los args reales', () => {
  it('sin --disallowedTools hay Bash, aunque el allowlist no lo nombre', () => {
    const args = ['-p', 'x', '--permission-mode', 'default', '--allowedTools', 'Read', 'Grep']
    expect(capacidadesDe(args)).toEqual({ bash: true, edita: false })
  })

  it('con --disallowedTools Bash no hay Bash: es la unica forma de quitarlo', () => {
    const args = ['-p', 'x', '--permission-mode', 'default', '--allowedTools', 'Read', '--disallowedTools', 'Bash'] // prettier-ignore
    expect(capacidadesDe(args).bash).toBe(false)
  })

  it('un Bash negado en la lista NO se confunde con el de otra lista', () => {
    // La lista negada termina en el siguiente flag: lo que venga despues no es suyo.
    const args = ['--disallowedTools', 'Write', '--allowedTools', 'Bash', '--permission-mode', 'default'] // prettier-ignore
    expect(capacidadesDe(args).bash).toBe(true)
  })

  it('edita solo en acceptEdits: Write/Edit piden permiso y en headless nadie lo da', () => {
    expect(capacidadesDe(['--permission-mode', 'acceptEdits']).edita).toBe(true)
    expect(capacidadesDe(['--permission-mode', 'default']).edita).toBe(false)
    expect(capacidadesDe(['--permission-mode', 'plan']).edita).toBe(false)
  })
})

describe('el bloque del prompt refleja, no afirma', () => {
  it('con Bash: lo dice, y dice que corre contenido en la caja', () => {
    const texto = bloqueDeCapacidades({ bash: true, edita: false }).join('\n')
    expect(texto).toMatch(/Tienes Bash/)
    expect(texto).toMatch(/contenid/i)
    expect(texto).not.toMatch(/NO tienes Bash/)
  })

  it('con Bash NO promete mediciones que la allowlist niega: lo dice el propio bloque', () => {
    // Backlog 2026-10-04 (395adb2c): el brief prometia «red a los registros»
    // y la capa de permisos nego npm audit y curl — en headless nadie aprueba
    // lo no listado. El texto promete solo lo concedido, y a notes lo demas.
    const texto = bloqueDeCapacidades({ bash: true, edita: false }).join('\n')
    expect(texto).toMatch(/pre-aprobados|allowlist/)
    expect(texto).toMatch(/se niega sin preguntar/)
  })

  it('sin Bash: lo dice, y que anote en notes lo que solo daria un comando', () => {
    const texto = bloqueDeCapacidades({ bash: false, edita: false }).join('\n')
    expect(texto).toMatch(/NO tienes Bash/)
    expect(texto).toMatch(/"notes"/)
  })
})
