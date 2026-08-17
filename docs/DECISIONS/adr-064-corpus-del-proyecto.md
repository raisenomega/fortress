# ADR-064: El corpus del proyecto se descubre, y el prompt calla si no lo hay

**Estado:** Aceptada
**Fecha:** 2026-08-17
**Autor:** operador (registro anterior al cambio que lo aplica)

## Contexto

Cada agente recibe, dentro de su prompt, un bloque que le dice dónde vive la
doctrina del proyecto y cómo pedirla. Es lo que evita que decida sin leer lo que
ya está firmado: sin ese bloque, los documentos están indexados pero el agente
no sabe que existen.

Ese bloque está escrito a mano con el corpus de FORTRESS dentro. Nombra
`docs/PRINCIPLES.md`, cuenta cuántos flujos hay en `docs/FLOWS/`, cita dos
principios por su número. Cuando la herramienta trabaja sobre otro proyecto, el
bloque se inyecta igual, palabra por palabra.

El defecto no es que falte información: es que el prompt **afirma como hecho la
existencia de ficheros del auditor dentro del auditado**. El agente busca lo que
el prompt da por cierto, no lo encuentra, y responde sin evidencia. No hay error,
no hay traza, no hay señal. El sistema le miente a su propio agente sobre el
proyecto que audita, y el agente actúa sobre esa mentira sin poder detectarla.

Y la forma del corpus no es universal. De los tres proyectos reales que se
inventariaron antes de esta decisión, los tres tienen doctrina escrita y ninguno
la guarda donde el bloque afirma: uno la tiene en una carpeta con otro nombre,
los otros dos en documentos sueltos en la raíz. Una generalización que conserve
la convención fija —`docs/` más nombres canónicos— acierta en cero de ellos.

Eso cambia la naturaleza del trabajo. No es parametrizar lo que hay: es sustituir
una convención supuesta por un mecanismo que mire.

## Alternativas consideradas

- **Descubrimiento puro** — la herramienta barre el disco buscando convenciones
  conocidas y el proyecto no declara nada. Descartada: un proyecto que guarde su
  doctrina donde ninguna convención la busca queda mudo para siempre, sin forma
  de decir dónde está.
- **Declaración pura** — cada proyecto declara su corpus en su configuración y,
  sin declaración, no hay corpus. Descartada por dos razones: obliga a tocar
  todos los proyectos existentes antes de que el mecanismo sirva de algo, y hace
  que el prompt cite lo declarado en vez de lo que existe. En cuanto un documento
  se mueve o se borra, la declaración miente igual que miente hoy la convención
  fija; el problema cambiaría de sitio, no desaparecería.
- **Híbrido: descubrir primero, declarar por encima** — escogida. Lo que hay en
  disco es el hecho, y es lo que se cita por defecto; la declaración existe para
  el proyecto cuya doctrina ninguna convención encuentra.

## Decisión

**Primera — la infraestructura descubre.** Busca en el proyecto las convenciones
conocidas de corpus y produce un descriptor: qué documentos hay y en qué ruta
relativa. Qué convenciones se barren, y con qué precedencia si más de una
acierta, se firma con su propio inventario antes de escribir el descubridor.

**Segunda — el proyecto puede declarar, y su declaración manda.** Un proyecto
que guarde su doctrina fuera de toda convención la enumera en su
`.fortress/config`, el mismo sitio donde ya declara su política de integración.
Lo declarado sustituye a lo descubierto; sin declaración, vale lo descubierto.

**Tercera — con descriptor vacío, el bloque no se escribe.** Si ni el
descubrimiento ni la declaración encuentran corpus, el prompt no lleva referencia
documental. Es el mismo criterio que esta casa ya aplicó al indicador del
proyecto activo: callar es honesto, y afirmar lo que no se ha comprobado no lo
es. Un bloque ausente le cuesta al agente una lectura que no habría dado fruto;
un bloque falso le cuesta la confianza en todo el prompt.

