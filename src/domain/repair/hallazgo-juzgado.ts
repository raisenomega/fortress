/**
 * Lo UNICO que OMEGA necesita del hallazgo y su plan para juzgar un fix: que se
 * iba a arreglar, donde, con que patron, que no tocar y el riesgo. Ocho campos,
 * que son exactamente los que `buildOmegaPrompt` escribe (ADR-090, Fase A).
 *
 * Existe para que el juicio no dependa de `Analysis`, que es del Motor y
 * arrastra `Candidate`, `Evidencia`, las notas y la factura del analista. El
 * Terminal no tiene nada de eso: tiene un hallazgo enfocado y el plan que
 * escribio el productor, y con eso basta para pedir un veredicto.
 *
 * NO se aplana `target`. Aplanarlo obligaria al Motor a mapear su `Analysis` en
 * cada llamada; conservando la forma, `Analysis` lo satisface por estructura y
 * el Motor sigue pasando el suyo tal cual. El desacople es el mismo —el juicio
 * ya no nombra a `Analysis`— y no cuesta un traductor que pueda desincronizarse.
 */
export interface HallazgoJuzgado {
  /** Del hallazgo: lo que identifica el defecto que el fix decia resolver. */
  readonly target: {
    readonly title: string
    readonly file: string
    readonly line: number | null
  }
  /** Del plan: el entendimiento que el fix decia ejecutar. */
  readonly whatToChange: string
  readonly where: string
  readonly patternToCopy: string
  readonly doNotTouch: string
  readonly risk: string
}
