# ADR-054: Bucle de génesis con topes obligatorios

**Estado:** Aceptada
**Fecha:** 2026-08-08
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

Las capacidades necesitan muchos episodios para madurar (miles, hasta
decenas de miles). Producirlos a mano es agotador. Hacía falta automatizar
la generación de episodios en bucle — la frontera más autónoma del sistema —
sin que eso significara gasto ilimitado ni saltar los frenos del ciclo de
capacidades.

## Alternativas consideradas

- **Un bucle sin topes:** descartada — coste ilimitado; un bucle autónomo
  sin freno de gasto es una factura abierta.
- **Un bucle que activa agentes automáticamente:** descartada — violaría el
  gate por kind; un agente nuevo debe esperar firma humana, no nacer activo
  de un bucle.

## Decisión

Un bucle que entrena una capacidad por iteración, con topes OBLIGATORIOS sin
default (coste en USD y número de episodios, ambos mayores que cero, o no
enciende). Elige la capacidad no-oficial con MENOS episodios (reparto justo,
no acelera umbrales). Y **respeta el gate por kind: lo reversible avanza; lo
irreversible espera firma. Nunca toca el proyecto del operador.** Los
episodios corren en sandbox temporal.

## Consecuencias

### Positivas
- La evidencia se produce a escala sin gasto abierto ni saltar frenos.

### Negativas
- Los topes obligatorios son fricción de encendido (deliberada: son parte de
  la firma).

### Neutras
- Su distinción con el loop pre-motor no es "propone vs dispone" sino
  "reversible vs irreversible externo".

## Referencias

- [FLOWS/GENESIS](../FLOWS/GENESIS.md) — el bucle completo.
- [PAGES/genesis-agentes](../PAGES/genesis-agentes.md) — el HUD.
- ADR-052 (el gate por kind que el bucle respeta).