**Cuarta — el dominio recibe el descriptor ya resuelto.** El descubrimiento toca
disco y por tanto vive en infraestructura; el dominio compone la prosa del bloque
a partir del descriptor que recibe, sin saber cómo se obtuvo. La regla de
dependencias hacia adentro se mantiene intacta, y cada capa se prueba por lo
suyo: el dominio con descriptores sintéticos, el descubridor contra directorios
reales.

**Quinta — FORTRESS pasa por el mismo mecanismo.** Su descriptor lo produce el
descubridor real, no una lista escrita a mano. Cumple la convención que el
descubridor busca, así que se encuentra a sí misma como encontraría a cualquier
otro; y su prompt pasa a reflejar el estado de sus documentos en vez de una
fotografía que envejece. Se pierde con ello la precisión de los conteos y los
principios citados por número. Si esa pérdida resulta ser real —agentes que
deciden peor sin ella—, el descubridor se refina con esa evidencia; conservarla
a mano por si acaso sería diseñar contra una sospecha.

**Sexta — el alcance son los cinco puntos donde hoy se inyecta la referencia**:
el prompt de conversación, el de escaneo, el de paso de workflow, el del catálogo
de agentes y el prompt de sistema del proyecto activo. Los prompts del motor de
reparación quedan fuera: hoy no reciben referencia documental de ninguna clase
—ni la propia— y darles una es alcance distinto, con su propia firma, no un
efecto colateral de esta decisión.

**Y una decisión que se aplaza a propósito.** El bloque no es único: hay una
variante para quien juzga lo que se protege, otra para quien decide dónde va un
cambio, y una general para el resto. Ese eje está definido contra documentos
concretos de FORTRESS, y si sobrevive a la generalización —o se colapsa, o se
deriva de lo que el descriptor traiga— no se puede firmar por inferencia. Se
firma cuando el descubridor exista y se vea qué produce sobre proyectos reales.

## Consecuencias

### Positivas

- El prompt deja de afirmar hechos falsos sobre el proyecto activo. Con corpus,
  cita rutas que existen; sin corpus, no cita nada.
- Los proyectos con doctrina propia dejan de ser invisibles para los agentes que
  trabajan sobre ellos, que era el trabajo que esta decisión habilita.
- El corpus de FORTRESS y el prompt que lo nombra dejan de poder divergir: mover
  un documento cambia el prompt sin que nadie tenga que acordarse.

### Negativas

- Dos de los cinco puntos de inyección no reciben hoy ningún dato del proyecto;
  cablearlos exige ampliar sus firmas y las de quien los llama.
- Las pruebas actuales de la referencia documental fijan tres textos por
  identidad. Al componerse a partir del descriptor, dejan de tener texto fijo que
  fijar: se replantean sobre descriptores sintéticos y comportamiento.
- Aparece infraestructura nueva —el descubridor— con superficie propia que
  mantener, y un formato de declaración que documentar para quien lo use.

### Neutras

- La decisión no cambia qué documentos son doctrina: solo cómo se averigua dónde
  están y qué se dice cuando no hay ninguno.
- Salir de la convención fija amplía a qué proyectos se les cita su doctrina, no
  qué puede hacer un agente con ella. Los permisos, la confianza por proyecto y
  el modo de operación siguen decidiéndose donde ya se decidían.

## Referencias

- [ADR-003](adr-003-motor-generico-debut-self-repo.md) — el precedente
  estructural: un mecanismo diseñado genérico que estrenó restringido al repo
  propio, y cuya generalización quedó como decisión posterior. La referencia
  documental nació al revés —con el corpus propio dentro del código— y esta
  decisión la lleva al mismo sitio.
- [ADR-031](adr-031-ddd-estricto-dependencias-hacia-adentro.md) — las
  dependencias van siempre hacia adentro y el dominio es puro. De ahí que el
  descubrimiento viva en infraestructura y el dominio reciba el descriptor ya
  resuelto.
- [ADR-060](adr-060-auto-merge-loop.md) — `.fortress/config` como sitio donde el
  proyecto declara lo suyo; la declaración de corpus se suma a ese mismo fichero.
- [ADR-063](adr-063-motor-proyecto-activo.md) — el criterio de callar cuando no
  se sabe, firmado allí para el indicador del proyecto activo y aplicado aquí al
  bloque de referencia documental.
