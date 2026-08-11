# ADR-028: Reintento solo por razones de razonamiento

**Estado:** Aceptada
**Fecha:** 2026-08-08
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

Una propuesta rechazada, ¿se puede reintentar? Depende de POR QUÉ se
rechazó. Repetir un fallo técnico (presupuesto agotado, worktree perdido,
instalación rota) sin arreglar la causa produce el mismo resultado con
más factura.

## Alternativas consideradas

- **Reintentar cualquier rechazo:** descartada — invita a martillar
  fallos técnicos esperando suerte.
- **No reintentar nunca (re-proponer desde cero):** descartada — pierde el
  linaje entre intentos y obliga a re-elegir, que puede escoger OTRO
  hallazgo.

## Decisión

Whitelist CERRADA de razones reintenables — las de razonamiento de una
corrida concreta: veto del revisor, violación de correa, sin diff
producido, error del generador. El matcheo es por prefijo exacto (la razón
persiste a veces con detalle). Todo lo demás no ofrece el botón.

## Consecuencias

### Positivas
- El reintento existe donde una corrida fresca puede razonar mejor, y solo
  ahí.

### Negativas
- Casos límite (timeout de un caso legítimamente lento) requieren
  intervención manual en vez de botón (a propósito: se investiga).

### Neutras
- La whitelist es contrato de interfaz observable, público.

## Referencias

- [FLOWS/RETRY](../FLOWS/RETRY.md) — el flujo completo.
- ADR-029, ADR-030.
