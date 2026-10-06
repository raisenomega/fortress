#!/bin/bash
# TEMPLATE UNIVERSAL — Se distribuye a otros proyectos.
# NO documenta a FORTRESS mismo. Ver docs/ para la doc de FORTRESS.
# ═══════════════════════════════════════════════════════════════
# FORTRESS ORCHESTRATOR — Multi-Repo Coordination Script
# Lanza N instancias de Claude Code en paralelo, coordina scans,
# decide orden de push, y genera reportes unificados.
#
# Uso:
#   ./fortress-orchestrator.sh scan          → escanear todos los repos
#   ./fortress-orchestrator.sh status        → ver estado de cada repo
#   ./fortress-orchestrator.sh push          → push coordinado (más seguro primero)
#   ./fortress-orchestrator.sh clean         → limpieza de código en todos
#   ./fortress-orchestrator.sh security      → scan de seguridad en todos
#   ./fortress-orchestrator.sh report        → generar reporte unificado
#   ./fortress-orchestrator.sh add <ruta> [--trust] → agregar un repo (sin --trust queda NO confiable)
#   ./fortress-orchestrator.sh trust <nombre> → declarar confianza: el scan solo lanza claude en repos confiables
#   ./fortress-orchestrator.sh remove <nombre> → quitar un repo
#   ./fortress-orchestrator.sh list          → listar repos configurados
#
# Requisitos:
#   · Claude Code instalado (npm install -g @anthropic-ai/claude-code)
#   · Modo headless disponible (claude --headless)
#   · bash 4+, jq (para parsear JSON)
#
# Clasificación: INTERNO · NO COMMITEAR
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

# ─── CONFIGURACIÓN ──────────────────────────────────────────

FORTRESS_DIR="$HOME/.fortress"
REPOS_FILE="$FORTRESS_DIR/repos.conf"
REPORTS_DIR="$FORTRESS_DIR/reports"
LOGS_DIR="$FORTRESS_DIR/logs"
UNIFIED_REPORT="$REPORTS_DIR/unified-$(date +%Y%m%d-%H%M%S).md"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# ─── INICIALIZACIÓN ─────────────────────────────────────────

init() {
    mkdir -p "$FORTRESS_DIR" "$REPORTS_DIR" "$LOGS_DIR"
    if [ ! -f "$REPOS_FILE" ]; then
        echo "# FORTRESS ORCHESTRATOR — Repos configurados" > "$REPOS_FILE"
        echo "# Formato: NOMBRE|RUTA|GIT_REMOTE|GIT_BRANCH|TRUSTED" >> "$REPOS_FILE"
        echo "# TRUSTED: literal 'trusted', y SOLO lo declara el operador (comando trust)." >> "$REPOS_FILE"
        echo "# Campo ausente o distinto = NO confiable: el scan no lanza claude sobre ese repo." >> "$REPOS_FILE"
        echo "# Ejemplo: nucleo|/home/user/projects/nucleo|origin|main|trusted" >> "$REPOS_FILE"
    fi
}

# ─── UTILIDADES ─────────────────────────────────────────────

log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; }
log_header()  { echo -e "\n${PURPLE}${BOLD}═══ $1 ═══${NC}\n"; }

get_repos() {
    grep -v '^#' "$REPOS_FILE" | grep -v '^$' || true
}

get_repo_count() {
    get_repos | wc -l | tr -d ' '
}

get_repo_field() {
    echo "$1" | cut -d'|' -f"$2"
}

timestamp() {
    date '+%Y-%m-%d %H:%M:%S'
}

# ─── VERIFICACIONES ─────────────────────────────────────────

check_dependencies() {
    local missing=0

    if ! command -v claude &> /dev/null; then
        log_error "Claude Code no está instalado."
        log_info "Instalar con: npm install -g @anthropic-ai/claude-code"
        missing=1
    fi

    if ! command -v git &> /dev/null; then
        log_error "Git no está instalado."
        missing=1
    fi

    if ! command -v jq &> /dev/null; then
        log_warn "jq no está instalado. Algunas funciones serán limitadas."
        log_info "Instalar con: sudo apt install jq (Linux) / brew install jq (Mac)"
    fi

    if [ $missing -eq 1 ]; then
        exit 1
    fi
}

verify_repo() {
    local name=$(get_repo_field "$1" 1)
    local path=$(get_repo_field "$1" 2)

    if [ ! -d "$path" ]; then
        log_error "$name: directorio no existe ($path)"
        return 1
    fi

    if [ ! -d "$path/.git" ]; then
        log_error "$name: no es un repositorio git ($path)"
        return 1
    fi

    if [ ! -f "$path/CLAUDE.md" ]; then
        log_warn "$name: no tiene CLAUDE.md (recomendado)"
    fi

    return 0
}

