# ADR-061: El modo autónomo repara con la disciplina del motor

**Estado:** Aceptada
**Fecha:** 2026-08-16
**Autor:** operador

## Contexto

El modo autónomo y el motor de auto-reparación eran dos sistemas separados que
no se hablaban. El motor trabajaba con propuestas: elegía un hallazgo, lo
entendía, generaba el arreglo en una copia aislada del repositorio, lo compilaba
y lo probaba allí, y solo entonces lo sometía al revisor. El modo autónomo, en
cambio, soltaba un agente sobre el árbol de trabajo del operador con permiso de
edición, y su única red era git: un commit de respaldo antes de empezar y un
`reset --hard` si la comprobación de tipos salía en rojo.

Ese modelo tenía dos defectos, y el segundo no se vio hasta que ambos sistemas
empezaron a compartir superficie.

**La ventana de exposición.** Mientras el agente editaba, el árbol del operador
contenía código a medio hacer. Si el agente se colgaba, si el proceso moría, si
alguien miraba el repositorio en ese momento, lo que había era un estado que
nadie había validado. La red de git no eliminaba la ventana: la cerraba después.

**La contradicción con la integración automática.** Desde que la integración
automática existe, el motor puede fusionar un arreglo en la rama viva del
proyecto y dejar constancia de ello con su identificador de commit. La retirada
del modo autónomo hacía `reset --hard` al respaldo anterior, que está por debajo
de esa fusión. El resultado era un libro afirmando que un cambio se integró, con
un identificador que ya no existía en el repositorio. Dos mecanismos operando
sobre la misma superficie con reglas incompatibles: uno integra ahí, el otro
revierte ahí.

No llegó a ocurrir, pero no por defensa alguna: no había ningún proyecto donde
el modo autónomo pudiera correr. La ausencia de daño era circunstancia, no
diseño.

## Alternativas consideradas

- **Conservar el modelo de respaldo y añadirle salvaguardas** —una guarda que
  impidiera revertir por encima de una integración ya asentada, una ventana de
  exposición más corta—: descartada. Mitiga el síntoma sin tocar la causa. Dos
  mecanismos que escriben sobre la misma rama con reglas opuestas siguen siendo
  dos mecanismos con reglas opuestas; cada salvaguarda nueva es una excepción
  más que alguien tendrá que recordar.
- **Sustituir la fase de reparación por la cadena del motor, y retirar la red
  antigua en el mismo cambio:** descartada por su tamaño. Retirar la red obliga
  a rehacer a la vez el juez que la usaba, y eso deja un único cambio grande sin
  posibilidad de revertir por partes.
- **Sustituir primero y retirar después, en pasos revertibles por separado:**
  escogida. Cuesta un intervalo en el que las dos redes conviven, y ese intervalo
  hay que reconocerlo por lo que es —el momento de máxima contradicción— y
  cerrarlo pronto.
- **Conservar el juez por re-medición como red de seguridad adicional:**
  descartada. Ese juez nació cuando la única forma de saber si un arreglo servía
  era volver a medir el proyecto entero, porque un agente editaba sin que nadie
  mirase. Con el arreglo aislado, compilado, probado y revisado antes de tocar
  nada, ese juez mide un árbol que el arreglo todavía no ha tocado: no puede
  concluir nada, y su primera acción —revertir— es justamente la que destruye lo
  que la cadena acaba de integrar.

## Decisión

**El modo autónomo repara llamando a la cadena del motor.** Cada vuelta elige un
hallazgo, lo entiende, genera el arreglo en una copia aislada del repositorio,
instala dependencias y ejecuta allí la comprobación de tipos, el linter y las
pruebas, lo somete al revisor, y solo si la política del proyecto lo permite lo
integra en la rama viva. El árbol de trabajo del operador no se toca hasta ese
último paso.

**No hay red de git en el ciclo.** Ni respaldo previo, ni comprobación posterior,
ni reversión. Un arreglo que rompe algo no llega a salir de su copia aislada, y
lo que no se rompe no necesita quien lo deshaga.

**El tope de trabajo cuenta propuestas cerradas, no vueltas.** Una vuelta que no
encuentra nada que reparar no ha movido el expediente de nadie y no consume
tope.

