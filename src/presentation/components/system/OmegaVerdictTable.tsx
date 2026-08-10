import type { OmegaVerdict } from '@domain/repair/omega-verdict'

const VERDE = 'text-success'
const ROJO = 'text-critical'
const AMBAR = 'text-medium'
const GRIS = 'text-muted-foreground'

/** Color por valor de eje, segun la tabla firmada en Q4. */
const TONO: Readonly<Record<string, string>> = {
  SI: VERDE, NO: ROJO, PARCIAL: AMBAR,
  BUENO: VERDE, ACEPTABLE: GRIS, RUIDOSO: AMBAR,
  NINGUNO: VERDE, MENOR: GRIS, MAYOR: ROJO,
  APROBADO: VERDE, VETADO: ROJO
} // prettier-ignore

const FILAS: ReadonlyArray<readonly [string, keyof Omit<OmegaVerdict, 'razon'>]> = [
  ['resuelve el hallazgo', 'resuelve_el_hallazgo'],
  ['respeta scope', 'respeta_scope'],
  ['respeta doNotTouch', 'respeta_doNotTouch'],
  ['calidad del diff', 'calidad_del_diff'],
  ['riesgo residual', 'riesgo_residual'],
  ['veredicto global', 'veredicto_global']
]

/** Q4 — los 6 ejes de OMEGA como tabla densa: se ve de golpe, nada colapsado. */
export function OmegaVerdictTable({
  verdict
}: {
  readonly verdict: OmegaVerdict
}): React.JSX.Element {
  // prettier-ignore
  return (
    <div className="border-border/60 my-1 rounded border px-2 py-1">
      {FILAS.map(([etiqueta, campo]) => (
        <div key={campo} className="flex items-center gap-2 text-[11px]">
          <span className="text-muted-foreground w-40">{etiqueta}</span>
          <span className={TONO[verdict[campo]] ?? GRIS}>{verdict[campo]}</span>
        </div>
      ))}
      <p className="text-foreground mt-1 text-[11px]">{verdict.razon}</p>
    </div>
  )
}