# Confianza por repo: LEER no la pide, EJECUTAR si. El scan EJECUTA —
# claude --headless carga hooks, .mcp.json y CLAUDE.md que controla el
# repo auditado— asi que exige el campo 5 'trusted' declarado por el
# operador. Ausente o distinto = NO confiable: falla cerrado.
repo_trusted() {
    [ "$(get_repo_field "$1" 5)" = "trusted" ]
}

# ─── REDACCIÓN DE SECRETOS ──────────────────────────────────
# Lo que se persiste en ~/.fortress se tacha ANTES de quedarse: el prompt de
# 'security' ordena buscar secrets hardcodeados y el hijo los cita como
# evidencia en su log y en su informe. Se tacha el fichero ENTERO y tras morir
# el proceso, no por trozo: un secreto partido entre dos chunks no casa con
# ningun patron. Patrones POR VALOR y acotados —cada uno nombra a su emisor—:
# un comodin ancho borra la evidencia que un auditor necesita (ids de commit,
# digests) y puede comerse la linea '- CRITICAL: N' que decide el push.
# Excepciones ancladas por CONTEXTO, no por forma: el secreto de AWS (40
# caracteres, como un SHA) solo tras su nombre de clave, y la contrasena de
# una URL solo entre 'esquema://usuario:' y '@'; esquema, usuario y host quedan.

redact_file() {
    local file="$1"
    [ -f "$file" ] || return 0
    local tmp
    tmp=$(mktemp)
    if sed -E \
        -e 's/[sS][kK]-[aA][nN][tT]-[A-Za-z0-9_-]{6,}/***/g' \
        -e 's/(^|[^A-Za-z0-9_])gh[pousr]_[A-Za-z0-9]{16,}/\1***/g' \
        -e 's/(^|[^A-Za-z0-9_])github_pat_[A-Za-z0-9_]{20,}/\1***/g' \
        -e 's/[bB][eE][aA][rR][eE][rR][[:space:]]+[^[:space:]]+/***/g' \
        -e 's/(^|[^A-Za-z0-9_])A[KS]IA[0-9A-Z]{16}([^A-Za-z0-9_]|$)/\1***\2/g' \
        -e 's/(^|[^A-Za-z0-9_])[spr]k_(live|test)_[A-Za-z0-9]{10,}/\1***/g' \
        -e 's/(^|[^A-Za-z0-9_])AIza[0-9A-Za-z_-]{35}/\1***/g' \
        -e 's/(([aA][wW][sS]_?)?[sS][eE][cC][rR][eE][tT]_?[aA][cC][cC][eE][sS][sS]_?[kK][eE][yY]["'"'"']?[[:space:]]*[:=][[:space:]]*["'"'"']?)[A-Za-z0-9\/+]{40}/\1***/g' \
        -e 's/([A-Za-z][A-Za-z0-9+.-]*:\/\/[^:\/@[:space:]]*):[^@\/[:space:]]+@/\1:***@/g' \
        -e 's/(^|[^A-Za-z0-9_])xox[abprs]-[A-Za-z0-9-]{10,}/\1***/g' \
        -e 's/(^|[^A-Za-z0-9_])eyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/\1***/g' \
        -e '/-----BEGIN [A-Z ]*PRIVATE KEY-----/,/-----END [A-Z ]*PRIVATE KEY-----/ s/^[A-Za-z0-9+\/=]+[[:space:]]*$/***/' \
        "$file" > "$tmp"; then
        mv "$tmp" "$file"
    else
        # Falla cerrado: antes sin artefacto que artefacto sin tachar.
        rm -f "$tmp" "$file"
    fi
}

# ─── VEREDICTO DE PUSH ──────────────────────────────────────
# El informe y el HEAD escaneado viven en $REPORTS_DIR, fuera del repo:
# nada con escritura en el repo decide si el push sale. Falla cerrado.
# Limite conocido: el informe lo REDACTA el claude del scan, que corre
# DENTRO del repo auditado con sus hooks, .mcp.json y CLAUDE.md cargados.
# OK certifica 'el agente afirmo 0 CRITICAL sobre ese HEAD', nunca 'el
# repo esta limpio': un repo que inyecte a su auditor obtiene el OK. Por
# eso el push es siempre humano y la confirmacion enseña la evidencia
# literal (linea casada, informe, HEAD) antes del gesto del operador.

report_file()  { echo "$REPORTS_DIR/$1-FORTRESS-REPORT.md"; }
scanned_head() { echo "$REPORTS_DIR/$1.scanned-head"; }

# Recuento declarado en la linea de resumen "- <ETIQUETA>: N". Vacio si falta
# o es ambiguo. Lo escribe el mismo agente que leyo el repo: por si solo no
# decide nada, se contrasta con findings_count. No mira la seccion: una linea
# citada como evidencia cuenta igual que la del resumen (y, si discrepa, el
# informe sale ambiguo: falla cerrado).
report_count() {
    local values
    values=$(grep -iE "^[[:space:]]*[-*][[:space:]]*[*_]*($2)[*_]*[[:space:]]*:[*_[:space:]]*[0-9]+" "$1" 2>/dev/null \
        | sed -E 's/^[^:]*:[*_[:space:]]*([0-9]+).*/\1/' | sort -u || true)
    if [ -n "$values" ] && [ "$(printf '%s\n' "$values" | wc -l | tr -d ' ')" -eq 1 ]; then
        echo "$values"
    fi
}