**El ciclo se detiene por cinco causas, cada una con su nombre.** Dos son frenos
duros de gasto que el operador fija a mano y sin los cuales el modo autónomo no
se puede encender: el gasto acumulado de la sesión y el número de propuestas.
Dos son válvulas de comportamiento con valor por defecto: las denegaciones
seguidas de la política, y las vueltas seguidas sin candidato que se toleran
antes de dar la baraja por agotada. La quinta es el éxito: tres mediciones
consecutivas con puntuación máxima.

**La medición se espacia por integraciones.** Entre dos integraciones el árbol es
idéntico, así que volver a medirlo sería pagar por leer lo mismo. Solo una
integración acerca el momento de volver a medir; las propuestas que quedan
esperando firma o se descartan no lo adelantan.

**El agente que estudia un hallazgo anota lo que le faltó.** Si durante el
análisis se topó con un límite de la herramienta —algo que no pudo hacer, un
permiso que le cortó, una capacidad que le habría ayudado—, lo devuelve como una
clave más de su análisis y queda asentado en el registro de auto-mejora, con el
proyecto donde surgió. Se guarda aunque el hallazgo resulte ser un fantasma: el
límite con el que se topó es igual de cierto.

## Consecuencias

### Positivas
- El árbol de trabajo del operador deja de ser la mesa de trabajo del agente.
  Nada a medio hacer lo toca en ningún momento.
- El libro deja de poder afirmar una integración que el propio sistema deshizo
  después. Las dos reglas incompatibles ya no comparten superficie.
- Cada parada del ciclo dice por qué, y las cinco razones tienen emisor. No queda
  ninguna forma de detenerse sin nombre.
- El registro de auto-mejora vuelve a tener quien lo alimente. La vista que lo
  muestra llevaba tiempo esperando datos que ya no llegaban.

### Negativas
- Cada vuelta cuesta más que antes: instalar dependencias y ejecutar la batería
  completa en una copia aislada no es gratis. A cambio, el gasto de volver a
  medir el proyecto baja al espaciarse.
- Un proyecto que nunca integra —porque la integración automática nace apagada—
  acumula propuestas esperando firma hasta agotar su baraja de candidatos. La
  válvula de vueltas en vacío existe precisamente para que eso termine solo.
- El operador tiene tres ajustes más que entender, aunque los tres traigan valor
  por defecto y ninguno impida encender el modo autónomo.

### Neutras
- Las dos válvulas admiten el cero, y el cero significa lo que significa: cero
  denegaciones toleradas detiene el ciclo en la primera, y cero integraciones
  entre mediciones pide medir en cada vuelta, que es como se comportaba antes de
  que la cadencia existiera.
- La racha de denegaciones y la de vueltas en vacío no sobreviven a un reinicio.
  Entre una sesión y la siguiente pueden haber cambiado la política y los
  hallazgos; arrastrar una racha vieja sería juzgar lo nuevo con evidencia
  caducada.

## Criterio de aceptación pendiente

Queda sin verificar empíricamente lo único que no se puede verificar con
pruebas: **un proyecto de confianza en modo autónomo durante varias horas,
atacando hallazgos sin intervención**. Hoy no hay dónde: el repositorio propio
está excluido por el principio 21, y ningún otro proyecto reúne a la vez
confianza, git inicializado y frenos configurados.

Lo que sí está verificado es la mecánica: la cadena entera, sus frenos y sus
desenlaces están cubiertos por pruebas unitarias y por la batería de
comprobaciones de integración que recorre el puente real.

## Referencias

- [ADR-060](adr-060-auto-merge-loop.md) — la política de integración firmada que
  este registro convierte en el último paso del ciclo, y el principio 21 que
  excluye al repositorio propio.
- [ADR-059](adr-059-capas-de-estado-no-heredan.md) — principio 20, del que este
  registro hereda la lectura de que dos capas no pueden compartir estado sin
  declararlo.
- [FLOWS/SELF-REPAIR](../FLOWS/SELF-REPAIR.md) — la cadena del motor, ahora
  también el camino del modo autónomo.
- [ROADMAP](../ROADMAP.md) — la retirada del modo autónomo antiguo en favor del
  motor disciplinado, que este registro cierra.
