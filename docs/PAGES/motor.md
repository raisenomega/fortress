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

## El chip «Motor: detenido»

Solo aparece cuando el proyecto está **contaminado** y `guardRun` bloquea todo
hasta que alguien lo revise. Sano no pinta nada: un indicador permanente que
casi siempre dice «todo bien» enseña a no mirarlo, y el día que cambia nadie lo
ve.

Contó propuestas vivas («Pendientes: N») hasta el 2026-08-23. Se retiró porque
en reposo ese número es idéntico al del chip de Firma —toda propuesta viva es
una que espera al operador— y dos cifras iguales al lado se leen como dos cosas
distintas que no lo son.

## Referencias

- [FLOWS/SELF-REPAIR](../FLOWS/SELF-REPAIR.md) — la cadena entera, eslabón a eslabón.
- [firma.md](firma.md) — donde se firma.
- [ADR-061](../DECISIONS/adr-061-modo-autonomo-con-la-disciplina-del-motor.md) — el modo por fases.