# Hallazgos CRITICAL del cuerpo: lineas "- **Severidad:** CRITICAL" del
# FORMATO DE REPORTE (CLAUDE.md), con las mismas variantes de markdown que
# report_count. Un 'CRITICAL/HIGH' sin rellenar cuenta: falla cerrado.
findings_count() {
    grep -ciE "^[[:space:]]*[-*][[:space:]]*[*_]*(Severidad|Severity)[*_]*[[:space:]]*:[*_[:space:]]*(CRITICAL|CR(I|Í)TIC[OA]S?)" "$1" 2>/dev/null || true
}

# Cifra de CRITICALs que respalda el veredicto: la del resumen solo si el
# cuerpo trae los mismos hallazgos. Vacio si falta, es ambigua o discrepa.
critical_count() {
    local summary=$(report_count "$1" 'CRITICAL|CR(I|Í)TICOS?')
    if [ -n "$summary" ] && [ "$summary" -eq "$(findings_count "$1")" ]; then
        echo "$summary"
    fi
}

# Imprime OK, NO_REPORT, STALE, UNPARSEABLE, MISMATCH:R:C o CRITICAL:N.
repo_verdict() {
    local name="$1" path="$2"
    local report=$(report_file "$name")
    local headfile=$(scanned_head "$name")

    if [ ! -f "$report" ]; then
        echo "NO_REPORT"; return
    fi

    local head=$(git -C "$path" rev-parse HEAD 2>/dev/null || true)
    local scanned=$(cat "$headfile" 2>/dev/null || true)
    if [ -z "$head" ] || [ "$head" != "$scanned" ]; then
        echo "STALE"; return
    fi

    local crits=$(report_count "$report" 'CRITICAL|CR(I|Í)TICOS?')
    local found=$(findings_count "$report")
    if [ -z "$crits" ]; then
        echo "UNPARSEABLE"
    elif [ "$crits" -ne "${found:-0}" ]; then
        echo "MISMATCH:$crits:${found:-0}"
    elif [ "$crits" -gt 0 ]; then
        echo "CRITICAL:$crits"
    else
        echo "OK"
    fi
}

# Veredicto del ref que se empuja. El scan audita el working tree, asi
# que el informe solo certifica el HEAD escaneado; el push publica la
# punta de refs/heads/<rama registrada>. Si no son el mismo commit (otra
# rama activa, HEAD desligado, rama borrada), saldria un commit que
# nadie escaneo: bloquea. Solo para la ruta de push; status y report
# siguen usando repo_verdict.
push_verdict() {
    local name="$1" path="$2" branch="$3"
    local verdict=$(repo_verdict "$name" "$path")
    if [ "$verdict" != "OK" ]; then
        echo "$verdict"; return
    fi

    local tip=$(git -C "$path" rev-parse --verify --quiet "refs/heads/$branch" 2>/dev/null || true)
    if [ -z "$tip" ]; then
        echo "NO_BRANCH"; return
    fi

    local current=$(git -C "$path" branch --show-current 2>/dev/null || true)
    local scanned=$(cat "$(scanned_head "$name")" 2>/dev/null || true)
    if [ "$current" != "$branch" ] || [ "$tip" != "$scanned" ]; then
        echo "BRANCH_MISMATCH"; return
    fi

    echo "OK"
}

verdict_reason() {
    case "$1" in
        OK)          echo "el agente del scan afirmo 0 CRITICAL sobre el HEAD escaneado (afirmacion del auditor, no verdad verificada)";;
        NO_REPORT)   echo "sin informe de escaneo en $REPORTS_DIR (ejecutar scan)";;
        STALE)       echo "el informe no corresponde al HEAD actual (re-escanear)";;
        UNPARSEABLE) echo "el informe no trae una linea de resumen '- CRITICAL: N' legible y unica";;
        MISMATCH:*)  local m="${1#MISMATCH:}"
                     echo "el resumen declara ${m%%:*} CRITICAL pero el cuerpo trae ${m#*:} hallazgo(s) con Severidad CRITICAL (corregir el informe o re-escanear)";;
        CRITICAL:*)  echo "tiene ${1#CRITICAL:} hallazgo(s) CRITICAL sin resolver";;
        NO_BRANCH)   echo "la rama registrada ya no existe en el repo (re-registrar o restaurarla)";;
        BRANCH_MISMATCH) echo "la punta de la rama registrada no es el commit escaneado (checkout en otra rama o HEAD desligado; re-escanear sobre esa rama)";;
    esac
}

