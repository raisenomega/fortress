# Roadmap

Este documento describe las direcciones próximas de FORTRESS. **No lleva
fechas de compromiso.** El proyecto sigue una disciplina de propone-dispone:
cada incremento se firma cuando está listo y probado en el propio uso, no
cuando un calendario lo dicta. Las áreas listadas aquí están firmadas como
direcciones a trabajar; los detalles de cada una —alternativas, consecuencias y
criterios de éxito— se especifican y registran antes de arrancar.

Las áreas se agrupan en tres tramos, en orden incremental: primero consolidar
lo que ya existe, luego ampliar lo que el sistema sabe hacer, y finalmente
abrir el proyecto al público.

## Consolidación de la plataforma actual

Antes de ampliar, afianzar los cimientos de lo ya construido.

### Sesiones autenticadas

Iniciar sesión con la cuenta del proveedor de IA dentro de la aplicación,
conviviendo con la clave propia —ambas rutas de autenticación siguen siendo
válidas—, con la sesión cifrada localmente y nunca expuesta al proceso de
interfaz. Extiende la doctrina de custodia de credenciales ya establecida (ver
[DECISIONS/](DECISIONS/README.md), ADR-034).

### Cierre e integración del motor

Integrar la firma y el merge del motor de auto-reparación dentro de la
aplicación. Hoy la firma es un merge manual del operador en su terminal, con la
doctrina completa ya definida: verificaciones previas, merge explícito y push
siempre humano. El paso pendiente es llevar ese botón a la interfaz sin cambiar
la doctrina. En el mismo tramo, retirar el loop autónomo antiguo en favor del
motor disciplinado. Ver [HISTORY](HISTORY.md) y
[FLOWS/SELF-REPAIR](FLOWS/SELF-REPAIR.md).

## De auditor a plataforma de desarrollo asistido

FORTRESS nació como auditor y reparador disciplinado. La dirección de fondo es
convertirlo en un entorno de desarrollo asistido completo, siempre con los
mismos frenos: lo reversible avanza con firma por lote, lo de alto impacto pasa
por un espacio de trabajo aislado, un gate y un revisor.

### Modo asistido

Pedirle a FORTRESS desde su interfaz cualquier tarea de desarrollo, no solo la
reparación de un hallazgo. Las tareas de bajo riesgo se firman por lote; las de
alto impacto siguen el mismo patrón que la auto-reparación —generación en un
worktree aislado, gate hermético y revisor OMEGA— antes de cualquier merge.

### Operaciones git desde la interfaz

Ramas, merges asistidos ante conflicto, rebase, y un historial con diffs
navegables, sin salir a la terminal. El bloqueo de push por hallazgos críticos
que ya existe se integra como un caso más de la misma disciplina.

### Depuración interactiva

Sesiones de trabajo prolongadas, persistidas y retomables, donde el humano y un
agente iteran sobre un problema real con el proyecto vivo a la vista: leer
archivos, correr tests, proponer una hipótesis y probarla en un espacio
efímero antes de tocar el árbol.

### Generación de código nuevo

Construir una feature desde una intención humana, no desde un hallazgo de
escaneo: un plan que el humano revisa y aprueba, generación en un worktree, gate
y revisor sobre el resultado —el revisor juzga si el plan se cumplió—, y firma
humana antes del merge. La misma disciplina de la reparación, disparada por
intención.

### Refactorizaciones grandes

Cambios que tocan muchos archivos por diseño. Un análisis previo del alcance
que el humano aprueba antes de que se toque una línea, verificación sobre el
diff completo —no archivo por archivo—, y un merge atómico: o entra todo, o no
entra nada.

## Camino a la publicación

La meta que los dos tramos anteriores hacen posible.

### Release público y distribución

Firma y distribución del binario en las tres plataformas de escritorio, y la
preparación del repositorio para publicarse en abierto. La doctrina de cero
telemetría se mantiene intacta: ningún componente accede al código ni a los
datos del usuario (ver [DECISIONS/](DECISIONS/README.md), ADR-056).

### Documentación operativa e integración con los agentes

Completar la documentación operativa que aún falta y, después, integrar el
corpus documental con los propios agentes, para que lo lean de forma consciente
y el sistema sepa de sí mismo lo que su documentación explica. Los documentos
operativos —guía de contribución, resolución de problemas, proceso de release y
puesta a punto de un entorno de desarrollo (`docs/CONTRIBUTING.md`,
`docs/TROUBLESHOOTING.md`, `docs/RELEASE.md`, `docs/DEV-SETUP.md`)— están por
completar en la fase de documentación operativa.

## Cómo se firma cada dirección

Ninguna de estas áreas se ejecuta por figurar aquí. Cada una se firma
explícitamente antes de arrancar, y los detalles de la decisión —contexto,
alternativas consideradas y consecuencias— se registran como una decisión
arquitectónica en [DECISIONS/](DECISIONS/README.md) en el momento en que se
toma. Este roadmap señala el rumbo; las decisiones lo fijan.

## Referencias

- [HISTORY](HISTORY.md) — de dónde viene el proyecto.
- [CHANGELOG](CHANGELOG.md) — qué ha cambiado hasta ahora.
- [DECISIONS/](DECISIONS/README.md) — las decisiones que sostienen cada
  dirección.
