import { describe, expect, it } from 'vitest'
import { casillaDeBaja, MOTIVOS_DE_BAJA, type CasillaDeBaja } from './clasificacion-de-baja'
import { esAveria } from './averia'
import { REJECTION_REASONS } from './repair-rejection'

/** El reparto ENTERO, escrito a mano: si la tabla cambia, esto lo dice. */
const ESPERADO: Readonly<Record<string, CasillaDeBaja>> = {
  omega_vetado: 'vetadas',
  budget_exceeded: 'porPresupuesto',
  generator_timeout: 'porTimeout',
  gate_timeout: 'porTimeout',
  omega_timeout: 'porTimeout',
  scope_violation: 'porCorrea',
  gate_failed: 'porCorrea',
  no_diff_produced: 'porCorrea',
  solo_pruebas: 'porCorrea',
  turnos_agotados: 'porLimitePropio',
  npm_ci_failed: 'porEntornoDelProyecto',
  gate_sin_verificacion: 'porEntornoDelProyecto',
  proyecto_sin_confianza: 'porEntornoDelProyecto',
  worktree_missing: 'porEntornoDelProyecto',
  worktree_contaminated: 'porEntornoDelProyecto',
  invalid_state: 'porDefectoInterno',
  omega_response_invalid: 'porDefectoInterno',
  analisis_ilegible: 'porDefectoInterno',
  generator_error: 'porDefectoInterno',
  superseded: 'superadas',
  orphan_before_generate: 'superadas'
}

describe('cada motivo tiene su casilla, y ninguno cae en un cajon', () => {
  it('los 21 que llegan al recuento estan mapeados uno a uno', () => {
    for (const [motivo, casilla] of Object.entries(ESPERADO)) {
      expect(casillaDeBaja(motivo), motivo).toBe(casilla)
    }
    expect(MOTIVOS_DE_BAJA).toHaveLength(Object.keys(ESPERADO).length)
  })

  it('el vocabulario ENTERO esta cubierto: o corta antes, o tiene casilla', () => {
    // Es la red contra el defecto que esto arregla: un rechazo nuevo sin casilla
    // ya no compila, y si alguien lo saltara, esta prueba lo caza igual.
    const huerfanos = REJECTION_REASONS.filter((r) => !esAveria(r) && !(r in ESPERADO))
    expect(huerfanos).toEqual([])
  })

  it('las tres averias no se cuentan: cortan la tanda antes', () => {
    for (const averia of ['provider_error', 'omega_error', 'cli_no_arranco']) {
      expect(esAveria(averia), averia).toBe(true)
      expect(averia in ESPERADO, averia).toBe(false)
    }
  })

  it('ningun motivo es prefijo de otro: la busqueda es inequivoca', () => {
    const pares = MOTIVOS_DE_BAJA.flatMap((a) =>
      MOTIVOS_DE_BAJA.filter((b) => b !== a && b.startsWith(a)).map((b) => `${a} < ${b}`)
    )
    expect(pares).toEqual([])
  })

  it('el sufijo no despista: se clasifica por el prefijo', () => {
    expect(casillaDeBaja('omega_vetado: el cerrojo ya existe')).toBe('vetadas')
    expect(casillaDeBaja('gate_failed_at=typecheck')).toBe('porCorrea')
    expect(casillaDeBaja('superseded_by=a1b2c3d4')).toBe('superadas')
  })

  it('un motivo desconocido NO se traga: sale a su propia casilla', () => {
    expect(casillaDeBaja('un_desenlace_que_nadie_declaro')).toBe('sinClasificar')
    expect(casillaDeBaja('')).toBe('sinClasificar')
  })
})
