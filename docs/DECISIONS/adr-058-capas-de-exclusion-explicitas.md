# ADR-058: Cada capa de exclusión declara su propia lista

**Estado:** Aceptada
**Fecha:** 2026-08-12
**Autor:** operador

## Contexto

El proyecto excluye archivos en varias capas con propósitos distintos: el
control de versiones decide qué no se commitea, el empaquetador decide qué no
viaja en el instalable, y el compilador decide qué no entra en la compilación.
Son mecanismos independientes que no se comunican entre sí.

Es fácil asumir que basta con excluir algo en el control de versiones para que
quede fuera de todas partes. No es así: un archivo ignorado por git sigue
estando en el disco del desarrollador, y el empaquetador lo mete en el
instalable salvo que se le diga explícitamente que no.

El riesgo se materializó al auditar el paquete durante una reconstrucción del
binario: la carpeta interna del operador viajaba dentro del instalable pese a
estar correctamente excluida del repositorio. La causa fue un patrón de
exclusión del empaquetador que había quedado huérfano al renombrarse esa
carpeta: seguía excluyendo un nombre que ya no existía, lo que equivale a no
excluir nada.

## Alternativas consideradas

- **Tratar la exclusión del control de versiones como fuente única:**
  descartada — son mecanismos con propósitos distintos. Un archivo puede
  necesitar viajar en el instalable sin estar en el repositorio, o al revés;
  derivar una lista de la otra acopla decisiones que no son la misma.
- **Sincronizar las listas automáticamente:** descartada — añade una
  dependencia y una pieza que mantener para un problema que se resuelve
  declarando la exclusión y verificándola. La automatización también puede
  quedar obsoleta, y entonces falla en silencio igual que el patrón huérfano.

## Decisión

Cada capa de exclusión declara su propia lista, explícita y completa. Ninguna
hereda de otra.

Como consecuencia operativa, renombrar o mover una carpeta interna obliga a
revisar todas las capas, no solo la del repositorio. Y la reconstrucción del
binario al cierre de cada fase incluye una verificación explícita sobre el
paquete: extraer el instalable y comprobar que las carpetas internas no están
dentro. La verificación es parte del procedimiento, no un extra opcional.

## Consecuencias

### Positivas
- El material interno queda fuera del instalable por declaración explícita, no
  por suerte ni por herencia implícita.
- La verificación sobre el paquete convierte una garantía documentada en una
  comprobación reproducible: se mira el artefacto, no la intención.
- La exclusión se declara por CARPETA, no por lista de nombres: cubre también
  los archivos internos que se añadan en el futuro, sin tocar la
  configuración.

### Negativas
- Hay que mantener varias listas en lugar de una, y un renombrado obliga a
  tocarlas todas.
- Al cubrir por ubicación, **un archivo interno que se saque de la carpeta
  declarada deja de estar cubierto**. La convención que esto obliga: el
  material sensible vive dentro de la carpeta interna, y sacarlo de ahí exige
  revisar las exclusiones antes.

### Neutras
- Es el mismo criterio que el proyecto aplica a las capas de defensa: cada una
  se declara y se prueba por separado, sin dar por hecho que otra la cubre.
- Se prefiere la cobertura por ubicación —verificable de un vistazo— a la
  defensa por nombre "por si acaso". Enumerar archivos para el caso de que
  algún día se muevan produce justamente lo que originó este ADR: entradas que
  nadie comprueba y que envejecen hasta ser falsas sin que nada avise.

## Referencias

- [CONTRIBUTING](../CONTRIBUTING.md) — la regla de registrar la decisión antes
  de escribir el código, que se aplicó aquí.
- [PRINCIPLES](../PRINCIPLES.md) — principio 3 (probar cada capa por separado)
  y 17 (estado presente frente a estado de diseño: el patrón huérfano describía
  una carpeta que ya no existía).
- [RELEASE](../RELEASE.md) — qué contiene el instalable y cómo se verifica.
