# ADR-055: Configuración guiada con envelope de documentos de gobierno

**Estado:** Aceptada
**Fecha:** 2026-08-06
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

Un proyecto nuevo necesita su marco de gobierno (doctrina de agente,
arquitectura, cerebro cognitivo). ¿Cómo lo produce FORTRESS? Y una vez que
el agente redacta esos documentos, ¿cómo distingue el sistema el CONTENIDO
propuesto de una instrucción, para escribirlo a disco sin ejecutarlo?

## Alternativas consideradas

- **Envelope de documentos siempre presente en todo prompt:** descartada —
  contaminaría el chat normal con contexto excesivo y degradaría la calidad
  de la respuesta; el gobierno no hace falta en cada turno.
- **Sin envelope, contexto en línea:** descartada — el agente no
  distinguiría el documento que redacta de las instrucciones que sigue; la
  captura sería ambigua.

## Decisión

Una entrevista de configuración guiada donde el agente propone los
documentos de gobierno uno a uno, envueltos en delimitadores estrictos
(`<<<FORTRESS-DOC:...`). La app captura del texto persistido —nunca del
stream efímero— y al aprobar los escribe a disco. Este envelope vive SOLO en
el flujo de configuración; el chat normal usa su system prompt real
(identidad, ficha del proyecto, agentes activos, modo), sin envelope.

## Consecuencias

### Positivas
- El gobierno se genera y captura sin ambigüedad; el chat normal no se
  contamina con contexto que no necesita.

### Negativas
- Dos caminos de prompt que mantener (configuración vs chat normal).

### Neutras
- Los documentos escritos son datos del proyecto, en su filesystem.

## Referencias

- [FLOWS/CHAT](../FLOWS/CHAT.md) — el envelope de configuración vs el system
  prompt del chat normal.
- [PAGES/nuevo-proyecto](../PAGES/nuevo-proyecto.md) — el alta que dispara la
  entrevista.
- [PAGES/onboarding](../PAGES/onboarding.md) — el arranque previo.