# Evidencia literal para el operador: la(s) linea(s) de resumen que el
# veredicto caso en el informe. Solo se muestra junto al gesto de push;
# no decide nada — quien decide es report_count via repo_verdict.
report_evidence_lines() {
    grep -iE "^[[:space:]]*[-*][[:space:]]*[*_]*($2)[*_]*[[:space:]]*:[*_[:space:]]*[0-9]+" "$1" 2>/dev/null \
        | sort -u || true
}

# ─── COMANDOS PRINCIPALES ──────────────────────────────────

cmd_add() {
    local path="${1:?Uso: fortress-orchestrator.sh add /ruta/al/proyecto [--trust]}"
    local trust_flag="${2:-}"
    path=$(realpath "$path")

    if [ ! -d "$path" ]; then
        log_error "El directorio no existe: $path"
        exit 1
    fi

    if [ ! -d "$path/.git" ]; then
        log_error "No es un repositorio git: $path"
        exit 1
    fi

    local name=$(basename "$path")
    local remote=$(cd "$path" && git remote get-url origin 2>/dev/null || echo "local")
    local branch=$(cd "$path" && git branch --show-current 2>/dev/null || echo "main")

    # Fallo cerrado: '|' es el delimitador de repos.conf y name, remote y
    # branch los elige quien autoro el repo clonado — una rama 'main|trusted'
    # forjaria el campo 5 TRUSTED y el scan lanzaria claude sobre un repo no
    # confiable. Rechazar, nunca sanear: sanear escribiria en repos.conf una
    # identidad que el operador no declaro.
    local field value
    for field in name path remote branch; do
        value="${!field}"
        if [[ "$value" == *'|'* || "$value" == *[[:cntrl:]]* ]]; then
            log_error "No se agrega el repo: el campo $field contiene '|' o caracteres de control (valor: $(printf '%q' "$value"))."
            log_info "'|' es el delimitador de repos.conf: ese valor falsificaria el campo TRUSTED o romperia el parseo. Renombrar carpeta, remote o rama y reintentar."
            exit 1
        fi
    done

    # Verificar si ya existe
    if grep -q "|${path}|" "$REPOS_FILE" 2>/dev/null; then
        log_warn "$name ya está configurado."
        return
    fi

    # La confianza nace aqui y solo por gesto explicito del operador
    local trusted=""
    if [ "$trust_flag" = "--trust" ]; then
        trusted="|trusted"
    fi

    echo "${name}|${path}|${remote}|${branch}${trusted}" >> "$REPOS_FILE"
    log_success "Repo agregado: $name ($path)"
    log_info "Remote: $remote | Branch: $branch"

    if [ -n "$trusted" ]; then
        log_info "Confianza declarada por el operador (--trust): el scan lanzara claude sobre este repo."
    else
        log_warn "$name queda SIN confianza: el scan NO lanzara claude sobre el."
        log_info "Declararla con: ./fortress-orchestrator.sh trust $name"
    fi
}

cmd_trust() {
    local name="${1:?Uso: fortress-orchestrator.sh trust nombre}"
    local matches=$(get_repos | awk -F'|' -v name="$name" '$1 == name')

    if [ -z "$matches" ]; then
        log_error "Repo no configurado: $name"
        exit 1
    fi

    # El nombre nace de basename (add) y puede repetirse entre rutas.
    # La confianza es POR PROYECTO: con homonimos no se concede a
    # ninguno — ambiguo = falla cerrado, igual que repo_trusted.
    if [ "$(printf '%s\n' "$matches" | wc -l | tr -d ' ')" -gt 1 ]; then
        log_error "Nombre ambiguo: '$name' corresponde a varios repos:"
        printf '%s\n' "$matches" | cut -d'|' -f2 | while IFS= read -r repo_path; do
            log_error "  - $repo_path"
        done
        log_info "Desambiguar renombrando el campo NOMBRE en $REPOS_FILE (la ruta es la clave unica)."
        exit 1
    fi

    local line="$matches"

    if repo_trusted "$line"; then
        log_info "$name ya tiene confianza declarada."
        return
    fi

    local temp=$(mktemp)
    awk -F'|' -v OFS='|' -v name="$name" \
        '!/^#/ && $1 == name { $5 = "trusted" } { print }' "$REPOS_FILE" > "$temp"
    mv "$temp" "$REPOS_FILE"

    log_success "Confianza declarada: $name — el scan ya puede lanzar claude sobre el."
    log_warn "Confiar un repo entrega sus hooks, .mcp.json y CLAUDE.md al claude del scan."
}

cmd_remove() {
    local name="${1:?Uso: fortress-orchestrator.sh remove nombre}"
    local temp=$(mktemp)
    grep -v "^${name}|" "$REPOS_FILE" > "$temp"
    mv "$temp" "$REPOS_FILE"
    log_success "Repo removido: $name"
}

