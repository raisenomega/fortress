import type { Peldano } from '@domain/agent/escalera-de-modelos'

/** Lo minimo del catalogo de modelos del SDK (`client.models`): lo que lista. */
export interface CatalogoDeModelos {
  list(): AsyncIterable<{ readonly id: string; readonly created_at: string; readonly display_name: string }> // prettier-ignore
}

export interface ModeloDeLaApi {
  readonly id: string
  readonly nombre: string
}

/**
 * El modelo MAS NUEVO de la familia del alias, segun el catalogo de la API.
 *
 * Existe porque la API, a diferencia del CLI, no acepta el alias pelado: exige
 * un id. Clavar uno (`claude-opus-5`, lo que hubo hasta el 05-oct) viola la
 * doctrina de ADR-078 —un id fijo no sube solo— y dejo al chat en un Opus mas
 * viejo que la cima. Resolverlo aqui mantiene el alias como unica declaracion.
 *
 * Fable no sale nunca, se pida lo que se pida: prohibido por doctrina (ADR-088
 * Enm. 3). Sin modelo de la familia, null: no hay id de repuesto que inventar.
 */
export async function modeloDeLaApi(catalogo: CatalogoDeModelos, alias: Peldano): Promise<ModeloDeLaApi | null> { // prettier-ignore
  let mejor: { id: string; created_at: string; display_name: string } | null = null
  for await (const m of catalogo.list()) {
    if (!m.id.includes(`-${alias}-`) || m.id.includes('fable')) continue
    if (mejor === null || m.created_at > mejor.created_at) mejor = m
  }
  return mejor === null ? null : { id: mejor.id, nombre: mejor.display_name }
}
