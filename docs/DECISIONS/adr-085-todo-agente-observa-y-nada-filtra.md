# ADR-085: Todo agente observa a FORTRESS, y ninguna observación filtra al cliente

- **Fecha:** 2026-09-11
- **Estado:** Aceptada
- **Área:** Auto-mejora · Confidencialidad del cliente · Agentes

## Contexto

### La ley está escrita y se cumple en 1 de 11

`self-observation.ts` la declara desde su primera línea:

> *«Observación que un agente hace sobre FORTRESS MISMO mientras trabaja en OTRO
> proyecto: un límite, un bug, un gap, algo que le faltó (incluidos bloqueos de
> entorno/permisos/plan-mode) o la OPORTUNIDAD de una capacidad nueva. No es un
> hallazgo del proyecto; es material para que FORTRESS se mejore a sí misma con
> cada trabajo.»*

Medido el 2026-09-11: de los **once** sitios donde un agente corre dentro de un
proyecto, **uno solo** deja observación — el analista C2 (`plan-repair.ts:55`).
`selfObservations.add` no aparece en ningún otro sitio de producción. Los otros
diez corren, chocan con límites y no reportan nada.

| # | agente | respuesta | corridas | ¿observa? |
|---|---|---|---|---|
| 1 | analista C2 | JSON | 1 por propuesta | **sí** |
| 2 | escáner | JSON | **N — una por parada** | no |
| 3 | juez de aplicabilidad | JSON | 1 por escaneo | no |
| 4 | OMEGA | JSON | 1 por propuesta | no |
| 5 | chat | prosa | 1 por turno | no |
| 6 | terminal / configuración | prosa | 1 por turno | no |
| 7 | Ejecutor | prosa + edits | 1 por feature | no |
| 8 | Plan | prosa | 1 | no |
| 9 | Investigación | prosa | 1 | no |
| 10 | episodio de capacidad | JSON | 1, **en sandbox** | no |
| 11 | borrador de agente | JSON | 1, **en sandbox** | no |
| 12 | A/B del grafo | prosa | 2 | no |

### El precio de que no observen, medido esta misma semana

Los cinco defectos que la corrida de Health Flow destapó —el techo de 15
minutos, la telemetría en cero, la falta de granularidad por parada, los seis
agentes sin rastro y la identidad que fabricaba duplicados— se cazaron **a
mano**, abriendo la base y leyendo filas. Ninguno se veía desde dentro.

Los agentes estaban delante de todos ellos. El escáner corrió 199 minutos sin
techo; el juez gastó doce veces sin constar. Si hubieran podido decirlo, FORTRESS
los habría reportado sola. **La auto-mejora hoy es un trabajo manual del
operador; esta ley la convierte en un producto del trabajo normal.**

### Y hay una fuga en producción, medida y no teórica

De las **350** observaciones del backlog, **8 citan rutas de un proyecto AJENO**
(`mailbd-main`). Verbatim de la base:

```
trace_path con function_name escapeHtml devolvio estado ambiguous porque el
simbolo existe dos veces, en src/lib/sanitize-html.ts y en supabase/functions/...

no hay nodos ni aristas que conecten una llamada a supabase.storage.from('X')
con la definicion del bucket...
```

**Y aquí está lo que hace este arco difícil: esas ocho son observaciones
LEGÍTIMAS.** «El grafo no modela políticas RLS», «`trace_path` resuelve mal
símbolos duplicados» son verdades sobre FORTRESS, útiles, accionables. El agente
**no incumplió el prompt**: dijo algo cierto sobre la herramienta, y para
explicarlo necesitó citar el código que tenía delante.

El prompt pide *«si FORTRESS (la herramienta que te ejecuta, NO el proyecto que
analizas)»*. **Eso separa el TEMA, no el CONTENIDO** — y el corpus lo demuestra:
el tema se cumplió en las ocho, la cita se coló en las ocho.

`exportObservations` escribe la nota **en crudo** en `auto-mejora.json`
(`observation-export.ts:44`), y ese fichero es el que sale de la máquina del
cliente. **Con 143 observaciones de un solo cliente y ocho agentes desplegados,
esto se multiplica sin que nadie mire.**

## Decisión

**La ley y su cerco nacen juntos. Ninguna de las dos se despliega sin la otra.**

