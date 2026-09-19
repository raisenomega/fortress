import { describe, expect, it } from 'vitest'
import { MODE_INSTRUCTION } from './instruccion-de-modo'

const AUTONOMO = MODE_INSTRUCTION.autonomo

/**
 * ADR-089 ENMIENDA 1 (Fase B, punto 5). Estos tests prueban una AUSENCIA, igual
 * que `operation-mode.test.ts:28-33` cuando aquel ADR retiro el mecanismo:
 * «probaban lo contrario y ahora prueban que no».
 *
 * Se prueba aqui y no solo leyendo el fichero porque lo que importa no es como
 * esta escrito: es que NINGUNA de las tres puertas —`chat-prompt`,
 * `system-prompt`, `step-prompt`— pueda volver a mandarle esa orden al agente.
 */
describe('el autonomo ya NO lleva la lista de palabras', () => {
  it('no nombra auth, payments, RLS ni seguridad como prohibicion', () => {
    // Es LA MISMA lista que ADR-089 retiro del codigo. Dejarla en el prompt la
    // subcontrataba al modelo: el freno seguia, solo cambiaba quien lo aplicaba.
    expect(AUTONOMO).not.toMatch(/auth|payments|RLS|seguridad/i)
  })

  it('no le pide volver a supervisado: en autonomo no hay a quien volver', () => {
    // «sin volver a supervisado» es rebotarle la decision a un humano que no
    // esta. Es, literalmente, el autonomo comportandose como supervisado.
    expect(AUTONOMO).not.toMatch(/supervisado/i)
    expect(AUTONOMO).not.toMatch(/NUNCA|no toques|pregunta|confirmacion/i)
  })

  it('no le pide revertir a mano: esa garantia vive en el codigo', () => {
    // `conRedDeReversion` abre un checkpoint por intento (ADR-079). Un agente
    // que revierte por su cuenta puede deshacer lo que la red iba a conservar.
    // `revier` y no `revert`: la frase retirada decia «revierte», que NO contiene
    // «revert». Se cazo rompiendo la pared — el test pasaba con la frase puesta.
    expect(AUTONOMO).not.toMatch(/revier|revert|deshaz|vuelve atras/i)
  })
})

describe('y lo que queda dice QUE HACER', () => {
  it('aplicar, reportar y correr los tests: sigue entero', () => {
    expect(AUTONOMO).toContain('aplica los cambios y reporta resultados')
    expect(AUTONOMO).toContain('Corre los tests antes')
  })

  it('SUPERVISADO INTACTO: alli si se espera aprobacion, porque hay quien apruebe', () => {
    // La asimetria es el punto: pedir confirmacion esta BIEN cuando hay un
    // humano delante. Lo que no cabe es pedirsela a nadie.
    expect(MODE_INSTRUCTION.supervisado).toContain('espera aprobacion')
    expect(MODE_INSTRUCTION.supervisado).toContain('sin confirmacion')
  })
})
