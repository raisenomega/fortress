# FORTRESS — Overview

## Qué es

FORTRESS Command Center es una aplicación de escritorio (Electron + React +
TypeScript) que audita y mantiene múltiples proyectos de código con agentes de
Claude Code que actúan de verdad dentro de cada proyecto: leen archivos,
escanean seguridad, editan, verifican con los tests del propio proyecto y
miran la superficie web desde fuera.

La diferencia con un asistente de chat es que FORTRESS ejecuta con frenos
explícitos: allowlist mínimo de comandos, confianza por proyecto (Workspace
Trust), presupuestos de tokens, gates herméticos y firma humana para los
cambios que importan. Y se mejora a sí misma con cada trabajo: registra lo que
sus agentes aprenden, propone sus propias capacidades y repara su propio
código bajo la misma disciplina que aplica a los demás.

Todo corre en local. No hay servidores propios, ni telemetría, ni datos que
salgan del equipo del operador. Construida nativa sobre Claude (Anthropic),
sin capas de traducción a otros modelos.

## Para quién es

- Desarrolladores que mantienen varios proyectos a la vez y quieren auditoría
  y reparación continuas sin ceder el control.
- Equipos pequeños que necesitan un veredicto honesto de seguridad y calidad
  por proyecto, con evidencia (archivo:línea), no opiniones.
- Auditoría de seguridad de repos propios y de su superficie web externa.

## Qué hace

- **Consola multi-proyecto:** N proyectos en una ventana, con score y
  actividad; todo aislado por proyecto.
- **Chat que actúa (streaming):** conversa y ejecuta en el directorio del
  proyecto; la API key se cifra con el keychain y nunca cruza al renderer.
- **Escaneo de seguridad:** hallazgos reales con evidencia y score
  determinista; el escáner nunca se autoverifica.
- **11 agentes especializados:** despachados por tarea (Security Reviewer,
  Code Reviewer, Planner, TDD Guide, etc.); el undécimo es Sentinel OMEGA,
  meta-auditor testigo-no-actor que verifica al resto contra el filesystem.
- **Workspace Trust:** confianza por proyecto (default: false); sin ella no
  hay auto-ejecución ni loop.
- **COGNITION-LOG:** el cerebro por proyecto — patrones, reflexiones y mapa
  de atención que los agentes leen al arrancar y escriben al terminar.
- **Knowledge Graph:** grafo del código consultado antes de leer archivos
  (grafo primero, archivo después); se realinea solo cuando el HEAD cambia.
- **Superficie externa (posture):** audita la web propia desde fuera, solo
  lectura y con confirmación de propiedad.
- **Loop autónomo con debate juez/defensa:** ciclo escaneo → arreglo →
  verificación → re-escaneo con frenos obligatorios de coste y ciclos; al
  degradar, prueba alternativas y gana quien sube el score real.
- **Backlog de auto-mejora:** lo que un agente descubre de FORTRESS mientras
  trabaja en otro proyecto va a un backlog propio, no al proyecto ajeno.
- **Ciclo de vida de capacidades auto-propuestas:** episodios reales → fase
  aprobada → madurez derivada de evidencia; OMEGA puede vetar, el humano
  aprueba lo irreversible.
- **Bucle de génesis:** entrena capacidades en bucle, con topes de coste
  obligatorios y firma humana para agentes nuevos.

## Qué NO es / qué NO hace

- No es SaaS: no hay backend propio, ni cuentas, ni nube. SQLite local.
- No es autónomo total: las decisiones críticas (merge de fixes, promoción de
  agentes, push a origin) exigen firma humana. Por diseño, no por limitación.
- No envía datos a servidores de FORTRESS (no existen). Las llamadas al
  modelo salen del proceso principal directo a la API de Anthropic.
- No infla notas: sin evidencia, el puntaje es nulo, no un número inventado.
  Un sistema que se pone su propia nota es lo que OMEGA existe para detectar.
- No reemplaza al humano en el juicio final; le da evidencia para decidir.

## Cómo funciona (10.000 pies)

1. El operador registra un proyecto y decide cuánta confianza le da.
2. FORTRESS escanea con sus agentes y persiste hallazgos con evidencia; el
   score es determinista y reproducible.
3. El chat y el loop ejecutan de verdad — con allowlist, presupuestos y
   frenos; OMEGA atestigua sin actuar.
4. El motor de auto-reparación propone fixes en worktrees aislados, los pasa
   por un gate hermético y un revisor semántico independiente, y espera la
   firma humana antes de tocar la rama principal.
5. Todo queda asentado: libro de vida por propuesta, COGNITION-LOG por
   proyecto, log eterno de OMEGA.

## Estado actual (versión 1.0.0, 2026-08-11)

Estado honesto: ✔ hecho · ◑ parcial · ○ pendiente.

**Operativo (✔):** consola multi-proyecto · chat con streaming que actúa ·
escaneo de seguridad con score determinista · push bloqueado por CRITICAL ·
los 11 agentes · Workspace Trust · COGNITION-LOG · Knowledge Graph con
realineado automático · superficie externa · Sentinel OMEGA (leyenda:
testigo-no-actor, evidencia-o-silencio) · loop autónomo con debate y frenos ·
backlog de auto-mejora · seed de refuerzo · bucle de génesis con topes.

**Motor de auto-reparación disciplinado (capítulo nuevo):**

- ✔ C1 (elegir hallazgo, determinista) → C2 (entender, grafo-primero, puede
  dictaminar OBSOLETO y extinguir) → C3 (generar fix en worktree aislado, con
  correa de alcance y presupuesto) → Gate hermético (npm ci + typecheck +
  lint + test:unit dentro del worktree) → OMEGA (revisor semántico
  independiente, 6 ejes, el motor recomputa el veredicto).
- ✔ Cadena end-to-end probada en vivo: el espécimen 675723c5 recorrió
  C2 → C3 → Gate → OMEGA APROBADO con evidencia completa en su libro de vida.
- ◑ Reintento explícito de propuestas rechazadas: implementado, con gate
  verde y esperando firma humana.
- ○ Firma humana y merge local del fix aprobado (siguiente incremento).
- ○ Retiro del loop autónomo viejo en favor del motor disciplinado.

**Parcial (◑):** ciclo de vida de capacidades (falta auto-promoción de lo
reversible) · agente auto-creado (v1: redacción humana) · auto-creación
autónoma acotada (un disparo humano) · chat general conversacional (en
elevación) · presentación unificada del score de calidad general.

**Pendiente (○):** crear un proyecto desde cero a nivel producción (modo
Construir) · pipeline de despliegue desde el chat · instalador universal.

**Documentación:** el grueso de `docs/` ya está: los documentos
fundacionales, el capítulo del motor de auto-reparación y el del sistema
pre-motor (flujos, vistas y ADRs). Quedan la historia y los documentos
operativos, en fases posteriores del plan documental interno
(`internal/FORTRESS-GUIA-DOCUMENTACION-*.md`).

## Próximos pasos

Ver `docs/ROADMAP.md` (por crear en Fase 4 del plan documental): roadmap
técnico público de los próximos bloques.

## Documentos siguientes

- Para arquitectura: `docs/ARCHITECTURE.md`
- Para principios: `docs/PRINCIPLES.md`
- Para modelo de seguridad: `docs/SECURITY-MODEL.md`
- Para glosario: `docs/GLOSSARY.md`
