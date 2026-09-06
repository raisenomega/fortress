# ADR-078: Modelo por agente, declarado en el catálogo y transportado por `--agents`

- **Fecha:** 2026-09-06
- **Estado:** Aceptada
- **Área:** Agentes · Coste

## Contexto

Los once agentes de auditoría corrían todos con **el modelo de la sesión**: el
que tuviera configurado el CLI en ese momento. Ninguno lo elegía, y el catálogo
—que ya decide el nombre, el propósito, el icono y hasta la carta de OMEGA— no
tenía dónde ponerlo.

Eso mezcla trabajos que no se parecen. El Security Reviewer decide si algo es un
defecto y con qué gravedad, y una severidad mal puesta arrastra al motor entero;
el Refactor Cleaner busca imports sin usar contra un criterio ya escrito. Correr
los dos con el mismo modelo significa o pagar razonamiento caro para barrer, o
juzgar con un modelo que no da para juzgar.

## Decisión

`Agent` gana **`model?: string`**, hermano de `charter`: mismo sitio, misma
semántica de opcional, misma forma de resolverse. `AgentDefinition` gana el mismo
campo, y `buildAgentsPayload` lo copia **solo si el agente lo declara**.

### Por qué dentro de `--agents` y no `--model` global

Los once agentes **ya viajan** como JSON en `--agents`, uno por uno, con su
descripción y su prompt. El campo entra ahí, en el objeto de cada uno.

La alternativa era añadir `--model` a `buildArgs`, y es peor por dos razones
independientes:

- **Da un modelo por SPAWN, no por agente**, que es menos de lo que hace falta:
  un escaneo lanza varios agentes en el mismo proceso.
- **`claude-cli.ts` está en la lista innegociable** (`auto-merge-blacklist.ts:22`,
  *«arma el entorno de TODO agente, con sus tools y su MCP»*). Tocarlo exige firma
  humana. La ruta por `--agents` no lo roza: ese fichero recibe el `Record` ya
  construido y solo hace `JSON.stringify`.

### El reparto, y el criterio

El criterio es **qué hace el agente**, no su importancia:

| modelo | agentes | por qué |
|---|---|---|
| `opus` | security-reviewer, sentinel-omega, planner, cognition | **Juzgan.** Deciden si algo es un defecto y con qué gravedad, o qué se toca antes de tocarlo. Equivocarse sale caro y el error no se ve hasta mucho después. |
| `sonnet` | code-reviewer, tdd-guide, build-error-resolver, e2e-runner | **Ejecutan contra algo comprobable.** Un test que pasa o no, un build que arranca o no. El trabajo se verifica solo. |
| `haiku` | refactor-cleaner, code-simplifier, opensource-sanitizer | **Barren.** Pasadas mecánicas sobre criterios ya escritos. |

Cuatro, cuatro y tres.

### Alias y no un id fijo

Se declara `opus`, no `claude-opus-5`. Los alias siguen al último de su familia,
así que un agente sube de versión solo cuando sale la siguiente. Un id clavado
obligaría a editar el catálogo en cada release, y **un catálogo que hay que tocar
para seguir al día acaba desactualizado** — que es exactamente el fallo que esta
casa lleva persiguiendo en las listas que se escriben a mano.

### Por qué ninguno en Fable

Su fallback ante una petición de ciberseguridad cae a Opus 4.8 **con retención de
30 días**. Este repositorio audita código ajeno bajo doctrina de cero telemetría,
y un agente que a veces retiene y a veces no es peor que uno que nunca lo hace:
la garantía deja de poder afirmarse. Se descarta por doctrina, no por capacidad.

### La ausencia significa algo

Sin `model`, el agente **hereda el de la sesión**. Es lo que hacían los once
hasta ahora y lo que siguen haciendo los agentes auto-propuestos
(`active-custom-agents`), que no se tocan: el campo es opcional y su ausencia es
una respuesta, no un olvido.

La llave se **omite** cuando no hay modelo, en vez de viajar en `undefined`. Y la
cadena vacía se omite también: es un descuido, no una elección, y mandaría al CLI
a pedir un modelo sin nombre. Lo destapó una prueba antes de salir de la rama.

## Consecuencias

- El coste de un escaneo deja de ser uniforme: baja donde se barre y se mantiene
  donde se juzga. No se ha medido todavía cuánto.
- **Los once declaran modelo**, y una prueba lo fija con el reparto escrito
  aparte: cambiar con qué modelo juzga el Security Reviewer deja de poder
  colarse como «un ajuste».
- Si el CLI dejara de aceptar `model` por definición, el campo se ignoraría en
  silencio y todos volverían al de la sesión — degradación sin caída, pero
  silenciosa. La forma se verificó contra la versión 2.1.263.
- `claude-cli.ts` no se tocó. La lista innegociable sigue intacta.

## Código

`src/domain/agent/agent.ts` · `src/domain/agent/agent-prompt.ts` ·
`src/domain/agent/default-agents.ts` · `src/domain/agent/optional-agents.ts` ·
`src/domain/agent/sentinel-omega.ts` ·
`src/domain/agent/reparto-de-modelos.test.ts` ·
`src/domain/agent/modelo-en-el-payload.test.ts`
