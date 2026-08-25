# ADR-067: La identidad de un hallazgo es fichero │ tipo │ símbolo

- **Fecha:** 2026-08-23
- **Estado:** Aceptada (Fase A y Fase B — ver [ADR-071](adr-071-cuando-dos-filas-son-una.md))
- **Área:** Escaneo · Identidad de hallazgos

## Contexto

`findingIdentity` era `severidad │ fichero │ título`, y el título es prosa que
el escáner redacta distinta en cada corrida. El mismo defecto abría fila nueva
cada vez.

Al medirlo contra los 45 hallazgos reales del propio repositorio, **las otras
dos piezas resultaron igual de inestables**. El mismo agujero de `graph:verify`
se reportó cinco veces:

| fila | severidad | línea |
|---|---|---|
| 1 y 2 | LOW | 43 |
| 3 | LOW | 49 |
| 4 | MEDIUM | 49 |
| 5 | MEDIUM | 59 |

Cinco redacciones, **dos severidades** (el modelo re-puntúa) y **tres líneas**
(el archivo creció encima). De los cuatro campos disponibles solo el fichero era
estable, y el fichero solo es demasiado grueso: en `graph-action-handlers.ts`
había dos agujeros distintos.

Contado sobre las 45 filas, ninguna combinación de los campos existentes se
acercaba a los 34 defectos reales:

| fórmula | grupos |
|---|---|
| `severidad │ fichero │ título` (la vieja) | 45 |
| `severidad │ fichero │ línea` | 38 |
| `fichero │ línea` | 36 |
| `fichero` (lo más grueso posible) | 30 |

**Faltaba información en la base.** Así que se pide.

## Decisión

`identity = fichero │ tipo │ símbolo`. Ninguno de los tres lo redacta el modelo.

- **tipo** — se ELIGE de un vocabulario cerrado. Clasificar, no redactar. Ver
  [TAXONOMIA-DE-DEFECTOS](../TAXONOMIA-DE-DEFECTOS.md).
- **símbolo** — la función o bloque que contiene el defecto (`handleVerify`,
  `buildEnv`). Es lo único de la ubicación que sobrevive a que el código de
  arriba crezca.

El símbolo es lo que impide pasarse de grueso: sin él, `handleVerify` y
`handleAb` —mismo fichero, mismo tipo, dos agujeros distintos— colapsarían en
una fila y el tablero escondería el segundo detrás del primero.

La severidad **sale** de la identidad: los datos demuestran que fragmenta. Pasa
a ser un atributo que se actualiza al reconfirmar.

Un tipo fuera del vocabulario cae a `otro` y un símbolo ausente queda vacío. No
se inventa ninguno de los dos y el escaneo no se tira por eso.

## Consecuencias

- Aplica **hacia adelante**. Las filas anteriores conservaron su identidad vieja
  hasta la Fase B, ejecutada el 2026-08-24: una pasada de agente que les asignó
  tipo y símbolo, y una fusión que colapsó los duplicados conservando la fila
  más antigua ([ADR-071](adr-071-cuando-dos-filas-son-una.md)). Las filas de
  otros proyectos siguen con la fórmula vieja hasta que se los vuelva a escanear.
- El primer escaneo tras esto muestra **más** filas, no menos: cada defecto
  reportado con la clave nueva abre fila junto a su versión vieja.
- El `patternId` de COGNITION **no** cambia: ver
  [ADR-068](adr-068-tope-mide-trabajo-y-techo-de-turnos.md) para el patrón, y la
  sección de identidades en [DATA-MODEL](../DATA-MODEL.md).
- `fingerprintOf` no se toca: los descartes del operador siguen exigiendo línea
  y título, y ahí conviene fallar del lado estricto.
- Los productores deterministas (`audit-rules`, `maintainability-probe`) no
  llevan tipo y caen a `otro`. Su identidad `fichero │ otro │ ''` resulta
  estable igual — una fila por archivo.

## Código

`src/domain/project/finding-identity.ts` · `src/domain/scan/tipo-de-defecto.ts` ·
`src/domain/scan/report-contract.ts` · `src/domain/scan/parse-scan-output.ts`