### 1. La ley: todo agente que corra dentro de un proyecto observa

Todo agente que FORTRESS lanza sobre el código de alguien reporta los límites de
FORTRESS con los que se topó. **No es una capacidad nueva: es desplegar una ley
que lleva escrita desde que existe `self-observation.ts`.**

Y no toca nada. Todos corren ya en `permissionMode: 'plan'` y `trusted: false` —
observar y reportar es exactamente lo que ya hacen; lo único que se añade es que
lo digan.

### 2. El cerco: ninguna observación filtra código del cliente

**Va PRIMERO. Es prerequisito, no complemento.** Toda observación pasa por un
redactor antes de asentarse: rutas de proyecto y citas `fichero:línea` se
sustituyen por un marcador, y `redactSecrets` se **llama** sobre el texto.

La postura es **REDACTAR la ruta y conservar la nota**, nunca rechazarla:

```
"el grafo no modela politicas RLS: no hay nodo para CREATE POLICY, y por eso
 no pudo responder sobre supabase/functions/quota/index.ts:44"
                                    ↓
"...y por eso no pudo responder sobre ‹ruta del proyecto›"
```

**El valor está en la observación, no en la cita.** Rechazar la nota entera
tiraría las ocho, que son buenas, y el proyecto ya tiene doctrina para esto:
ante la duda se conserva ([ADR-065](adr-065-nada-muere-sin-juicio.md)). La
observación sobre FORTRESS sobrevive; el código del cliente no viaja.

`redactSecrets` vive en `tool-detail.ts`, que es **innegociable**: se **llama**,
no se toca — como hacen ya sus otros once llamantes.

### 3. Quiénes observan: ocho sí, tres no

**SÍ** — los que chocan con límites REALES sobre código ajeno: el **escáner**
(12× por escaneo, y es el que destapó los cinco defectos de esta semana), el
**chat** y el **terminal** (el operador está delante y el agente se topa con
permisos y plan-mode en vivo), **OMEGA**, el **juez de aplicabilidad**, y el
**Ejecutor / Plan / Investigación** (el cerco de alcance es justo donde chocan).

**NO** — los tres que corren en caja artificial: el **episodio de capacidad** y
el **borrador de agente** viven en `mkdtempSync`, **sin proyecto**, así que no
hay `sourceProject` que poner y lo que observen dice de la caja, no de FORTRESS
trabajando. El **A/B del grafo** compara dos configuraciones: su «límite» *es* el
objeto del experimento.

Es el **mismo criterio** con el que el arco del rastro de agentes decidió no
asentar las corridas de sandbox: sin proyecto, la fila sería huérfana.

### 4. El contrato común

Los cinco que devuelven **JSON** ganan la clave opcional `"notes"`, con el molde
que ya funciona (`analysis-prompt-formato.ts`): **DENTRO** del objeto único,
nunca en bloque aparte — esa regla nació de un fallo real, un analista que
respondió en dos bloques y perdió el análisis entero.

Los que devuelven **prosa** —chat, terminal, Ejecutor— ganan un **bloque
delimitado**, molde `APLICA:[...]:END-APLICA` de la Fase 4 de
[ADR-083](adr-083-campana-de-auditoria-por-plantillas.md): es la forma probada de
sacar datos estructurados de una respuesta en prosa sin romperla.

El parser es `toSelfNotes`, y **se conserva tolerante**: lo mal formado se
descarta en silencio y nunca lanza. *«Una nota mal escrita no puede tumbar el
análisis que la acompaña — el trabajo del agente vale más que su apunte al
margen.»*

### 5. La deduplicación: contar, no descartar (fase posterior)

La misma observación llegando de tres clientes distintos **es la señal más
valiosa del sistema**: «esto le falta a FORTRESS en todos los stacks». Se
**cuenta** (`vistaEn: N`), no se descarta.

Requiere antes cerrar el vocabulario de `area`, hoy texto libre que baila —el
propio export lo confiesa: *«"permisos" aparece escrito de veintiuna formas
distintas y ninguna suma las otras veinte»*—. Es el mismo problema que
[ADR-081](adr-081-el-vocabulario-de-tipos-cubre-codigo-ajeno.md) resolvió para el
`tipo`, y la misma lección que
[ADR-084](adr-084-identidad-por-linea-el-simbolo-sale.md) confirmó: **el campo de
texto libre es el que baila**. Arco propio, después del cerco y del despliegue.

