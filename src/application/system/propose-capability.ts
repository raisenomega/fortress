import type { NewCapability, StoredCapability } from '@domain/system/capability'
import { CAPABILITY_KINDS } from '@domain/system/capability'
import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'

/**
 * Registra una capacidad nueva en 'propuesta'. Riesgo nulo: solo crea la fila,
 * no genera ni ejecuta nada. La inicia un humano (o una oportunidad del backlog).
 * Existir no es estar promovida: asciende luego por episodios reales, con OMEGA.
 */
export function proposeCapability(
  context: AppContext,
  input: NewCapability
): Result<StoredCapability> {
  const name = input.name.trim()
  if (name.length === 0) return err('La capacidad necesita un nombre')
  if (!CAPABILITY_KINDS.includes(input.kind)) return err('Tipo de capacidad no valido')
  return ok(
    context.capabilities.add({
      kind: input.kind,
      name: name.slice(0, 80),
      originObservation: input.originObservation.slice(0, 200)
    })
  )
}
