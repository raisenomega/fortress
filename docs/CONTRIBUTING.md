# Cómo contribuir a FORTRESS

FORTRESS Command Center es desarrollado y mantenido por Raisen Agency (San
Juan, Puerto Rico). Este documento describe cómo aportar código o documentación
al proyecto y las disciplinas que un cambio debe respetar para poder
integrarse. Está dirigido a quien quiere trabajar en el proyecto; para poner en
marcha un entorno de desarrollo local, ver [DEV-SETUP](DEV-SETUP.md).

## Las disciplinas del proyecto

FORTRESS impone reglas duras. Algunas las verifica la máquina —romperlas hace
fallar el linter y, por tanto, el gate—; otras son convenciones que dependen de
la disciplina de quien contribuye. La distinción importa: lo mecanizable lo
detecta la integración continua; lo convencional se respeta por criterio.

### Verificadas por la máquina (las falla ESLint)

- **Máximo 75 líneas por archivo.** Sin excepciones: si un archivo crece, se
  divide en módulos; no se sube el límite.
- **Máximo 50 líneas por función.** Una función, una responsabilidad.
- **Prohibido `any`.** El tipado es fuerte, sin atajos.
- **Prohibidos los comentarios que silencian el compilador de tipos** sin
  justificación escrita.

Estas reglas viven en `eslint.config.mjs` y se comprueban en cada corrida del
linter. Un cambio que las rompa no pasa el gate.

### Convenciones (dependen de la disciplina humana)

- **Cero emojis** en el código y en la documentación.
- **Iconos solo desde la biblioteca de iconos**, a través del registro
  semántico del proyecto: el dominio guarda un nombre de icono, nunca un glifo.
- **Colores solo por tokens del tema**, nunca valores fijos.
- **Densidad sobre longitud** en la documentación: el contenido decide el
  tamaño; nunca se rellena para alcanzar un número.
- **Referencias cruzadas abundantes** entre documentos.
- **Sin documentación no hay merge** (ver [PRINCIPLES](PRINCIPLES.md),
  principio 13): cada incremento entrega su pieza documental como parte del
  mismo trabajo.

Las capas y las reglas de dependencia están en
[ARCHITECTURE](ARCHITECTURE.md); los principios de método que sostienen todo
esto, en [PRINCIPLES](PRINCIPLES.md) —diecinueve, cada uno nacido de un error
real—.

## Cómo leer el corpus documental

El proyecto guarda su documentación en `docs/`. Para orientarse entre sus
archivos:

- [README](README.md) — el índice y el estado de la documentación.
- [OVERVIEW](OVERVIEW.md) y [ARCHITECTURE](ARCHITECTURE.md) — el contexto
  rápido: qué es FORTRESS y cómo está construido.
- [PRINCIPLES](PRINCIPLES.md) — los diecinueve principios de método firmados.
- [FLOWS/](FLOWS/SELF-REPAIR.md) — los flujos operativos por dominio.
- [DECISIONS/](DECISIONS/README.md) — las cincuenta y ocho decisiones
  arquitectónicas.
- [PAGES/](PAGES/README.md) — las vistas de la interfaz.
- [HISTORY](HISTORY.md), [CHANGELOG](CHANGELOG.md) y [ROADMAP](ROADMAP.md) — de
  dónde viene el proyecto, qué ha cambiado y hacia dónde va.

## Antes de un pull request

Tres comprobaciones, en este orden, antes de abrir un PR:

1. **El gate en verde.** Los tres comandos del gate mínimo:

   ```
   npm run typecheck
   npm run lint
   npm run test:unit
   ```

   El gate completo añade las pruebas de integración: `npm test`. Un PR con el
   gate en rojo no se revisa.
2. **La documentación al día.** Si el cambio añade una capacidad, trae su
   documento; si modifica un flujo existente, actualiza el documento que lo
   describe. Es la regla "sin documentación no hay merge" aplicada al PR.
3. **Un ADR primero si toca una decisión estructural.** Los cambios de
   arquitectura se registran como una decisión en
   [DECISIONS/](DECISIONS/README.md) antes de escribir el código, con su
   contexto, alternativas y consecuencias.

## Qué NO cambia sin discusión previa

Algunas decisiones están firmadas como decisiones arquitectónicas y no se
cambian con un pull request ad-hoc. Modificarlas requiere una decisión nueva,
con discusión previa. Entre ellas:

- El motor de IA corre como un proceso externo, no como una biblioteca embebida
  (ADR-033).
- La arquitectura de dominios estricta y sus reglas de dependencia (ADR-031).
- La doctrina de cero telemetría (ADR-056).

Propuestas como "modernizar el motor a una biblioteca embebida", "simplificar
la arquitectura de capas" o "añadir telemetría anónima opcional" se rechazan si
llegan como PR directo: primero la decisión con su ADR, después el código.

## Mensajes de commit

Formato de commits convencionales: `tipo(alcance): descripción breve`. Los
tipos son `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`,
`security` y `system`. Cada commit hace una sola cosa; el mensaje describe qué
cambió y por qué, nunca "cambios varios".

`system` cubre los cambios en la infraestructura del sistema: los prompts base
de los agentes, la configuración del grafo y el cableado de `docs/` en los
agentes. Su rama usa el prefijo `system/`, no `docs/`.

## Reportar un problema

Antes de abrir un reporte, consulta [TROUBLESHOOTING](TROUBLESHOOTING.md) (por
completar en la fase de documentación operativa): muchos problemas conocidos ya
tienen diagnóstico y solución allí.

## Una buena primera contribución

El proyecto aún no fija la versión mínima de Node.js en `package.json`. Añadir
un campo `engines.node` explícito y un archivo `.nvmrc` con la versión de
referencia es una contribución bienvenida, y un buen primer pull request para
quien quiera empezar.

## Referencias

- [DEV-SETUP](DEV-SETUP.md) — poner en marcha el entorno de desarrollo.
- [ARCHITECTURE](ARCHITECTURE.md) — las capas y las reglas duras.
- [PRINCIPLES](PRINCIPLES.md) — los principios de método.
- [DECISIONS/](DECISIONS/README.md) — las decisiones arquitectónicas.