## Política de salida

**FORTRESS hoy NO transmite nada.** Verificado: cero `fetch`, cero
`https.request`, cero `axios`, cero `net.request` en todo el árbol.
`exportObservations` solo hace `writeFileSync` a `userData`.

**(a) Generar el fichero solo** —gancho de cierre de la app— **sí, y se puede
construir.** Es conveniencia local: cero fricción para el cliente, cero
transmisión. El `.json` ya vive en `userData`.

**(b) TRANSMITIR el fichero automáticamente requiere CONSENTIMIENTO INFORMADO,
UNA VEZ** (instalación o primer arranque), no en cada export.

La razón es concreta y no es prudencia abstracta: **el clic de hoy es, por
accidente, el último control humano antes de que el código de un cliente salga de
su máquina.** Automatizar la transmisión no quita fricción — quita el único
momento en que alguien podría mirar. Y el cerco es **best-effort**: una nota
puede describir lógica de negocio sin citar ni una ruta —«el precio se resuelve
por coincidencia difusa del nombre de producto»— y ninguna expresión regular
atrapa eso. El cliente tiene derecho a saber que el canal existe y qué viaja por
él.

Contradice además la ley del propio producto, que el operador fijó con estas
palabras: *«solo observa y reporta sin tocar nada ni rozar nada»*. Mandar el
código de alguien sin que lo sepa toca algo, y lo toca donde más cuesta reparar.

**Y es el argumento comercial, no el obstáculo.** Poder decirle a un CISO
*«FORTRESS no manda tu código a ningún sitio, y aquí está el fichero exacto que
sí manda»* solo es verdad con consentimiento y con cerco. Sin ellos, es una
frase que no se puede sostener en una auditoría.

**La implementación de (b) queda DIFERIDA** hasta que el modelo comercial
(SaaS / self-hosted) esté definido. La política se decide **ahora** para no
improvisarla bajo presión el día que haga falta.

**El cerco es prerequisito de (a) y de (b): nada sale sin pasar por él.**

## La visión completa (norte; se construye por niveles)

- **Nivel 1 — los agentes** *(este arco)*: los ocho observan. Medio construido ya:
  la ley escrita, el molde probado, uno de once cumpliéndola.
- **Nivel 2 — los fallos** *(futuro)*: cuando algo revienta —una página, una
  petición, un componente— se captura. Telemetría de fallos.
- **Nivel 3 — el uso** *(futuro)*: qué se usa y dónde se traba el operador.
  Optimización de producto.

**La tubería Export/Import YA EXISTE y es el vehículo de los tres.** El JSON
viaja del cliente a quien trabaja el backlog y vuelve por `importarAtendidos`,
que cierra **por id**, en una transacción y de forma idempotente. FORTRESS
aprende de cada instalación, en cada máquina, por ese mismo canal. **Los tres
niveles la llenan; la tubería no cambia.**

## Fases

Este arco es el Nivel 1, por trozos hasta end-to-end.

| fase | qué | por qué en ese orden |
|---|---|---|
| **1** | **EL CERCO** — el redactor de rutas y citas, más el barrido de las 8 ya filtradas | Tapa una fuga que **ya existe** antes de amplificarla |
| **2** | **EL CONTRATO COMÚN** — `"notes"` en los cinco de JSON, bloque delimitado en los de prosa | La forma, antes que los emisores |
| **3** | **EL DESPLIEGUE** — los ocho observan | Sobre terreno ya seguro |
| **4** | **VOCABULARIO + DEDUP** — cerrar `area` y contar `vistaEn: N` | Sin vocabulario cerrado el backlog de ocho agentes es ilegible |

**(a)** el fichero solo al cerrar: en la fase que encaje. **(b)** transmisión:
diferida al modelo comercial.

## Consecuencias

### Positivas

- La auto-mejora deja de depender de que el operador abra la base. **Lo que hoy
  se caza a mano, FORTRESS lo reporta sola.**
- El escáner, que es quien más código ajeno ve, pasa a ser la mayor fuente de
  aprendizaje sobre stacks que no son el nuestro — que es justo lo que el
  operador quería del producto.
- La frase «FORTRESS no manda tu código a ningún sitio» pasa a ser verificable.