cmd_list() {
    log_header "REPOS CONFIGURADOS"
    local count=0

    while IFS= read -r line; do
        local name=$(get_repo_field "$line" 1)
        local path=$(get_repo_field "$line" 2)
        local remote=$(get_repo_field "$line" 3)
        local branch=$(get_repo_field "$line" 4)
        local is_trusted=$(repo_trusted "$line" && echo "${GREEN}✓${NC}" || echo "${RED}✗ (scan lo salta)${NC}")
        count=$((count + 1))

        if [ -d "$path" ]; then
            local status="${GREEN}✓${NC}"
            local changes=$(cd "$path" && git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
            local has_claude=$( [ -f "$path/CLAUDE.md" ] && echo "${GREEN}✓${NC}" || echo "${RED}✗${NC}" )
            local has_graph=$( [ -f "$path/.mcp.json" ] && echo "${GREEN}✓${NC}" || echo "${YELLOW}?${NC}" )
        else
            local status="${RED}✗${NC}"
            local changes="?"
            local has_claude="${RED}✗${NC}"
            local has_graph="${RED}✗${NC}"
        fi

        echo -e "  ${CYAN}${count}.${NC} ${BOLD}${name}${NC}"
        echo -e "     Path:     $path"
        echo -e "     Branch:   $branch"
        echo -e "     Status:   $status  Changes: $changes  CLAUDE.md: $has_claude  Graph: $has_graph  Trust: $is_trusted"
        echo ""
    done <<< "$(get_repos)"

    if [ $count -eq 0 ]; then
        log_info "No hay repos configurados."
        log_info "Agregar con: ./fortress-orchestrator.sh add /ruta/al/proyecto"
    fi
}

cmd_status() {
    log_header "ESTADO DE REPOS"

    echo -e "  ${BOLD}REPO              BRANCH     CHANGES   TESTS     CLAUDE.md  GRAPH     PUSH${NC}"
    echo    "  ──────────────────────────────────────────────────────────────────────────────"

    while IFS= read -r line; do
        local name=$(get_repo_field "$line" 1)
        local path=$(get_repo_field "$line" 2)
        local branch=$(get_repo_field "$line" 4)

        if [ ! -d "$path" ]; then
            echo -e "  ${RED}$name: directorio no encontrado${NC}"
            continue
        fi

        local changes=$(cd "$path" && git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
        local has_claude=$( [ -f "$path/CLAUDE.md" ] && echo "${GREEN}✓${NC}" || echo "${RED}✗${NC}" )
        local has_graph=$( [ -f "$path/.mcp.json" ] && echo "${GREEN}✓${NC}" || echo "${RED}✗${NC}" )

        local push_status="${GREEN}READY${NC}"
        if [ "$changes" -gt 0 ]; then
            push_status="${YELLOW}STAGED${NC}"
        fi

        # Veredicto fuera del repo, ligado al HEAD; sin veredicto valido bloquea
        if [ "$(repo_verdict "$name" "$path")" != "OK" ]; then
            push_status="${RED}BLOCKED${NC}"
        fi

        printf "  %-18s %-10s %-9s %-9s %-10b %-9b %b\n" \
            "$name" "$branch" "$changes" "—" "$has_claude" "$has_graph" "$push_status"
    done <<< "$(get_repos)"
}

cmd_scan() {
    local scan_type="${1:-full}"
    log_header "FORTRESS SCAN: $scan_type"

    local repo_count=$(get_repo_count)
    log_info "Lanzando scan en $repo_count repos en paralelo..."
    echo ""

    local pids=()
    local names=()
    local heads=()
    local logs=()
    local skipped=()

    while IFS= read -r line; do
        local name=$(get_repo_field "$line" 1)
        local path=$(get_repo_field "$line" 2)

        if ! verify_repo "$line" 2>/dev/null; then
            continue
        fi

        # Este scan EJECUTA: claude carga hooks, .mcp.json y CLAUDE.md que
        # controla el repo auditado, y los prompts le ordenan correr tests
        # y aplicar fixes. Sin confianza declarada, no se lanza (ruidoso).
        if ! repo_trusted "$line"; then
            log_warn "$name: ${RED}SALTADO${NC} — sin confianza declarada. Declararla con: ./fortress-orchestrator.sh trust $name"
            skipped+=("$name")
            continue
        fi

        # El informe se escribe fuera del repo; el anterior no sobrevive al scan
        local report=$(report_file "$name")
        rm -f "$report" "$(scanned_head "$name")"
        # La frase sobre secretos es cinturon: la red exigible es redact_file
        local report_rule="Escribe el reporte en $report (fuera del repo, NO en la raíz del proyecto) e incluye en el resumen la línea exacta '- CRITICAL: N'. Nunca cites un secreto en claro: como evidencia da archivo, línea y el valor tachado (p. ej. 'sk-ant-***')."

        local prompt=""
        case "$scan_type" in
            full)
                prompt="Ejecuta una revisión completa del proyecto: seguridad (FASE 1), código muerto (FASE 2), bugs (FASE 3), consistencia (FASE 4). Genera un reporte con todos los hallazgos, severidades, y fixes propuestos. $report_rule Si existe COGNITION-LOG.md, registra cada hallazgo nuevo como patrón."
                ;;
            security)
                prompt="Ejecuta SOLO la FASE 1 del protocolo de limpieza: buscar secrets hardcodeados, vulnerabilidades de inyección (SQL, XSS, command injection), verificar autenticación y autorización en todos los endpoints, verificar headers de seguridad, verificar rate limiting. $report_rule"
                ;;
            clean)
                prompt="Ejecuta FASE 2 (código muerto y basura) + FASE 4 (consistencia). Identifica funciones que nadie llama, imports sin usar, console.log de debugging, código comentado. NO elimines nada sin confirmar que es safe-to-delete. $report_rule"
                ;;
            bugs)
                prompt="Ejecuta FASE 3 completa: buscar errores no manejados, promises sin await, null/undefined sin verificar, comparaciones incorrectas, edge cases no cubiertos. Para cada bug: escribe test que lo reproduce, aplica fix, verifica test. $report_rule"
                ;;
        esac

        log_info "Lanzando: ${CYAN}$name${NC} ($scan_type)"

        heads+=("$(git -C "$path" rev-parse HEAD 2>/dev/null || true)")

        local logfile="$LOGS_DIR/${name}-$(date +%Y%m%d).log"
        claude --headless --project "$path" "$prompt" \
            > "$logfile" 2>&1 &

        pids+=($!)
        names+=("$name")
        logs+=("$logfile")
    done <<< "$(get_repos)"

    # Esperar que todos terminen
    echo ""
    log_info "Esperando que terminen los ${#pids[@]} scans..."
    echo ""

    local failed=0
    for i in "${!pids[@]}"; do
        local scan_ok=0
        wait "${pids[$i]}" 2>/dev/null && scan_ok=1
        # Muerto el hijo se tachan log e informe, en exito Y en fallo: el log
        # del scan fallido tambien se conserva y se manda revisar al operador.
        redact_file "${logs[$i]}"
        redact_file "$(report_file "${names[$i]}")"
        if [ "$scan_ok" -eq 1 ]; then
            # Solo un scan completado liga el informe al HEAD que vio al empezar
            echo "${heads[$i]}" > "$(scanned_head "${names[$i]}")"
            log_success "${names[$i]}: scan completado"
        else
            log_error "${names[$i]}: scan falló (ver ${logs[$i]})"
            failed=$((failed + 1))
        fi
    done

    echo ""
    if [ ${#pids[@]} -eq 0 ]; then
        log_warn "Ningun scan lanzado: este scan NO escaneo nada."
    elif [ $failed -eq 0 ]; then
        log_success "Todos los scans completados exitosamente."
    else
        log_warn "$failed scan(s) fallaron. Revisar logs en $LOGS_DIR/"
    fi

    # Un scan que salto repos no es un scan limpio de esos repos
    if [ ${#skipped[@]} -gt 0 ]; then
        log_warn "${#skipped[@]} repo(s) SIN ESCANEAR por falta de confianza: ${skipped[*]}"
        log_info "Declararla con: ./fortress-orchestrator.sh trust <nombre>"
    fi

    # Generar reporte unificado
    cmd_report_internal
}

cmd_push() {
    log_header "PUSH COORDINADO"

    local ready_repos=()
    local blocked_repos=()

    # Clasificar repos
    while IFS= read -r line; do
        local name=$(get_repo_field "$line" 1)
        local path=$(get_repo_field "$line" 2)
        local remote=$(get_repo_field "$line" 3)
        local branch=$(get_repo_field "$line" 4)

        if [ ! -d "$path" ]; then
            log_error "$name: directorio no encontrado, skip"
            continue
        fi

        local changes=$(cd "$path" && git status --porcelain 2>/dev/null | wc -l | tr -d ' ')

        if [ "$changes" -eq 0 ]; then
            log_info "$name: nada que pushear (working tree limpio)"
            continue
        fi

        # Veredicto fuera del repo, atado al ref que se empuja; sin veredicto valido bloquea
        local verdict=$(push_verdict "$name" "$path" "$branch")

        if [ "$verdict" != "OK" ]; then
            blocked_repos+=("$name|$path|$remote|$branch")
            log_error "$name: ${RED}BLOQUEADO${NC} — $(verdict_reason "$verdict")"
        else
            ready_repos+=("$name|$path|$remote|$branch")
            log_success "$name: ${GREEN}LISTO${NC} — $(verdict_reason "$verdict")"
        fi
    done <<< "$(get_repos)"

    echo ""

    # Bloquear si hay repos bloqueados
    if [ ${#blocked_repos[@]} -gt 0 ]; then
        log_warn "Repos bloqueados (sin informe valido del HEAD actual o con CRITICAL):"
        for repo in "${blocked_repos[@]}"; do
            local bname=$(echo "$repo" | cut -d'|' -f1)
            echo -e "  ${RED}⛔${NC} $bname — escanear el HEAD actual y resolver CRITICALs antes de push"
        done
        log_info "FORTRESS-REPORT.md dentro del repo ya no cuenta; el veredicto sale de $REPORTS_DIR."
        echo ""
    fi

    # Push de repos listos
    if [ ${#ready_repos[@]} -eq 0 ]; then
        log_info "No hay repos listos para push."
        return
    fi

    # Molde de cmd_trust: junto al gesto del operador, lo que el gesto
    # entrega. OK es la afirmacion del agente, no una verdad verificada;
    # la evidencia literal se enseña ANTES del 's' para que el push
    # siempre-humano sea un gesto informado.
    echo -e "${YELLOW}¿Ejecutar push en ${#ready_repos[@]} repo(s)?${NC}"
    echo -e "OK = el agente del scan afirmo 0 CRITICAL sobre ese HEAD; este script no verifico el codigo."
    for repo in "${ready_repos[@]}"; do
        local ename=$(echo "$repo" | cut -d'|' -f1)
        local ereport=$(report_file "$ename")
        local escanned=$(cat "$(scanned_head "$ename")" 2>/dev/null || true)
        local elines=$(report_evidence_lines "$ereport" 'CRITICAL|CR(I|Í)TICOS?')
        # Nombre, informe y HEAD salen de repos.conf y REPORTS_DIR: van como
        # argumento '%s', que no interpreta escapes; el color solo en el formato.
        printf "  ${CYAN}%s${NC}\n" "$ename"
        printf '     Informe:        %s\n' "$ereport"
        printf '     HEAD escaneado: %s\n' "${escanned:-?}"
        if [ -n "$elines" ]; then
            # La linea la redacto el agente: printf sin escapes, que un
            # informe hostil no repinte la evidencia con secuencias ANSI.
            printf '%s\n' "$elines" | while IFS= read -r eline; do
                printf '     Linea casada:   %s\n' "$eline"
            done
        else
            echo -e "     Linea casada:   (ninguna legible)"
        fi
    done
    echo ""
    read -p "Confirmar (s/N): " confirm

    if [[ ! "$confirm" =~ ^[sS]$ ]]; then
        log_info "Push cancelado."
        return
    fi

    for repo in "${ready_repos[@]}"; do
        local pname=$(echo "$repo" | cut -d'|' -f1)
        local ppath=$(echo "$repo" | cut -d'|' -f2)
        local premote=$(echo "$repo" | cut -d'|' -f3)
        local pbranch=$(echo "$repo" | cut -d'|' -f4)

        # Entre la clasificacion y este push mediaron la confirmacion y otros
        # pushes: re-verificar aqui cierra esa ventana sin abortar el bucle.
        local pverdict=$(push_verdict "$pname" "$ppath" "$pbranch")
        if [ "$pverdict" != "OK" ]; then
            log_error "$pname: ${RED}BLOQUEADO${NC} — $(verdict_reason "$pverdict")"
            continue
        fi

        log_info "Pushing $pname → $premote/$pbranch..."

        if (cd "$ppath" && git push "$premote" "$pbranch" 2>&1); then
            log_success "$pname: push exitoso ✓"
        else
            log_error "$pname: push falló"
        fi
    done
}

cmd_report_internal() {
    log_header "GENERANDO REPORTE UNIFICADO"

    cat > "$UNIFIED_REPORT" << 'HEADER'
# FORTRESS — Reporte Unificado Multi-Repo
## Generado por FORTRESS Orchestrator
HEADER

    echo "### Fecha: $(timestamp)" >> "$UNIFIED_REPORT"
    echo "" >> "$UNIFIED_REPORT"
    echo "---" >> "$UNIFIED_REPORT"
    echo "" >> "$UNIFIED_REPORT"
    echo "## Estado por Repositorio" >> "$UNIFIED_REPORT"
    echo "" >> "$UNIFIED_REPORT"
    echo "| Repo | Branch | Changes | CRITICALs | HIGHs | Push |" >> "$UNIFIED_REPORT"
    echo "|------|--------|---------|-----------|-------|------|" >> "$UNIFIED_REPORT"

    local untrusted_repos=()

    while IFS= read -r line; do
        local name=$(get_repo_field "$line" 1)
        local path=$(get_repo_field "$line" 2)
        local branch=$(get_repo_field "$line" 4)

        if [ -n "$name" ] && ! repo_trusted "$line"; then
            untrusted_repos+=("$name")
        fi

        if [ ! -d "$path" ]; then
            echo "| $name | — | — | — | — | ❌ NOT FOUND |" >> "$UNIFIED_REPORT"
            continue
        fi

        local changes=$(cd "$path" && git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
        local report=$(report_file "$name")
        local crits=$(critical_count "$report")
        local highs=$(report_count "$report" 'HIGH|ALTOS?')
        local verdict=$(repo_verdict "$name" "$path")
        local push_status="✅ READY"

        case "$verdict" in
            OK)        ;;
            NO_REPORT) push_status="⛔ BLOCKED (NO REPORT)";;
            *)         push_status="⛔ BLOCKED ($verdict)";;
        esac
        crits="${crits:-?}"
        highs="${highs:-?}"

        echo "| $name | $branch | $changes | $crits | $highs | $push_status |" >> "$UNIFIED_REPORT"
    done <<< "$(get_repos)"

    # Los repos sin confianza no se escanearon: el reporte lo dice, no lo calla
    if [ ${#untrusted_repos[@]} -gt 0 ]; then
        echo "" >> "$UNIFIED_REPORT"
        echo "## Repos SIN CONFIANZA — scan saltado" >> "$UNIFIED_REPORT"
        echo "" >> "$UNIFIED_REPORT"
        echo "El scan no lanza claude sobre repos sin confianza declarada (falla cerrado)." >> "$UNIFIED_REPORT"
        echo "Declararla con: \`./fortress-orchestrator.sh trust <nombre>\`" >> "$UNIFIED_REPORT"
        echo "" >> "$UNIFIED_REPORT"
        local u
        for u in "${untrusted_repos[@]}"; do
            echo "- $u" >> "$UNIFIED_REPORT"
        done
    fi

    echo "" >> "$UNIFIED_REPORT"
    echo "---" >> "$UNIFIED_REPORT"
    echo "" >> "$UNIFIED_REPORT"

    # Agregar contenido de cada reporte individual
    while IFS= read -r line; do
        local name=$(get_repo_field "$line" 1)
        local report=$(report_file "$name")

        if [ -f "$report" ]; then
            echo "## Reporte: $name" >> "$UNIFIED_REPORT"
            echo "" >> "$UNIFIED_REPORT"
            cat "$report" >> "$UNIFIED_REPORT"
            echo "" >> "$UNIFIED_REPORT"
            echo "---" >> "$UNIFIED_REPORT"
            echo "" >> "$UNIFIED_REPORT"
        fi
    done <<< "$(get_repos)"

    log_success "Reporte generado: $UNIFIED_REPORT"
}

cmd_report() {
    cmd_report_internal
    echo ""
    log_info "Abriendo reporte..."

    if command -v xdg-open &> /dev/null; then
        xdg-open "$UNIFIED_REPORT"
    elif command -v open &> /dev/null; then
        open "$UNIFIED_REPORT"
    else
        log_info "Reporte en: $UNIFIED_REPORT"
    fi
}

# ─── AYUDA ──────────────────────────────────────────────────

cmd_help() {
    echo -e "${BOLD}FORTRESS ORCHESTRATOR${NC} — Coordinación Multi-Repo"
    echo ""
    echo "Uso: ./fortress-orchestrator.sh <comando> [argumentos]"
    echo ""
    echo "Comandos:"
    echo -e "  ${CYAN}add${NC} <ruta>        Agregar un repositorio (queda sin confianza salvo --trust)"
    echo -e "  ${CYAN}trust${NC} <nombre>    Declarar confianza: habilita lanzar claude en ese repo"
    echo -e "  ${CYAN}remove${NC} <nombre>   Quitar un repositorio"
    echo -e "  ${CYAN}list${NC}              Listar repos configurados"
    echo -e "  ${CYAN}status${NC}            Ver estado de cada repo"
    echo -e "  ${CYAN}scan${NC} [tipo]       Escanear todos los repos CON confianza declarada"
    echo -e "                    Tipos: full (default), security, clean, bugs"
    echo -e "  ${CYAN}push${NC}              Push coordinado (más seguro primero)"
    echo -e "  ${CYAN}report${NC}            Generar reporte unificado"
    echo -e "  ${CYAN}help${NC}              Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  ./fortress-orchestrator.sh add ~/projects/nucleo"
    echo "  ./fortress-orchestrator.sh add ~/projects/wudi"
    echo "  ./fortress-orchestrator.sh add ~/projects/omega"
    echo "  ./fortress-orchestrator.sh trust nucleo"
    echo "  ./fortress-orchestrator.sh scan security"
    echo "  ./fortress-orchestrator.sh push"
}

# ─── MAIN ───────────────────────────────────────────────────

init
check_dependencies

case "${1:-help}" in
    add)      cmd_add "${2:-}" "${3:-}";;
    trust)    cmd_trust "${2:-}";;
    remove)   cmd_remove "${2:-}";;
    list)     cmd_list;;
    status)   cmd_status;;
    scan)     cmd_scan "${2:-full}";;
    push)     cmd_push;;
    report)   cmd_report;;
    help|-h)  cmd_help;;
    *)        log_error "Comando desconocido: $1"; cmd_help; exit 1;;
esac
