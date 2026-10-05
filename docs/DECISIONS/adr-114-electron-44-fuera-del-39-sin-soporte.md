# ADR-114 — Electron 44: salir del 39 sin soporte, por margen y no por obligación

- **Fecha:** 2026-10-05 (firma del operador desde la app: 08:42 UTC)
- **Estado:** Aceptada (registro de una decisión de runtime, con su evidencia)
- **Área:** Seguridad

## 1. Qué decide

`devDependencies.electron` pasa de `^39.2.6` (lock: 39.8.10) a `^44.5.1`. Es la
propuesta del Motor `b1c3b03a` (HIGH, `package.json:67`), juzgada por OMEGA en
opus y firmada por el operador. Entra en `main` con el merge `3151b3e`.

Solo cambian `package.json` (una línea) y `package-lock.json` (el árbol propio
de Electron). `electron-builder.yml` y el bloque `electronFuses` **no se tocan**.

## 2. Por qué: los avisos, con sus identificadores

`npm audit` sobre `main@5534279` (Electron 39.8.10) da cuatro avisos HIGH de
Electron:

| Aviso | Qué | CVSS |
|---|---|---|
| GHSA-hq2x-r82h-9wj4 | Los popups abiertos por OpenURLFromTab pierden las restricciones de sandbox HTML heredadas | 8,2 |
| GHSA-gr2m-v5gq-v685 | Las ventanas abiertas desde un documento con sandbox no heredan sus restricciones | 8,2 |
| GHSA-j84w-jfhq-vhvj | Los manejadores de protocolo File y HTTP permiten lecturas cross-origin sin `corsEnabled` | 7,4 |
| GHSA-9qh4-3jw8-366w | Un `<webview>` puede activar Node.js en Web Workers pese a las restricciones de quien lo incrusta | 8,3 |

**El que pega en esta app es GHSA-j84w-jfhq-vhvj.** El renderer carga por
`file://` y el fuse `GrantFileProtocolExtraPrivileges` está activado a propósito
(`electron-builder.yml`, repuesto en `20bd2bf` tras la pantalla negra). Las
mitigaciones que ya había (popups negados en `main-window.ts`, `contextIsolation`,
CSP) acotan los otros tres, pero no curan ninguno.

De paso, Electron 44 deja de depender de `extract-zip` (lo sustituye por
`@electron-internal/extract-zip`), y con él salen dos HIGH propios:

- GHSA-jmr9-qjv8-65gv — path traversal por symlink sin validar.
- GHSA-7pqw-9j4j-h8q3 — escritura arbitraria de ficheros por entradas symlink.

Resultado medido: los HIGH de `npm audit` bajan de **8 a 6**, y en el árbol con
44.5.1 Electron no tiene ningún aviso. Los seis que quedan (`@xmldom/xmldom`,
`brace-expansion`, `fast-uri`, `http-cache-semantics`, `js-yaml`, `undici`) son
la pieza A de ADR-111 y van aparte.

## 3. Por qué la 44 y no otra: elección, no obligación

El rango vulnerable de Electron que da `npm audit` es
`<=41.10.5 || 42.0.0-alpha.1 - 42.3.3 || 43.0.0-alpha.1 - 43.0.0-beta.8`. Los
cuatro avisos ya están corregidos en **41.10.6, 42.3.4 y 43.0.0**. Con la 44 como
versión actual, las ramas con soporte son la 42, la 43 y la 44, así que una
42.3.4+ o una 43.x **también** habrían curado los cuatro.

La 44.5.1 se **elige** por dos razones:

1. **Margen de soporte:** es la rama más reciente, la que más tarda en salir de
   la ventana de los tres últimos majors.
2. **La limpieza de `extract-zip`:** medida en la 44. No está medido si la 42 o
   la 43 también se libran de ese paquete.

Queda escrito así para que una revisión futura no la lea como forzada: si la 44
diera problemas de runtime, la 42.3.4+ es una salida válida en seguridad.

## 4. Lo que el gate no prueba (Principio 25)

El gate (`npm ci` con `better-sqlite3` recompilado para el ABI de Electron 44,
typecheck, lint, tests, build, migración) valida el código, **no arranca la app**.
Un salto de cinco majors cambia el runtime, así que el binario solo se confía con
el smoke del operador, más ancho que el habitual: que pinte la ventana, que
**abra la base** (el módulo nativo va compilado para el ABI nuevo), y que carguen
Motor y Firma. El binario anterior (`f8250f61`) queda guardado aparte como
rollback de un minuto.

**Fuses.** Leídos en los binarios de Electron 39.8.10 y 44.5.1: los ocho fuses
conocidos tienen los mismos valores por defecto en las dos versiones. Electron 44
trae un **noveno fuse** que `@electron/fuses` 1.8.0 no sabe nombrar; no lo
configuramos, así que queda en su valor por defecto. Es una deuda de visibilidad,
no un cambio de comportamiento: hoy no podemos leer ese fuse por su nombre.