### Negativas

- **Riesgo residual, dicho sin adornos: el cerco es best-effort contra texto
  libre.** Redacta rutas y citas; **no** atrapa lógica de negocio descrita en
  prosa sin cita. Reduce la fuga, no la elimina — y por eso (b) exige
  consentimiento en vez de apoyarse solo en el cerco.
- El backlog crece mucho: el escáner solo aporta 12 notas potenciales por
  escaneo. Sin la Fase 4 se vuelve ilegible, y la Fase 4 es la última.
- Cada agente que gana `"notes"` gasta prompt, y un prompt más largo es un
  contrato más difícil de cumplir. Se mitiga reusando el molde exacto que ya
  funciona en vez de redactar uno por agente.

### Neutras

- **Las 350 observaciones existentes**: el cerco protege las FUTURAS. Las **8**
  con rutas ajenas ya están escritas y ya son exportables hoy, así que el barrido
  que las redacta va **dentro de la Fase 1**: tapar lo nuevo y dejar lo viejo
  filtrado sería incoherente.
- `tool-detail.ts` es innegociable y no se toca. El cerco lo **llama**, como sus
  otros once llamantes.
- Ningún otro fichero del arco es innegociable: `self-note-item`,
  `observation-export`, `observation-order`, `parse-analysis`,
  `export-observations` y los prompts están libres.

## Alternativas descartadas

**Desplegar los agentes antes del cerco.** Era el orden que el arco tenía al
plantearse. **El dato lo descarta**: hay ocho fugas medidas en el backlog de hoy,
y ocho agentes observando las multiplicarían antes de que existiera nada que las
frenara. Sería el único caso del proyecto en que un arco deja el sistema peor de
lo que estaba.

**Rechazar toda observación que contenga una cita.** Más simple y más seguro de
implementar. Pero tira las ocho que tenemos, y las ocho son buenas: «el grafo no
indexa políticas RLS» es exactamente el material que esta ley existe para
recoger. Colapsar de más es peor que no colapsar — el mismo criterio de
[ADR-084](adr-084-identidad-por-linea-el-simbolo-sale.md).

**Transmisión automática sin consentimiento.** Quita fricción al cliente y da
ventaja operativa inmediata: el backlog de todas las instalaciones fluyendo solo.
Se descarta porque rompe lo único que el producto no puede reponer —la confianza
de quien te deja auditar su código— y porque contradice la ley que el propio
producto declara sobre el código ajeno. Un cliente que acepta una vez sabiendo
qué acepta no es fricción; uno que se entera después es un contrato roto.

**Deduplicar por descarte** (guardar la primera, tirar las repetidas). Mantendría
el backlog corto. Pero la repetición **es** la señal: una observación que llega
de tres stacks distintos dice que el hueco es estructural, y descartarla borra
justo el dato que la hace urgente.

**Un cerco por agente, en cada prompt.** Pedirle a cada modelo que no cite. Es lo
que ya se hace, y el corpus demuestra que falla: ocho de ocho cumplieron el tema
y se saltaron la cita. **Una petición al modelo no es una garantía** — la misma
lección que obligó a verificar la evidencia de los OBSOLETOS en vez de creerla.

## Código

`src/domain/system/self-observation.ts` · `src/domain/system/self-note-item.ts` ·
`src/domain/system/observation-export.ts` · `src/domain/system/observation-order.ts` ·
`src/domain/chat/tool-detail.ts` (innegociable, se llama) ·
`src/infrastructure/system/export-observations.ts` ·
`src/application/system/importar-atendidos.ts`

## Referencias

- [ADR-065](adr-065-nada-muere-sin-juicio.md) — ante la duda se conserva: por qué
  el cerco redacta en vez de rechazar.
- [ADR-081](adr-081-el-vocabulario-de-tipos-cubre-codigo-ajeno.md) — el molde para
  cerrar `area` en la Fase 4, y el corpus como método.
- [ADR-083](adr-083-campana-de-auditoria-por-plantillas.md) — el bloque delimitado
  `APLICA:…:END-APLICA` que la Fase 2 reusa para los agentes de prosa.
- [ADR-084](adr-084-identidad-por-linea-el-simbolo-sale.md) — el campo de texto
  libre es el que baila; y colapsar de más es peor que no colapsar.
