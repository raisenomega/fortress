# ADR-034: La API key cifrada con safeStorage, nunca al renderer

**Estado:** Aceptada
**Fecha:** 2026-08-01
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

FORTRESS necesita la API key del usuario para hablar con el proveedor. Esa
credencial es uno de los dos activos más sensibles del sistema. ¿Dónde vive
y quién puede leerla? La respuesta define toda la superficie de riesgo de la
credencial.

## Alternativas consideradas

- **Variable de entorno con la key:** descartada — se hereda a los procesos
  hijos (incluido el agente), puede acabar en logs y en stacks de error.
- **Archivo `.env` en el filesystem:** descartada — sin cifrar, legible por
  cualquier proceso del equipo; un backup o un sync la exportaría en claro.

## Decisión

La API key se cifra con `safeStorage` de Electron (el mecanismo del sistema
operativo) y solo el proceso principal la descifra. **Nunca cruza al
renderer:** el renderer solo puede preguntar si existe, jamás leerla. Las
llamadas al proveedor salen del proceso principal; los textos que podrían
contenerla pasan por redacción de secretos antes de cualquier log.

## Consecuencias

### Positivas
- Aunque el renderer fuera comprometido (XSS, dependencia comprometida), la
  key sigue protegida: no está a su alcance.
- La credencial no viaja por el bridge de IPC.

### Negativas
- El renderer no puede operar directo con el proveedor; todo pasa por el
  main (que es justamente el punto).

### Neutras
- La key no está en la base de datos: vive en el keychain del sistema.

## Referencias

- [SECURITY-MODEL](../SECURITY-MODEL.md) — el modelo de amenazas de la
  credencial.
- [Onboarding](../PAGES/onboarding.md) — la captura inicial de la key.
- [Ajustes](../PAGES/ajustes.md) — su gestión posterior.
