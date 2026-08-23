# Taxonomía de defectos

El **vocabulario cerrado** de tipos con el que el escáner clasifica cada
hallazgo. Es la pieza que hace estable la identidad de un hallazgo entre
escaneos — ver [ADR-067](DECISIONS/adr-067-identidad-fichero-tipo-simbolo.md).

Fuente de verdad en código: `src/domain/scan/tipo-de-defecto.ts`. El contrato
del escáner (`src/domain/scan/report-contract.ts`) enumera esta lista en el
prompt, así que **añadir un tipo es cambiar el contrato**.

## Por qué cerrado

El escáner **elige**, no redacta. Un identificador en abierto reproduciría el
problema un nivel más abajo: el modelo inventaría slugs distintos igual que
inventa títulos. Una lista enumerada convierte la tarea en clasificación, que un
modelo hace con consistencia mucho mayor que la redacción libre.

## Cómo se derivó

No es una lista genérica de seguridad. Salió de agrupar los **34 defectos
reales** del propio repositorio (45 filas en la base) por defecto verdadero, y
cada tipo existe porque había al menos uno que lo pedía. Los que aparecen una
sola vez se conservan a propósito: son clases que pueden repetirse, y mandarlas
a `otro` habría escondido justo lo que distinguen.

## Los tipos

| tipo | qué es |
|---|---|
| `missing-trust-check` | Código del repo auditado corriendo sin exigir `project.trusted`. |
| `missing-run-guard` | Una corrida de agente que no pasa por `guardRun`: evade tope diario y carril de concurrencia. |
| `path-traversal` | Ruta que admite `..` o absolutos: lectura, listado o escritura fuera de lo permitido. Incluye symlinks sin resolver. |
| `secret-in-env` | Se hereda el entorno del operador —API key, keyring, `SSH_AUTH_SOCK`— a código ajeno. |
| `secret-in-argv` | Un secreto viaja en `argv` y queda visible en `ps`. Otro canal, otro fix. |
| `secreto-sin-redactar` | Algo con secretos se persiste o se muestra sin pasar por `redactSecrets`. |
| `mcp-no-acotado` | El `.mcp.json` del repo auditado entra sin acotar y puede suplantar un servidor. |
| `allowlist-permisiva` | Una allowlist de tools que readmite lo que decía excluir. |
| `ssrf-ipv6-mapped` | El filtro anti-SSRF no cubre IPv4 mapeada en IPv6. |
| `ssrf-ipv4-formatos` | El filtro anti-SSRF no cubre IPv4 en decimal, hexadecimal u octal. |
| `ssrf-capa-no-alcanzada` | Una capa anti-SSRF existe pero nunca llega a ejecutarse. |
| `doc-contradice-codigo` | La documentación o un comentario afirman una garantía que el código no da. |
| `tope-no-consultado` | Se gasta sin consultar el tope que gobierna ese gasto. |
| `validacion-asimetrica` | Se valida al leer pero no al escribir (o al revés). |
| `alcance-de-proyecto-ignorado` | Una operación por proyecto que alcanza a todos. |
| `otro` | Lo genuinamente inclasificable. |

## Las separaciones deliberadas

Tres pares se mantienen separados **porque fundirlos escondía un defecto detrás
de otro**, que es el modo de fallo que la identidad estable existe para evitar:

- **`ssrf-ipv6-mapped` / `ssrf-ipv4-formatos`** — dos vectores de evasión
  distintos que comparten fichero y símbolo. Solo el tipo los separa.
- **`secret-in-env` / `secret-in-argv`** — canales distintos y fixes distintos.
- **`missing-run-guard` en `handleVerify` vs `handleAb`** — mismo tipo, mismo
  fichero; los separa el símbolo.

Y una fusión: `symlink-no-resuelto` vive dentro de `path-traversal` por ser la
misma clase de defecto.

## La regla de `otro`

`otro` es un **destino legítimo**, no un fallo: forzar un tipo que no es sería
peor. Pero su uso frecuente es la señal de que **falta un tipo**.

> Si `otro` supera aproximadamente el **15%** de los hallazgos de un escaneo,
> revisar el vocabulario.

Los productores deterministas (`audit-rules` para dependencias vulnerables,
`maintainability-probe` para archivos largos y deuda TODO) no clasifican y caen
a `otro`. Es honesto: nadie los ha tipado. Su identidad `fichero │ otro │ ''`
resulta estable igual, una fila por archivo.

## Referencias

- [ADR-067](DECISIONS/adr-067-identidad-fichero-tipo-simbolo.md) — por qué la
  identidad cambió y qué medía la fórmula vieja.
- [FLOWS/SCAN](FLOWS/SCAN.md) — dónde encaja en el flujo del escaneo.
- [DATA-MODEL](DATA-MODEL.md) — las columnas `tipo` y `simbolo`.
