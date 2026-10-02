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
#   ./fortress-orchestrator.sh add <ruta>    → agregar un repo al orquestador
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
        echo "# Formato: NOMBRE|RUTA|GIT_REMOTE|GIT_BRANCH" >> "$REPOS_FILE"
        echo "# Ejemplo: nucleo|/home/user/projects/nucleo|origin|main" >> "$REPOS_FILE"
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

# ─── VEREDICTO DE PUSH ──────────────────────────────────────
# El informe y el HEAD escaneado viven en $REPORTS_DIR, fuera del repo:
# nada con escritura en el repo decide si el push sale. Falla cerrado.

report_file()  { echo "$REPORTS_DIR/$1-FORTRESS-REPORT.md"; }
scanned_head() { echo "$REPORTS_DIR/$1.scanned-head"; }

# Recuento de la linea de resumen "- <ETIQUETA>: N". Vacio si falta o es ambiguo.
report_count() {
    local values
    values=$(grep -iE "^[[:space:]]*[-*][[:space:]]*[*_]*($2)[*_]*[[:space:]]*:[*_[:space:]]*[0-9]+" "$1" 2>/dev/null \
        | sed -E 's/^[^:]*:[*_[:space:]]*([0-9]+).*/\1/' | sort -u || true)
    if [ -n "$values" ] && [ "$(printf '%s\n' "$values" | wc -l | tr -d ' ')" -eq 1 ]; then
        echo "$values"
    fi
}

# Imprime OK, NO_REPORT, STALE, UNPARSEABLE o CRITICAL:N.
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
    if [ -z "$crits" ]; then
        echo "UNPARSEABLE"
    elif [ "$crits" -gt 0 ]; then
        echo "CRITICAL:$crits"
    else
        echo "OK"
    fi
}

verdict_reason() {
    case "$1" in
        NO_REPORT)   echo "sin informe de escaneo en $REPORTS_DIR (ejecutar scan)";;
        STALE)       echo "el informe no corresponde al HEAD actual (re-escanear)";;
        UNPARSEABLE) echo "el informe no trae una linea '- CRITICAL: N' legible";;
        CRITICAL:*)  echo "tiene ${1#CRITICAL:} hallazgo(s) CRITICAL sin resolver";;
    esac
}

# ─── COMANDOS PRINCIPALES ──────────────────────────────────

cmd_add() {
    local path="${1:?Uso: fortress-orchestrator.sh add /ruta/al/proyecto}"
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

    # Verificar si ya existe
    if grep -q "|${path}|" "$REPOS_FILE" 2>/dev/null; then
        log_warn "$name ya está configurado."
        return
    fi

    echo "${name}|${path}|${remote}|${branch}" >> "$REPOS_FILE"
    log_success "Repo agregado: $name ($path)"
    log_info "Remote: $remote | Branch: $branch"
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
        echo -e "     Status:   $status  Changes: $changes  CLAUDE.md: $has_claude  Graph: $has_graph"
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

    while IFS= read -r line; do
        local name=$(get_repo_field "$line" 1)
        local path=$(get_repo_field "$line" 2)

        if ! verify_repo "$line" 2>/dev/null; then
            continue
        fi

        # El informe se escribe fuera del repo; el anterior no sobrevive al scan
        local report=$(report_file "$name")
        rm -f "$report" "$(scanned_head "$name")"
        local report_rule="Escribe el reporte en $report (fuera del repo, NO en la raíz del proyecto) e incluye en el resumen la línea exacta '- CRITICAL: N'."

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

        claude --headless --project "$path" "$prompt" \
            > "$LOGS_DIR/${name}-$(date +%Y%m%d).log" 2>&1 &

        pids+=($!)
        names+=("$name")
    done <<< "$(get_repos)"

    # Esperar que todos terminen
    echo ""
    log_info "Esperando que terminen los ${#pids[@]} scans..."
    echo ""

    local failed=0
    for i in "${!pids[@]}"; do
        if wait "${pids[$i]}" 2>/dev/null; then
            # Solo un scan completado liga el informe al HEAD que vio al empezar
            echo "${heads[$i]}" > "$(scanned_head "${names[$i]}")"
            log_success "${names[$i]}: scan completado"
        else
            log_error "${names[$i]}: scan falló (ver $LOGS_DIR/${names[$i]}-*.log)"
            failed=$((failed + 1))
        fi
    done

    echo ""
    if [ $failed -eq 0 ]; then
        log_success "Todos los scans completados exitosamente."
    else
        log_warn "$failed scan(s) fallaron. Revisar logs en $LOGS_DIR/"
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

        # Veredicto fuera del repo, ligado al HEAD; sin veredicto valido bloquea
        local verdict=$(repo_verdict "$name" "$path")

        if [ "$verdict" != "OK" ]; then
            blocked_repos+=("$name|$path|$remote|$branch")
            log_error "$name: ${RED}BLOQUEADO${NC} — $(verdict_reason "$verdict")"
        else
            ready_repos+=("$name|$path|$remote|$branch")
            log_success "$name: ${GREEN}LISTO${NC} para push"
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

    echo -e "${YELLOW}¿Ejecutar push en ${#ready_repos[@]} repo(s)?${NC}"
    echo -e "Repos: $(for r in "${ready_repos[@]}"; do echo -n "$(echo $r | cut -d'|' -f1) "; done)"
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

    while IFS= read -r line; do
        local name=$(get_repo_field "$line" 1)
        local path=$(get_repo_field "$line" 2)
        local branch=$(get_repo_field "$line" 4)

        if [ ! -d "$path" ]; then
            echo "| $name | — | — | — | — | ❌ NOT FOUND |" >> "$UNIFIED_REPORT"
            continue
        fi

        local changes=$(cd "$path" && git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
        local report=$(report_file "$name")
        local crits=$(report_count "$report" 'CRITICAL|CR(I|Í)TICOS?')
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
    echo -e "  ${CYAN}add${NC} <ruta>        Agregar un repositorio"
    echo -e "  ${CYAN}remove${NC} <nombre>   Quitar un repositorio"
    echo -e "  ${CYAN}list${NC}              Listar repos configurados"
    echo -e "  ${CYAN}status${NC}            Ver estado de cada repo"
    echo -e "  ${CYAN}scan${NC} [tipo]       Escanear todos los repos"
    echo -e "                    Tipos: full (default), security, clean, bugs"
    echo -e "  ${CYAN}push${NC}              Push coordinado (más seguro primero)"
    echo -e "  ${CYAN}report${NC}            Generar reporte unificado"
    echo -e "  ${CYAN}help${NC}              Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  ./fortress-orchestrator.sh add ~/projects/nucleo"
    echo "  ./fortress-orchestrator.sh add ~/projects/wudi"
    echo "  ./fortress-orchestrator.sh add ~/projects/omega"
    echo "  ./fortress-orchestrator.sh scan security"
    echo "  ./fortress-orchestrator.sh push"
}

# ─── MAIN ───────────────────────────────────────────────────

init
check_dependencies

case "${1:-help}" in
    add)      cmd_add "${2:-}";;
    remove)   cmd_remove "${2:-}";;
    list)     cmd_list;;
    status)   cmd_status;;
    scan)     cmd_scan "${2:-full}";;
    push)     cmd_push;;
    report)   cmd_report;;
    help|-h)  cmd_help;;
    *)        log_error "Comando desconocido: $1"; cmd_help; exit 1;;
esac
