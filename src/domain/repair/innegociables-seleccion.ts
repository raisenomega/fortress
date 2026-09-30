/**
 * La puerta de la SELECCION: qué severidades puede tocar el motor y en qué
 * orden elige. Familia propia de los innegociables (ADR-106 §3.4).
 *
 * POR QUÉ, medido el 2026-09-30 antes de decidirlo: la puerta de INTEGRACIÓN ya
 * estaba protegida —`alcance`, `scope-check`, `firma-limite` y el par de
 * auto-merge— y la de SELECCIÓN no lo estaba. Con el debut abierto a HIGH quedan
 * HIGH trabajables en el repo propio —12 al firmar; 7 abiertos y activos tras
 * ADR-107, ver la errata §0 del ADR—, así que el motor podría proponer un fix
 * sobre la puerta que acaba de subir. Se cierra donde se abre.
 *
 * No es economía de lista: es la misma razón por la que `firma-limite` se aplica
 * como resta final. Un límite cuya fuerza depende de que nadie diga lo contrario
 * no sobrevive a un lote de quince firmas seguidas.
 */
export const DEFENSAS_DE_LA_SELECCION: readonly string[] = [
  // Qué severidades entran, y la escalera con su criterio.
  'src/domain/repair/debut.ts',
  // El orden: la severidad primero y los cinco desempates detrás.
  'src/domain/repair/select-target.ts',
  'src/domain/repair/orden-candidatos.ts',
  // Quién arma la cola y aplica los descuentos antes de elegir.
  'src/application/repair/elegir-objetivo.ts'
]
