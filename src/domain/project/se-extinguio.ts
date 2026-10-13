/**
 * ¿El hallazgo se EXTINGUIO de verdad? (ATERRIZAJE-5). Solo un juicio real lo
 * extingue: `lifecycle === 'EXTINCT'` (lo pone un veredicto con su extinct_reason).
 * La AUSENCIA no extingue (ADR-065): un hallazgo que no aparece —filtrado, no
 * escaneado— NO es extinto, asi que `null` y cualquier otro lifecycle -> false.
 * Es lo UNICO que hace avanzar la cola del lazo: sin juicio, la cabeza no se mueve.
 */
export function seExtinguio(lifecycle: string | null): boolean {
  return lifecycle === 'EXTINCT'
}
