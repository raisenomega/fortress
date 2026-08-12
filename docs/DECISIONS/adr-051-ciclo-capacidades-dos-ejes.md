# ADR-051: Ciclo de vida de capacidades — fase y madurez como dos ejes

**Estado:** Aceptada
**Fecha:** 2026-08-07
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

Una capacidad auto-propuesta necesita demostrar que sirve antes de
incorporarse. ¿Cómo medir ese recorrido? Dos cosas importan y son distintas:
cuánto se ha ejercitado (exposición) y con qué calidad (fiabilidad).
Confundirlas produce una métrica que miente.

## Alternativas consideradas

- **Un eje único "madurez" que combina cantidad y calidad:** descartada —
  mezcla exposición con calidad; una capacidad muy ejercitada pero que falló
  mucho parecería madura, ocultando su fragilidad.
- **Solo conteo de episodios, sin calidad:** descartada — una capacidad que
  falló la mitad de las veces contaría igual que una impecable.

## Decisión

Dos ejes ortogonales. La FASE se deriva del CONTEO de episodios (propuesta
por debajo de 1.000; prueba desde 1.000; ciclo desde 20.000; oficial desde
50.000). La MADUREZ se deriva de la CALIDAD: episodios por cumplimiento por
(1 menos la tasa de fallos). **El sistema no se pone su propia nota; el
número sale de lo que de verdad pasó, y por eso no puede mentir.**

## Consecuencias

### Positivas
- Fase (exposición) y madurez (calidad) se leen por separado; ninguna oculta
  a la otra.

### Negativas
- Dos números que entender en vez de uno (el precio de no engañar).

### Neutras
- La madurez se deriva, no se persiste cruda.

## Referencias

- [FLOWS/CAPABILITIES](../FLOWS/CAPABILITIES.md) — los dos ejes en detalle.
- [DATA-MODEL](../DATA-MODEL.md) — la tabla de capacidades.
- ADR-052 (el gate que decide la promoción entre fases).
