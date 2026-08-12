# ADR-053: Agente-como-dato, no código generado

**Estado:** Aceptada
**Fecha:** 2026-08-07
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

FORTRESS puede incorporar agentes nuevos que nacen de su propio uso. La
pregunta de máximo riesgo: ¿ese agente es código fuente que el sistema
genera y se rebuilda, o es un dato que consume dinámicamente? La respuesta
define la superficie de riesgo de toda la auto-creación.

## Alternativas consideradas

- **Agente como código con rebuild:** descartada — un sistema que genera
  código fuente y se recompila a sí mismo tiene una superficie de riesgo
  desproporcionada; un fallo o una inyección quedarían horneados en el
  binario.
- **Agentes activos ilimitados:** descartada — explosión combinatoria; un
  catálogo con muchos agentes indistinguibles degrada la calidad del
  despacho.

## Decisión

Un agente auto-creado es un DATO: una fila con su nombre, prompt e icono que
el motor inyecta en el despacho `--agents`, nunca código generado. Los
episodios de entrenamiento corren en un sandbox temporal aislado. Un techo
limita los agentes-dato activos a la vez (freno de primera versión,
ajustable). La reversión es instantánea: desactivar deja de inyectar, sin
residuo — no hay código que retirar.

## Consecuencias

### Positivas
- Reversibilidad por construcción; cero código generado que auditar o
  revertir.

### Negativas
- Un agente-dato es solo un prompt: no puede tener lógica que un prompt no
  exprese.

### Neutras
- Es una categoría aparte de los 11 agentes del sistema (no entra a su
  conjunto ni a su telemetría).

## Referencias

- [FLOWS/CAPABILITIES](../FLOWS/CAPABILITIES.md) — la Capa 2, agente-como-dato.
- [AGENTS](../AGENTS.md) — la distinción con los 11 originales.
- ADR-045 (el catálogo de datos de los 11, misma filosofía).
