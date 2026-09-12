/**
 * De que parte de FORTRESS habla un fallo — la app rota, no el agente que se
 * topa con un limite (ADR-086, Nivel 2).
 *
 * Viven APARTE de las doce de `area-de-observacion` porque no son la misma
 * clase de cosa, y el fichero lo dice: aquellas se derivaron de un corpus de
 * 350 observaciones ya escritas y estan CERRADAS; estas son PROVISIONALES y se
 * cierran del corpus que el propio embudo genere.
 *
 * Es la vuelta de tuerca respecto a `tipo` (ADR-081) y a `area` (ADR-085): alli
 * el corpus existia antes que el vocabulario y se pudo medir el 4 % de `otro`.
 * Aqui no hay nada que medir todavia —hoy un fallo no deja rastro— asi que se
 * empieza por lo minimo que el codigo YA demuestra, y no por lo que parezca
 * completo. Una clase de mas, sin emisor, es exactamente lo que ADR-081 llama
 * inventar el vocabulario.
 *
 * Por eso son DOS y no cuatro. `fallo-de-ipc` nace con el envoltorio de los 110
 * handlers, y `fallo-de-render` el dia que el enganche del ErrorBoundary se
 * firme: mientras no haya quien las emita, serian nombres vacios.
 *
 * | area | quien la emite hoy |
 * |---|---|
 * | `fallo-de-arranque` | el embudo del proceso principal |
 * | `fallo-de-persistencia` | el mismo embudo, cuando el error viene de SQLite |
 */
export const AREAS_DE_FALLO = ['fallo-de-arranque', 'fallo-de-persistencia'] as const
