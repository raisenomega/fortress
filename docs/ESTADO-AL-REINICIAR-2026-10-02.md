# Estado al reiniciar — 2026-10-02

Nota de continuidad para retomar exacto. **Lo durable de este dia vive en
[ROADMAP](ROADMAP.md) y [DEUDAS](DEUDAS.md) §15 y §16**; esto es solo el puntero.

## Donde quedamos

Se **midio** la correa de dependencias (sin construir nada) y se parte en dos
piezas que no tienen el mismo dueno:

### Pieza A — casi gratis, lista para construir

Declarar un **grupo de alcance** en `.fortress/config`:

```json
{ "scope": { "groups": [
  { "name": "dependencias", "when": "package.json", "allow": ["package-lock.json"] }
]}}
```

**Cero codigo**: el mecanismo `ScopeGroup` ya existe y es declarativo. Probado con
el codigo real: el glob es valido, el grupo parsea, `allowsFor('package.json')`
devuelve el lock, y `checkScope` pasa de **violacion** a **ok**. Un grupo
tramposo (`allow: ['**']`) se rechaza solo.

Falta: **un ADR corto** —ensancha la correa, y eso se firma— y **una corrida de
prueba del `npm install` dentro de la caja clase A** (~$1), que nunca se ha
medido. **Cierra los CVEs de JS** (vitest, transitivas de electron-builder): los
~$1,50 que se quemaron el 2-oct en dos negativas honestas.

**PENDIENTE: la firma de Jojo para el ADR. Luego construir.**

### Pieza B — otro arco, y es decision de Jojo

**El Electron (HIGH, `9e64bb68`) NO lo cierra la correa.** El analista lo dejo
escrito: la linea 39 esta fuera de soporte y «el arreglo es **subir de major**».
Y eso es exactamente lo que **ADR-108 §3.5** dejo fuera del Motor por firma: con
el devdir en solo lectura y una version que no esta en la cache del HOST,
`node-gyp` falla en el `mkdir` **antes de intentar la red**. Medido en la
maquina: `~/.electron-gyp/` tiene **solo 39.8.10**.

Para cerrarlo hay que **reabrir §3.5**: poblar la cache del host con las
cabeceras de la version destino (gesto humano) o montar un devdir escribible
—que el argumento de la trifecta rechazo—. **No es falta de capacidad: es una
decision firmada.**

## Lo MEDIDO que no hay que re-medir

1. **El generador ya puede correr `npm`**, como `claude -p`: tiene **Bash**
   (`capacidadesDe` lo deriva de `--disallowedTools`, y el Motor lanza sin el —
   medido en vivo el 21-sep), **red** a `registry.npmjs.org` (la caja clase A
   abre los registros del ecosistema que el proyecto declara) y **escritura**
   (`acceptEdits`). Lo unico que lo frena hoy es `checkScope`, no su capacidad.
2. **`ScopeGroup` ya existe**: declarativo, dirigido por `when`, con su validador.
3. **La correa es SOLO del Motor** (0 usos en el Terminal) y **el Motor solo
   corre sobre FORTRESS** (ADR-107). **No toca clientes.**
4. **El riesgo** no es el montaje ni la red —el `npm ci` del gate ya ejecuta
   `postinstall` de terceros en la caja—: es que **un lock regenerado son miles
   de lineas** que OMEGA tiene que juzgar y que **siempre iran a la firma de
   Jojo** (`maxDiffLines: 10` impide el auto-merge).
5. **Por que el lock queda fuera hoy**: los hermanos solo existen para
   `.ts/.tsx`, y con el ancla en la raiz el `hint` no anade nada (restauracion
   deliberada tras una medicion).

## Las cuatro deudas del dia

| | |
|---|---|
| **el recibo del lazo** | §15.2 — cuando el lazo NO da la vuelta no deja rastro |
| **la mitad del PARCIAL** | §15.4 — la lista `files` sigue negra, docs sin actualizar, **asar sin verificar** |
| **la guia del orden de firma** | §16.4 — comodidad, no seguridad |
| **la correa de dependencias** | esta nota, piezas A y B |

## El proximo paso: lo decide Jojo

- **firmar el ADR corto de la pieza A** (cierra los CVEs), o
- **reabrir ADR-108 §3.5** (el Electron), o
- cualquiera de las tres deudas menores, o
- otra cosa.

## Nota operativa del arranque

Al abrir la app, **`reclaimWorktrees` limpia los 11 worktrees terminales**
(6,4 GB de `node_modules` reinstalables). **Es esperado y no se pierde nada: las
RAMAS se quedan** —`repair/8c7ac26d-…` tiene los dos commits del lazo, y esta
tambien en el bundle del USB—. La evidencia vive en la rama, en el libro y en los
docs; nunca estuvo en el worktree.

Las 104 ramas locales (`fix/`, `feat/`, `medicion/`) **no estan publicadas**:
viven en el disco y en el bundle del USB. `origin` solo tiene `main`, por
doctrina.
