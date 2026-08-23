# ADR-065: Ningún hallazgo se extingue por ausencia en un escaneo

- **Fecha:** 2026-08-23
- **Estado:** Aceptada
- **Área:** Escaneo · Ciclo de vida de hallazgos
- **Sustituye a:** la regla de doble evidencia descrita en [ADR-001](adr-001-score-honesto-por-expediente-active.md)

## Contexto

Un hallazgo se extinguía si el escaneo no lo reportaba **y** git mostraba que
su archivo había cambiado desde la primera detección. La segunda prueba nació
para que la ausencia sola no bastara, después de que cuatro hallazgos murieran
en falso el 2026-08-08 sin que nadie tocara sus archivos.

Parecía suficiente y no lo era. `changedSince` preguntaba por el **archivo**,
no por la línea, y en un repositorio en desarrollo activo casi todo archivo
cambia cada pocos días. La prueba se cumplía por defecto y la regla degeneraba
en «la ausencia extingue» — justo lo que existía para impedir.

Lo confirmó el 2026-08-23. Dos hallazgos sobre `unsafe-inline` en
`src/renderer/index.html` murieron porque un commit añadió un **comentario** al
archivo; la relajación que denunciaban seguía en `main`. Un tercero, un HIGH
sobre `project.trusted`, murió con el veredicto correcto y la evidencia
equivocada: su archivo lo tocó un commit sin relación, y lo que de verdad lo
cerraba estaba en otro archivo dos días antes.

El escáner es un modelo leyendo código, no una función determinista. No nombrar
algo no es afirmar que no está. Ni siquiera repite la misma redacción entre
corridas — ver [ADR-067](adr-067-identidad-fichero-tipo-simbolo.md).

## Decisión

**El escaneo no cierra ningún hallazgo.** Lo que no reconfirma sigue ACTIVE, en
el tablero y puntuando el score.

La única vía de extinción es el **juicio de un agente**: al drenar, C2 dictamina
y solo `OBSOLETO` cierra. `REAL` sigue vivo para repararse, e `ILEGIBLE` no es
una opinión sino la ausencia de una legible — ver
[ADR-066](adr-066-analisis-ilegible-no-es-obsoleto.md).

Cada extinción registra **por qué** en `findings.extinct_reason`.

## Consecuencias

- Nada muere sin ser visto. Un hallazgo que el operador nunca drena puede vivir
  indefinidamente, y eso es correcto: nadie lo ha mirado.
- El tablero crece. Con la identidad estable de [ADR-067](adr-067-identidad-fichero-tipo-simbolo.md)
  el crecimiento es por defectos nuevos, no por redacciones repetidas.
- `isExtinct` y `extinguishable` se borraron: sin llamador no se dejan.
- Auditar una extinción ya no exige cruzar la base con el historial de git.
- La marca «sin reconfirmar» del tablero es **derivada** (`lastSeen` contra el
  último escaneo), no un cuarto valor de `lifecycle`. Añadirlo habría obligado a
  repasar los cinco sitios que filtran por `ACTIVE`, y olvidar uno dejaría al
  motor ciego ante decenas de hallazgos sin que nadie se entere.

## Código

`src/domain/scan/ausencia.ts` · `src/application/scan/pesar-evidencia.ts` ·
`src/application/repair/extinguir-con-juicio.ts` ·
`src/infrastructure/persistence/finding-lifecycle-sql.ts`
