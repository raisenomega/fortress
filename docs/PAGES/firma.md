# Firma

**Vista interna:** `firma` · **Componente:** `FirmaView` · **Acceso:** el chip
«Firma: N» de la barra superior.

La cola de propuestas que esperan un acto del operador, en su propia página.
Firmar es lo único que integra: ni el escaneo ni el motor mueven el árbol vivo.

## Qué lista

Las propuestas en `GATE` u `OMEGA`, agrupadas **por fichero** antes que por
fecha —firmar dos fixes del mismo sitio seguidos deja al operador con un solo
contexto en la cabeza— y dentro de cada fichero, la más vieja primero.

Estas dos listas viven en ficheros distintos (`cola-de-firma.ts` y
`acto-de-firmar.ts`) y **tienen que coincidir**: si se separan, la página
mostraría filas que no se pueden firmar o escondería una que sí. Hay un test que
las obliga.

## La fila

Es la **misma** fila del Motor (`RepairProposalRow`), no una parecida: chevron
que despliega, razón del análisis, libro de vida completo, y su propio botón.
Cada propuesta se resuelve sola, en el orden que el operador quiera.

En reposo la fila es **una línea**. La razón del análisis ronda los mil
caracteres y viaja dentro del desplegable; pintada siempre, veinte propuestas no
cabían en pantalla.

**Diez por página.** Los controles de paginación no se pintan si hay una sola.

## El botón: dos actos, dos nombres

| estado | botón | qué hace |
|---|---|---|
| `GATE` | **Pedir revisión** | corre el revisor. **No integra nada todavía** |
| `OMEGA` | **Firmar** | integra el fix al repo |

Se llamaron los dos «Firmar» durante un tiempo, con el argumento de que para el
operador es la misma decisión. El argumento no aguanta: solo uno de los dos toca
el árbol vivo, y un nombre común entrena a pulsar sin mirar el estado — lo
contrario de para lo que existe la firma.

Firmar cambia el estado, la propuesta sale de la cola **por sí misma** y la
relectura del expediente trae la siguiente. No hay ninguna lista que se manipule
a mano.

## El chip

«Firma: N» aparece en la barra superior **solo si hay algo esperando**. No es el
mismo número que el antiguo «Pendientes: N» del motor: aquel contaba toda
propuesta viva, incluidas las que se están analizando o generando, y ninguna de
esas se puede firmar.

## Referencias

- [FLOWS/SELF-REPAIR](../FLOWS/SELF-REPAIR.md) — de dónde salen las propuestas.
- [motor.md](motor.md) — el expediente completo, con las que aún no esperan firma.
- [ADR-024](../DECISIONS/adr-024-estado-omega-esperando-firma.md) — por qué
  existe un estado que espera firma.
