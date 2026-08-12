# ADR-057: Puerto CodeAgent como frontera única con el proveedor

**Estado:** Aceptada
**Fecha:** 2026-08-06
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

FORTRESS habla con un motor de IA por dos vías (el CLI que actúa, la API que
responde solo texto — ADR-033). Si cada parte del sistema hablara con el
proveedor a su manera, cambiar de motor o probar con un doble en tests sería
imposible, y el dominio quedaría acoplado a un SDK concreto.

## Alternativas consideradas

- **Acoplar el SDK del proveedor directamente en la aplicación:** descartada
  — imposible intercambiar motores (CLI/API), imposible sustituir por un
  doble en los tests; el dominio dependería de un detalle externo.
- **Un puerto distinto por cada proveedor:** descartada — sobre-abstracción;
  un solo puerto cubre el caso de hoy, y multiplicarlos sería complejidad sin
  demanda.

## Decisión

Un puerto de dominio (`CodeAgent`) que es la frontera ÚNICA con el proveedor
de IA. Toda corrida de agente pasa por él; las implementaciones concretas
(CLI, API) lo satisfacen. Esto habilita el motor dual (elegir CLI o API por
disponibilidad) y permite sustituir el agente por un doble en los tests del
dominio y la aplicación.

## Consecuencias

### Positivas
- El motor es intercambiable y testeable con dobles; el dominio no conoce el
  SDK.
- La continuidad ante un cambio de proveedor tiene un solo punto que tocar.

### Negativas
- Una capa de indirección más entre la aplicación y el proveedor.

### Neutras
- El puerto es un ejemplo directo de la inversión de dependencias del DDD.

## Referencias

- ADR-033 (Claude Code CLI en vez del SDK — el puerto abstrae esa elección).
- [FLOWS/CHAT](../FLOWS/CHAT.md) — el motor dual (CLI o API) por
  disponibilidad.
- [ARCHITECTURE](../ARCHITECTURE.md) — puertos y dependencias hacia adentro.
