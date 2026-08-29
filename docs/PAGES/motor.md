# Motor de reparación

**Vista interna:** `motor` · **Componente:** `MotorView` · **Acceso:** el chip
«Motor: detenido» de la barra, o la navegación lateral.

El expediente completo de propuestas del proyecto activo: todas, en cualquier
estado, con su libro de vida. La página de [Firma](firma.md) es un subconjunto
—solo lo firmable—; esta es el archivo.

## Las dos formas de poner el motor a trabajar

**Proponer reparación** hace UNA vuelta: elige un hallazgo, lo entiende, y para.

**Drenar los elegibles** las hace todas: recorre los hallazgos que pueden
aspirar al cerco y deja cada fix juzgado esperando firma, sin escribir al chat y
sin tocar el árbol vivo. Ninguna de las dos integra nada.

### La confirmación antes de drenar

Drenar cuesta dinero y minutos, así que se pregunta antes. El diálogo dice:

- cuántos hallazgos trabajará — el número **real**, del mismo cálculo que usa la
  selección, no una estimación;
- el reparto del cerco (cuántos puede trabajar, cuántos podrían integrarse
  solos, cuántos son defensas del propio motor que no toca nadie);
- los topes de gasto y de vueltas, **leídos al abrir** el diálogo y no al montar
  el panel: son ajustes que se cambian en otra pestaña;
- la garantía de que nada se integra sin firma;
- el aviso de **drenar, parar y firmar**. Firmar a mitad mueve el HEAD y deja
  las propuestas en vuelo ancladas a la base anterior: si su merge choca,
  caducan sin reintento.

Con cero elegibles no se abre el diálogo: se dice que no hay nada que drenar.

## Mientras drena

Una línea en vivo cuenta lo hecho y lo que queda. El medidor de gasto del pie
también se mueve: el motor avisa tras cada corrida, igual que el chat y el
escaneo.

## Las filas

Una por propuesta, ordenadas por última actividad, **paginadas de diez**. Cada
fila es una línea que se despliega para ver la razón del análisis y el libro de
vida entero, con el botón que corresponda a su estado.

Los botones deciden solos si les toca aparecer, así que una fila lleva como
mucho dos: el que la **hace avanzar** —generar, pedir revisión, firmar, o
reintentar si el rechazo lo admite— y el que la **retira**.

### Retirar

Aparece en cualquier propuesta **no terminal**, y es su única salida que no
consiste en avanzar. Hasta que existió, una propuesta que no se pudiera firmar
ni reintentar se quedaba viva para siempre — y con ella su hallazgo fuera de la
cola, porque uno con propuesta viva no se re-elige.

Pregunta antes de hacerlo, porque es irreversible y tiene dos consecuencias que
no se deducen del botón:

- **el hallazgo vuelve a la cola de reparación.** Retirar un intento no dice
  nada del defecto que lo motivó. Quien retira porque el problema ya está
  cubierto espera lo contrario, y para eso el sitio es el [Escaneo](escaneo.md).
- **queda asentado** en el Libro de la Vida con el motivo que se escriba, y de
  ahí no se borra.

El motivo es un campo opcional del diálogo. Si no se escribe, el asiento lo dice
en vez de inventar una justificación que nadie dio. La propuesta queda CADUCADA
y sale sola del expediente y de la cola de firma. Ver
[ADR-072](../DECISIONS/adr-072-caducado-no-miente.md).

## El chip «Motor: detenido»

Solo aparece cuando el proyecto está **contaminado** y `guardRun` bloquea todo
hasta que alguien lo revise. Sano no pinta nada: un indicador permanente que
casi siempre dice «todo bien» enseña a no mirarlo, y el día que cambia nadie lo
ve.

Contó propuestas vivas («Pendientes: N») hasta el 2026-08-23. Se retiró porque
en reposo ese número es idéntico al del chip de Firma —toda propuesta viva es
una que espera al operador— y dos cifras iguales al lado se leen como dos cosas
distintas que no lo son.

**El chip lleva a algún sitio.** Pulsarlo abre esta página, y desde el 2026-08-27
la página explica por qué está detenido: un aviso encabeza el expediente con lo
que pasó —una auditoría alteró el proyecto y las capas de restauración no lo
devolvieron byte a byte— y ofrece **Revisar y desbloquear**.

Antes el recorrido terminaba aquí sin decir nada: el operador llegaba siguiendo
el chip y encontraba un panel normal que no hacía nada, con la razón guardada en
una columna que no leía nadie.

El botón abre el **detalle forense** —qué archivos cambiaron, con su hash antes y
después— y solo tras verlo se puede confirmar. Al desbloquear, el proyecto vuelve
a circulación: los agentes corren, la firma y el push dejan de estar frenados, y
el aviso y el chip se apagan solos. La decisión queda asentada. Ver
[SECURITY-MODEL](../SECURITY-MODEL.md), el ciclo de la Capa 4.

## Referencias

- [FLOWS/SELF-REPAIR](../FLOWS/SELF-REPAIR.md) — la cadena entera, eslabón a eslabón.
- [firma.md](firma.md) — donde se firma.
- [ADR-061](../DECISIONS/adr-061-modo-autonomo-con-la-disciplina-del-motor.md) — el modo por fases.
