# ADR-012: Un hallazgo, un fix, con correa de archivos permitidos

**Estado:** Aceptada
**Fecha:** 2026-08-08
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

Un generador sin límites de alcance puede "aprovechar el viaje" y tocar lo
que no debe. El primer intento real del motor lo demostró: el campo textual
del análisis que decía dónde arreglar era PROSA, no una ruta, y la correa
construida sobre prosa rechazó un fix válido.

## Alternativas consideradas

- **Confiar en el prompt ("no toques nada más"):** descartada — la
  instrucción no es un mecanismo; el diff real es el juez.
- **Correa por directorio completo:** descartada — demasiado ancha; permite
  daño colateral en archivos hermanos no relacionados.

## Decisión

Cada propuesta ataca UN hallazgo con UN fix. La correa (archivos
permitidos) se calcula desde el campo ESTRUCTURADO del hallazgo (su archivo
primario) más sus tests hermanos; la prosa del análisis solo aporta pistas.
El motor verifica el diff real contra la correa: salirse rechaza.

## Consecuencias

### Positivas
- El alcance es verificable mecánicamente, no negociable por el agente.

### Negativas
- Fixes legítimamente multi-archivo exigen correa más rica (evolución
  futura consciente).

### Neutras
- La violación de correa es razón reintenable ([FLOWS/RETRY](../FLOWS/RETRY.md)).

## Referencias

- [GLOSSARY](../GLOSSARY.md) — correa.
- [PRINCIPLES](../PRINCIPLES.md) — principio 16.
