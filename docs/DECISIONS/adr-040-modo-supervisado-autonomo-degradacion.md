# ADR-040: Modo supervisado/autónomo con degradación por petición

**Estado:** Aceptada
**Fecha:** 2026-08-04
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

Un agente que actúa puede operar en dos registros: proponer y esperar
aprobación (seguro, lento) o aplicar y reportar (rápido, arriesgado en zonas
sensibles). Forzar uno solo sacrifica velocidad o seguridad. Y aun en
modo autónomo, hay áreas donde aplicar sin revisar es imprudente.

## Alternativas consideradas

- **Modo único supervisado:** descartada — pierde velocidad en proyectos de
  confianza donde el operador ya delegó.
- **Modo único autónomo:** descartada — arriesgado; aplicar cambios sin
  revisión sobre auth, pagos o secretos es exactamente lo que no debe pasar
  solo.

## Decisión

Dos modos: supervisado (por defecto) y autónomo (exige proyecto de
confianza). Y una degradación POR PETICIÓN: si el contenido de un mensaje
toca un área protegida (autenticación, pagos, base de datos y permisos,
secretos), esa petición corre supervisada aunque el modo sea autónomo. La
detección cubre español e inglés con normalización de acentos. Doctrina:
**"sobre-degradar es seguro; infra-degradar es el peligro."**

## Consecuencias

### Positivas
- Velocidad donde se delegó, prudencia donde importa — decidido por
  petición, no por sesión.

### Negativas
- La lista de áreas protegidas hay que mantenerla; una omisión bilingüe deja
  un hueco (por eso la cobertura ES+EN).

### Neutras
- La degradación es efectiva por mensaje; el siguiente vuelve a autónomo si
  no toca áreas protegidas.

## Referencias

- [FLOWS/CHAT](../FLOWS/CHAT.md) — la degradación por petición y su historia
  de origen.
- [SECURITY-MODEL](../SECURITY-MODEL.md) — las áreas protegidas.
- ADR-041 (el allowlist que acota lo que el agente ejecuta).
