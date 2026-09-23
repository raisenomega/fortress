/**
 * La CUARTA familia del criterio innegociable: los FRENOS DE GASTO del Motor
 * (ADR-102). No validan una entrada ni contienen a un agente: deciden que NO se
 * paga por generar lo que el analisis ya dice que no cabe, y que un hallazgo
 * pausado por eso no vuelve a la baraja hasta que el terreno cambie. Aflojarlos
 * no abre un agujero: abre la cartera —49,71 $ medidos en un solo ancla— sin
 * que el operador firme. La pausa y el reintento van juntos porque son la misma
 * garantia por dos puertas: un motivo que se volviera reintentable, o una pausa
 * que levantara el HEAD, devolverian el gasto sin tocar el guard.
 */
export const FRENOS_DE_GASTO: readonly string[] = [
  'src/domain/repair/leer-arreglo.ts',
  'src/domain/repair/arreglo-fuera-de-correa.ts',
  'src/domain/repair/motivo-del-arreglo.ts',
  'src/domain/repair/bloqueo-por-rechazo.ts',
  'src/domain/repair/retry-eligibility.ts',
  'src/application/repair/guard-del-arreglo.ts',
  'src/domain/repair/innegociables-gasto.ts'
]
