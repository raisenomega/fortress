# ADR-063: El motor sale del repo propio y habla del proyecto activo

**Estado:** Aceptada
**Fecha:** 2026-08-16
**Autor:** operador (registro posterior al cambio que lo aplica)

## Contexto

El motor de auto-reparación se diseñó genérico y se estrenó encerrado. ADR-003
firmó las dos mitades a la vez: el diseño opera sobre cualquier proyecto
registrado, pero el debut se restringe al propio repo, donde cada eslabón se
audita con evidencia y la firma humana es obligatoria. Y dejó escrita, con esas
palabras, la mitad que faltaba: *"La generalización a otros proyectos es decisión
posterior."*

Esa decisión posterior se ha tomado y se ha ejecutado. El motor opera hoy sobre
cualquier proyecto registrado. El encierro no era una política declarada en
ninguna parte: era un anclaje de código —la localización del proyecto propio y
un canal aparte que solo hablaba de él— y se retiró entero, junto con el estado
de interfaz que existía únicamente para servirlo.

Al salir apareció una segunda pregunta que con un solo proyecto no tenía
sentido: cuando el indicador de la barra superior y la vista del motor muestran
un estado, ¿de qué proyecto es ese estado?

Ninguna de las dos quedó registrada. La primera tenía su asiento reservado por
nombre en ADR-003, y el asiento se quedó vacío. La segunda se argumentó solo en
un comentario del componente que la implementa. Este registro las cobra.

## Alternativas consideradas

- **Darla por cubierta en la decisión de integración automática:** descartada.
  Aquel registro decide la política de integración y, de paso, que el estado del
  modo autónomo se muestre en la barra superior con sus cuatro situaciones y que
  el detalle viva en una vista propia. Decide que el indicador exista; no dice de
  qué proyecto habla. Su objeto es la política, y la interfaz aparece como
  consecuencia.
- **Darla por consecuencia natural de una reubicación de interfaz:** descartada,
  y es la alternativa que más se parece a la verdad sin serlo. El anclaje al repo
  propio eran dos líneas, y levantarlas fue barato. Pero lo barato era la
  ejecución, no la decisión: lo que se levantó fue exactamente la restricción que
  ADR-003 aplazó por su nombre.
- **No registrarla, con el argumento de que el código ya lo documenta:**
  descartada. El código lo documenta para quien lo abra. Quien lea ADR-003 dentro
  de un año concluirá que el motor sigue encerrado en el repo propio, y llevará
  razón según el corpus y ninguna según el código.
- **Registrar las dos decisiones en un solo asiento:** escogida. Llegan juntas y
  se sostienen mutuamente: la primera hace que haya varios proyectos de los que
  hablar, y la segunda decide de cuál se habla.

## Decisión

**Primera — el debut termina.** El motor opera sobre cualquier proyecto
registrado. La restricción de ADR-003 se levanta con el historial que ADR-003
pedía: el estreno produjo el espécimen auditado de punta a punta que justificaba
el encierro, y con él el encierro deja de tener objeto. Este registro es
continuación de aquel, no su superación —ADR-003 previó este momento y lo dejó
por escrito—, y por eso aquel permanece Aceptada.

**Segunda — el indicador y la vista son del proyecto activo, y callan si no lo
saben.** Ambos reflejan el estado del motor del proyecto que el operador tiene
delante, no el del proyecto donde nació el último arreglo. Con dos argumentos:

1. Un indicador que ocupa el sitio del proyecto activo y habla de otro se lee
   mal: quien lo ve ahí entiende que habla de este.
2. Mientras las propuestas cargadas no sean las de este proyecto —al cambiar de
   proyecto, o si la lectura falló— no se pinta nada. Callar es honesto; pintar
   por defecto afirmaría un hecho no comprobado.

**Y lo que esto no cambia.** Salir del repo propio amplía dónde puede proponer,
no qué puede integrar autónomamente. La integración automática sigue apagada por
defecto en todos los proyectos; cada uno la declara en su `.fortress/config`, y
la ausencia de esa configuración hereda el default apagado en vez de ser un caso
aparte. Conviene que quede escrito aquí, porque es la pregunta que se hará quien
lea "el motor opera sobre cualquier proyecto".

## Consecuencias

### Positivas
- El cabo que ADR-003 dejó suelto queda atado. La reserva *"decisión posterior"*
  ya no apunta al vacío.
- El operador ve el estado del motor del proyecto que está mirando, sin tener que
  deducir de cuál le habla la barra.
- El argumento del silencio deja de vivir en un comentario y pasa a ser decisión
  consultable: quien vea el indicador en blanco sabrá que es deliberado y por
  qué.

### Negativas
- El motor puede proponer arreglos sobre código ajeno, donde un fallo cuesta más
  que en el repo propio. Lo que lo contiene ya no es el encierro: son la copia
  aislada, la batería mecánica, el revisor y la firma humana.
- El indicador en blanco es ambiguo para quien no conozca la regla: no distingue
  "aún no he mirado" de "no hay nada pendiente". Se aceptó a cambio de no afirmar
  de más.

### Neutras
- Los proyectos sin motor configurado no ven ningún cambio: el motor propone
  cuando se le pide, y la integración automática sigue donde estaba.
- Que el indicador y la vista compartan la misma fuente de proyecto no es un
  detalle de implementación: es lo que hace que los dos digan lo mismo.

## Referencias

- [ADR-003](adr-003-motor-generico-debut-self-repo.md) — el debut restringido y
  la reserva explícita que este registro cobra.
- [ADR-060](adr-060-auto-merge-loop.md) — la política de integración automática
  que sigue apagada por defecto, y la decisión de que el estado del modo autónomo
  se muestre en la barra superior.
- [FLOWS/SELF-REPAIR](../FLOWS/SELF-REPAIR.md) — la cadena que ahora corre sobre
  cualquier proyecto registrado.
