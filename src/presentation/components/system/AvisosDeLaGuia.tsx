import type { GuiaDeOrden } from '@domain/repair/orden-de-firma'

const corto = (id: string): string => id.slice(0, 8)

/** Los avisos ESTATICOS de la guia: lo que las reglas saben sin correr nada.
 *  Cada aviso dice el riesgo, no solo el hecho — «comparten fichero» sin el
 *  «pueden chocar» obligaria al operador a saberse la doctrina de memoria. */
export function AvisosDeLaGuia({ guia }: { readonly guia: GuiaDeOrden }): React.JSX.Element {
  return (
    <>
      {guia.grupos.map((g) => (
        <p key={g.join()} className="text-muted-foreground">
          Comparten fichero (pueden chocar en git): {g.map(corto).join(', ')} — firmalas seguidas.
        </p>
      ))}
      {guia.dependencias.length > 0 && (
        <p className="text-muted-foreground">
          Tocan package.json o el lock: {guia.dependencias.map(corto).join(', ')} — al final; en
          cuanto una entra, las firmas cruzadas caducan sin medir.
        </p>
      )}
    </>
  )
}
