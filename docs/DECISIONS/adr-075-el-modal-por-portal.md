# ADR-075: `Modal` se monta en `document.body` por portal, no donde se declara

- **Fecha:** 2026-08-28
- **Estado:** Aceptada
- **Área:** UI

## Contexto

`Modal` cubría la pantalla con un `div` en `position: fixed` y se renderizaba
donde el componente que lo abría lo declarase. Funcionó durante doce
componentes, porque los doce colgaban de contenedores normales.

Al arreglar el botón de mitigar, su diálogo nació **dentro de una `<table>`**:
la fila del Escaneo es un `<tr>`, y el botón vive en un `<td>`. Es el primero de
FORTRESS que lo hace.

El resultado se vio en la captura de la aplicación real: el título del hallazgo
empujado fuera de la caja, la etiqueta del campo pegada al `input` en vez de
encima, y el párrafo explicativo saliéndose por el borde derecho de la pantalla.
`position: fixed` no basta cuando la maquetación de tabla alcanza al hijo.

## Decisión

`Modal` se monta en `document.body` con `createPortal`.

Un solo cambio en el componente compartido, y vale para los **doce**
consumidores y para cualquier contenedor incómodo que venga después. El portal
saca el diálogo del árbol donde se declara sin cambiar dónde se declara: la API
del componente no se toca.

## El precedente

No es un patrón nuevo en este repositorio. `BreakdownPopover` ya lo hacía, y su
documentación dice por qué en los mismos términos:

> *Popover FLOTANTE: se renderiza en document.body (portal) con position:fixed,
> así no reflota la tarjeta ni el header (overflow-x-auto lo recortaría).*

Mismo problema —un contenedor que alcanza a un hijo que se creía fuera de su
alcance— y mismo remedio. Lo que faltaba era aplicarlo donde ya hacía falta.

## Alternativas descartadas

**Sacar el diálogo de la tabla** subiendo su estado a `FindingsTable` o a
`ScanView`. Funciona, cuesta más fontanería —la fila tendría que decirle a la
tabla qué hallazgo marcar— y **deja la trampa en pie** para el siguiente que
monte un modal dentro de un contenedor con maquetación propia.

**Dejarlo y maquetar alrededor.** Habría escondido el síntoma en un componente
sin arreglar la causa, y la causa es del `Modal`, no del contenido.

## La lección: el gate no ve un layout que desborda

Esto es lo que hace que la decisión merezca un registro y no un comentario.

Cuando el modal estaba roto, **el typecheck estaba verde y el check de
integración también** — ese check prueba el canal `scan:mitigate` por el stack
real y pasaba sus ocho comprobaciones con el diálogo ilegible en pantalla. Ni el
lint, ni las 1748 pruebas unitarias, ni el smoke lo vieron.

Lo vio una captura de la aplicación real, y solo porque se tomó. El gate de este
proyecto verifica que el código compila, que respeta sus reglas y que sus
canales hacen lo que dicen; **no verifica que lo que se pinta se pueda leer**.
Para eso, mirar la pantalla no es una cortesía: es el único instrumento que
existe.

Es la misma lección que el propio botón de mitigar enseñó ese día por el otro
lado —un `onClick` que ningún gate veía— cobrada dos veces en la misma tarea.

## Consecuencias

- Los doce modales se montan fuera de su árbol. Verificado que no se rompió
  ninguno: `ConfirmRetirada` mide sus 512 px con cero hijos fuera de la caja, y
  el recorrido de las siete pantallas sigue en verde.
- Un modal puede declararse desde cualquier sitio —una celda, una lista, un
  contenedor con `overflow` recortado— sin que su contenedor lo maquete.
- Sigue sin cerrarse con Escape: `Modal` no escucha el teclado, y ninguno de los
  doce lo hace. Es deuda conocida del componente, ajena a esta decisión.

## Referencias

- `5fbc872` — el portal, el modal de mitigar y el check de integración que le
  faltaba al canal.
- `src/presentation/components/dashboard/BreakdownPopover.tsx` — el precedente.
