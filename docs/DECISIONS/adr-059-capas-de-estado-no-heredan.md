# ADR-059: Ninguna capa hereda estado de otra por proximidad conceptual

**Estado:** Aceptada
**Fecha:** 2026-08-13
**Autor:** operador

## Contexto

El sistema guarda estado en varios sitios a la vez. La base de datos registra
las propuestas de reparación y los hallazgos; el sistema de archivos guarda los
worktrees donde el motor genera los fixes; el control de versiones guarda lo que
realmente acabó en la rama principal; y el empaquetador decide qué viaja en el
instalable. Cada uno responde una pregunta distinta y ninguno consulta a los
demás.

Es fácil suponer que dos capas que hablan del mismo concepto se mantienen
alineadas solas, porque conceptualmente están cerca. No lo hacen. En una misma
jornada de trabajo aparecieron cuatro casos del mismo defecto, en cuatro
superficies distintas:

**El empaquetado y el control de versiones.** Un archivo excluido del
repositorio seguía viajando dentro del instalable, porque la exclusión del
empaquetador nombraba una carpeta que se había renombrado tiempo atrás. Es el
caso que ya quedó firmado por separado en [ADR-058](adr-058-capas-de-exclusion-explicitas.md).

**La cola de candidatos y las propuestas vivas.** La selección determinista
(C1) elige entre los hallazgos activos y abiertos, descontando los que un
análisis declaró obsoletos bajo el escaneo vigente. No descuenta los que ya
tienen una propuesta en curso. Como la selección es determinista por diseño
—mismo expediente, mismo elegido—, un hallazgo cuya propuesta espera la firma
humana vuelve a salir elegido en cada nueva ronda. El efecto observado fueron
varias propuestas consecutivas para el mismo hallazgo, cada una con su coste de
análisis y generación, sin que ninguna avanzara.

**La base de datos y el sistema de archivos.** La reconciliación al arrancar
recorre los worktrees existentes y los contrasta contra su propuesta: si no hay
propuesta, borra el directorio; si la propuesta está en un estado terminal,
retira el worktree. Recorre el sistema de archivos, no la base. Un worktree
retirado a mano deja su propuesta viva en la base sin respaldo físico, y nada
lo detecta: la comprobación mira el lado que ya no tiene la fila.

**El veredicto del revisor y el merge real.** El tipo de estado de una
propuesta incluye `APROBADO` y `MERGEADO`, y la tabla de transiciones los
admite desde `OMEGA`. Ningún código los escribe, y los canales de comunicación
entre procesos no exponen aprobar ni rechazar. Una propuesta aprobada por el
revisor se queda en `OMEGA` indefinidamente, tanto si su fix llegó a la rama
principal como si se descartó. El estado de la base no distingue esos dos
desenlaces.

Las cuatro son el mismo defecto: dos capas guardan estado sobre el mismo
concepto y ninguna reconcilia con la otra.

## Alternativas consideradas

- **Sincronizar las capas automáticamente:** descartada — reintroduce el
  problema con otra forma. Una pieza que sincroniza es una capa más que
  confía en otra sin declararlo, y cuando queda obsoleta falla en silencio,
  que es exactamente cómo falló el patrón huérfano del empaquetador. El
  problema no es que falte sincronización: es que falta contrato explícito.
- **Colapsar todo en una fuente única de verdad:** descartada — las capas
  existen porque responden preguntas distintas con costes distintos. La base
  contesta consultas transaccionales, el sistema de archivos guarda
  artefactos de trabajo, el control de versiones guarda la historia. Fundirlas
  destruye una separación que es legítima y no arregla el acoplamiento.
- **Registrarlo como observación sin fijar doctrina:** descartada — cuatro
  manifestaciones en cuatro superficies distintas, en una sola jornada, no son
  un incidente aislado. El proyecto ya tiene la regla de que un principio nace
  de varias manifestaciones firmadas y no de una sola; aquí la evidencia
  sobra.

## Decisión

Ninguna capa hereda estado de otra por proximidad conceptual. Cuando dos capas
mantienen estado sobre el mismo concepto, cada una declara su propia consulta o
su propio filtro, explícito y completo. Ninguna da por hecho que otra la cubre.
Reconciliar dos capas es trabajo de código escrito para eso, no una propiedad
que emerja de que ambas hablen de lo mismo.

Como consecuencia operativa: toda superficie que ofrezca una acción sobre un
estado —interfaz, canal entre procesos, línea de comandos— verifica la
coherencia de las capas que esa acción involucra ANTES de ofrecerla. Ofrecer
una acción cuya precondición no se ha comprobado es romper el contrato en
silencio.

Queda registrado como principio 20 en [PRINCIPLES](../PRINCIPLES.md).

## Aplicaciones previstas

- **Inmediata:** que la selección descuente los hallazgos con propuesta viva en
  un estado no terminal. Cierra el segundo caso.
- **Siguiente:** que la reconciliación al arrancar recorra también las
  propuestas, y no solo los worktrees, para detectar las que quedaron sin
  respaldo en disco. Cierra el tercer caso.
- **Mayor:** un camino explícito para aprobar o rechazar una propuesta desde la
  aplicación, que mueva el estado en la base y refleje si el fix llegó a la
  rama principal. Cierra el cuarto caso, y es la pieza que
  [ROADMAP](../ROADMAP.md) ya recoge como cierre e integración del motor.

El primer caso quedó cerrado por ADR-058, que precede a este principio y lo
motivó.

## Consecuencias

### Positivas
- Cualquier capa nueva llega con la obligación de declarar cómo reconcilia con
  las que ya existen, en vez de heredar el problema.
- Cuatro deudas que parecían inconexas pasan a tener un marco común de
  análisis: se atacan con el mismo criterio aunque cada una lleve su propio
  registro.
- Da un punto de verificación concreto en la revisión de cambios: si un cambio
  introduce una capa que guarda estado ya guardado en otro sitio, la pregunta
  está formulada de antemano.

### Negativas
- Aplicar el principio a lo ya construido cuesta cuatro correcciones, cada una
  con su propio alcance. La deuda existía antes de nombrarla; el principio la
  vuelve visible y exige atenderla en vez de convivir con ella.
- Declarar filtros explícitos en cada capa produce código aparentemente
  redundante: dos sitios que comprueban cosas parecidas. Es el precio de que
  ninguno dependa del otro.

### Neutras
- El principio no obliga a fusionar capas ni a reducir su número. Solo exige
  que la relación entre ellas esté escrita. Dos capas separadas con
  reconciliación declarada cumplen igual que una sola.
- La forma de reconciliar puede ser distinta en cada superficie —una guarda en
  la interfaz, un filtro en el canal, una comprobación al arrancar—. El
  principio fija la obligación, no la implementación.
- Es el mismo criterio que el proyecto ya aplica a las capas de defensa y a las
  de exclusión: cada una se declara y se prueba por separado, sin dar por hecho
  que otra la cubre.

## Referencias

- [ADR-058](adr-058-capas-de-exclusion-explicitas.md) — la primera
  manifestación firmada, anterior al principio y origen de la generalización.
- [PRINCIPLES](../PRINCIPLES.md) — principio 20 (enunciado canónico), 3 (probar
  cada capa por separado), 12 (los estados terminales no se re-abren) y 17
  (estado presente frente a estado de diseño).
- [FLOWS/SELF-REPAIR](../FLOWS/SELF-REPAIR.md) — el flujo donde se concentran
  tres de las cuatro manifestaciones.
- [CONTRIBUTING](../CONTRIBUTING.md) — la regla de registrar la decisión antes
  de escribir el código, que se aplicó también aquí.
