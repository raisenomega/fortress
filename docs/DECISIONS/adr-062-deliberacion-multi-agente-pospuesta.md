# ADR-062: La deliberación entre varios agentes queda pospuesta

**Estado:** Aceptada
**Fecha:** 2026-08-16
**Autor:** operador

## Contexto

El motor produce **un** arreglo por vuelta y lo somete a tres filtros: la
batería mecánica que lo compila y lo prueba en su copia aislada, el revisor que
juzga si resuelve el hallazgo sin daño colateral, y la política que decide si
puede integrarse sin firma humana. Los tres pueden vetar. Ninguno propone una
alternativa, y ninguno ve el razonamiento de los otros: el revisor no sabe qué
comprobó la batería, y la política ni siquiera se ejecuta si el revisor vetó.

Existe una arquitectura distinta, contemplada desde hace tiempo: **varios
agentes producen arreglos distintos para el mismo hallazgo, se critican entre sí
en una ronda estructurada, y el revisor elige el mejor o consolida partes de
varios**. No sustituiría a los tres filtros; iría antes que ellos, aportando lo
único que hoy no existe en ninguna parte del ciclo —una segunda opción con la
que comparar la primera.

La tentación es darla por cubierta con el argumento de que "ya hay tres jueces".
No lo está. Tres filtros en serie son tres formas de decir que no; ninguna es
una forma de proponer algo mejor. Cubren la validación, no la exploración.

Y hay un dato que decide, o decidiría si existiera: el coste. Una corrida del
agente que estudia un hallazgo consume del orden de medio millón de tokens. Una
deliberación con del orden de diez agentes sobre el mismo hallazgo se estima
entre setenta y ciento veinte dólares por arreglo, frente a los ocho u once del
ciclo actual. Multiplicado por un modo autónomo prolongado, es la variable que
decide si la arquitectura es viable, y no hay ninguna medición real contra la
que contrastarla.

## Alternativas consideradas

- **Implementarla ahora:** descartada. Exige infraestructura que no existe
  —generación de varios arreglos por hallazgo, una ronda de crítica que los
  ponga a hablar entre sí, y un consolidador que decida— y multiplicaría el
  coste por un factor de ocho a diez sin una sola medición que diga que la
  calidad lo justifica. Diseñar sin evidencia de necesidad es sobre-diseño, y
  aquí el sobre-diseño se paga en dólares por arreglo.
- **Descartarla por transitividad**, argumentando que los tres filtros ya cubren
  lo que buscaba: descartada, y es la alternativa más peligrosa de las tres
  porque suena razonable. Los filtros rechazan; la deliberación exploraría. Dar
  por cubierto lo segundo con lo primero cierra la puerta con un argumento que
  no se sostiene, y deja el hueco sin nombre para quien venga después.
- **Descartarla honestamente**, reconociendo que los filtros bastan: descartada
  por prematura. Puede que basten; hoy nadie lo sabe, porque el ciclo completo
  no ha corrido nunca sobre un proyecto real durante horas.
- **Posponerla dejando escrito qué evidencia haría falta:** escogida.

## Decisión

**Ni se implementa ni se descarta.** La decisión se pospone, y se pospone
explícitamente —con este registro— para que la ausencia de deliberación sea una
decisión visible y no un olvido.

La decisión final se toma cuando existan tres evidencias:

1. **Corridas reales.** El modo autónomo operando sobre un proyecto de confianza
   durante horas, atacando hallazgos seguidos.
2. **Calidad medida.** Cuántos arreglos aprueba el revisor, cuántos deniega la
   política, y cuántos de los integrados hubo que deshacer después.
3. **Coste real por arreglo**, contrastado contra la estimación de la
   arquitectura alternativa.

Con esas tres sobre la mesa, la salida es una de dos: descartar la deliberación
con un registro que documente el argumento, o abrirla con su propio inventario.

**El retiro del juez por re-medición no es un descarte de la deliberación.** Ese
mecanismo se retiró porque medía un árbol que el arreglo ya no toca, no porque
se hubiera decidido que explorar alternativas sobra. Son dos cosas distintas y
conviene que no se confundan: una era un juez roto por cambio de régimen, la
otra es una capacidad que nunca ha existido.

## Consecuencias

### Positivas
- El hueco queda nombrado. Quien lea el ciclo y se pregunte por qué solo hay un
  arreglo por vuelta encuentra la respuesta y las condiciones que la cambiarían.
- No se gasta esfuerzo en construir una arquitectura cara antes de saber si hace
  falta, ni se cierra la puerta a construirla.

### Negativas
- El motor seguirá produciendo un solo arreglo por hallazgo. Si ese arreglo es
  mediocre pero pasa los tres filtros, nada habrá generado un competidor mejor.
- La decisión queda pendiente de una evidencia que hoy no se puede obtener,
  porque no hay proyecto donde el modo autónomo pueda correr. La posposición
  puede durar más de lo previsto.

### Neutras
- Un arreglo rechazado por el revisor no dispara la producción de otro: queda
  registrado con su veredicto y el ciclo pasa al siguiente hallazgo. Eso ya era
  así y este registro no lo cambia.
- La estimación de coste que sostiene la posposición es eso, una estimación. La
  primera medición real puede moverla en cualquier dirección, y ese es
  precisamente el punto.

## Referencias

- [ADR-061](adr-061-modo-autonomo-con-la-disciplina-del-motor.md) — el ciclo de
  tres filtros que este registro deja tal como está, y el criterio de aceptación
  cuya verificación desbloquea esta decisión.
- [ADR-060](adr-060-auto-merge-loop.md) — la política de integración, tercero de
  los tres filtros.
- [FLOWS/SELF-REPAIR](../FLOWS/SELF-REPAIR.md) — la cadena donde la deliberación
  se insertaría, antes de los filtros y no en su lugar.
