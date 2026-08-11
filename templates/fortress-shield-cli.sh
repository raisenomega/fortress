#!/bin/bash
# TEMPLATE UNIVERSAL — Se distribuye a otros proyectos.
# NO documenta a FORTRESS mismo. Ver docs/ para la doc de FORTRESS.
# ═══════════════════════════════════════════════════════════════
# FORTRESS SHIELD CLI — Scanner EASM desde Terminal
# Inspección REAL de dominios: headers, SSL, archivos, DNS, reputación
# 100% pasivo y legal · No penetra ni explota
#
# Uso:
#   ./fortress-shield-cli.sh scan dominio.com
#   ./fortress-shield-cli.sh scan dominio.com --full
#   ./fortress-shield-cli.sh scan dominio.com --quick
#   ./fortress-shield-cli.sh report dominio.com
#
# Requisitos: curl, openssl, dig (bind-utils), nmap (opcional)
#
# Clasificación: INTERNO · NO COMMITEAR
# ═══════════════════════════════════════════════════════════════

set -uo pipefail

# ─── CONFIGURACIÓN ──────────────────────────────────────────

SHIELD_DIR="$HOME/.fortress/shield"
REPORT_DIR="$SHIELD_DIR/reports"
VERSION="3.0"

# Colores
R='\033[0;31m'
G='\033[0;32m'
Y='\033[1;33m'
B='\033[0;34m'
P='\033[0;35m'
C='\033[0;36m'
W='\033[1;37m'
NC='\033[0m'
BOLD='\033[1m'

# Contadores
CRITICAL=0
HIGH=0
MEDIUM=0
LOW=0
OK=0
INFO=0

# ─── UTILIDADES ─────────────────────────────────────────────

init() {
    mkdir -p "$SHIELD_DIR" "$REPORT_DIR"
    DOMAIN="${1:?Uso: fortress-shield-cli.sh scan dominio.com}"
    DOMAIN=$(echo "$DOMAIN" | sed 's|https\?://||' | sed 's|/.*||')
    REPORT="$REPORT_DIR/${DOMAIN}_$(date +%Y%m%d-%H%M%S).md"
    TEMP_HEADERS=$(mktemp)
    TEMP_BODY=$(mktemp)
    TEMP_CERT=$(mktemp)
    trap "rm -f $TEMP_HEADERS $TEMP_BODY $TEMP_CERT" EXIT
}

header() {
    echo -e "\n${P}${BOLD}═══ $1 ═══${NC}\n"
    echo "" >> "$REPORT"
    echo "### $1" >> "$REPORT"
    echo "" >> "$REPORT"
}

finding() {
    local sev="$1" title="$2" desc="$3" fix="$4"
    local icon=""
    case "$sev" in
        CRITICAL) icon="🔴"; ((CRITICAL++));;
        HIGH)     icon="🟠"; ((HIGH++));;
        MEDIUM)   icon="🟡"; ((MEDIUM++));;
        LOW)      icon="🟢"; ((LOW++));;
        OK)       icon="✅"; ((OK++));;
        INFO)     icon="🔵"; ((INFO++));;
    esac
    echo -e "  ${icon} [${sev}] ${title}"
    echo -e "     ${desc}" | fold -s -w 75 | sed '2,$s/^/     /'
    if [ -n "$fix" ]; then
        echo -e "     ${C}→ FIX: ${fix}${NC}" | fold -s -w 75 | sed '2,$s/^/       /'
    fi
    echo ""

    # Escribir al reporte
    echo "#### ${icon} [${sev}] ${title}" >> "$REPORT"
    echo "" >> "$REPORT"
    echo "${desc}" >> "$REPORT"
    echo "" >> "$REPORT"
    if [ -n "$fix" ]; then
        echo "> **FIX:** ${fix}" >> "$REPORT"
        echo "" >> "$REPORT"
    fi
}

# ─── CAPA 1: TRANSPORTE Y CIFRADO ──────────────────────────

scan_transport() {
    header "CAPA 1: Transporte y Cifrado"

    # Test HTTPS
    local https_code=$(curl -sI -o /dev/null -w "%{http_code}" --max-time 10 "https://${DOMAIN}" 2>/dev/null || echo "000")

    if [ "$https_code" = "000" ]; then
        finding "CRITICAL" "HTTPS no disponible" \
            "https://${DOMAIN} no responde. El sitio no tiene HTTPS activo o el servidor está caído. Código: ${https_code}" \
            "Instalar certificado TLS: certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
        return
    elif [ "$https_code" = "200" ] || [ "$https_code" = "301" ] || [ "$https_code" = "302" ]; then
        finding "OK" "HTTPS activo" \
            "https://${DOMAIN} responde con código ${https_code}." ""
    else
        finding "MEDIUM" "HTTPS responde con código inesperado: ${https_code}" \
            "El servidor responde pero con código ${https_code}." \
            "Verificar configuración del servidor web."
    fi

    # Test HTTP → HTTPS redirect
    local http_code=$(curl -sI -o /dev/null -w "%{http_code}" --max-time 10 "http://${DOMAIN}" 2>/dev/null || echo "000")
    local http_location=$(curl -sI --max-time 10 "http://${DOMAIN}" 2>/dev/null | grep -i "^location:" | head -1)

    if echo "$http_location" | grep -qi "https://"; then
        finding "OK" "HTTP redirige a HTTPS" \
            "http://${DOMAIN} redirige correctamente: ${http_location}" ""
    elif [ "$http_code" != "000" ]; then
        finding "HIGH" "HTTP no redirige a HTTPS" \
            "http://${DOMAIN} responde con código ${http_code} sin redirigir a HTTPS. Usuarios que visiten por HTTP quedan expuestos a MITM." \
            "Agregar redirect en servidor: return 301 https://\$host\$request_uri;"
    fi

    # Certificado SSL
    if command -v openssl &> /dev/null; then
        local cert_info=$(echo | openssl s_client -connect "${DOMAIN}:443" -servername "${DOMAIN}" 2>/dev/null)

        if [ -n "$cert_info" ]; then
            # Extraer datos del certificado
            local cert_dates=$(echo "$cert_info" | openssl x509 -noout -dates 2>/dev/null)
            local cert_issuer=$(echo "$cert_info" | openssl x509 -noout -issuer 2>/dev/null | sed 's/issuer=//')
            local cert_subject=$(echo "$cert_info" | openssl x509 -noout -subject 2>/dev/null | sed 's/subject=//')
            local cert_enddate=$(echo "$cert_dates" | grep "notAfter" | cut -d= -f2)

            if [ -n "$cert_enddate" ]; then
                local end_epoch=$(date -d "$cert_enddate" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$cert_enddate" +%s 2>/dev/null || echo "0")
                local now_epoch=$(date +%s)
                local days_left=$(( (end_epoch - now_epoch) / 86400 ))

                if [ "$days_left" -lt 0 ]; then
                    finding "CRITICAL" "Certificado SSL EXPIRADO" \
                        "El certificado expiró hace ${days_left#-} días. Fecha: ${cert_enddate}. Emisor: ${cert_issuer}" \
                        "Renovar inmediatamente: certbot renew --force-renewal"
                elif [ "$days_left" -lt 7 ]; then
                    finding "CRITICAL" "Certificado SSL expira en ${days_left} días" \
                        "Expira: ${cert_enddate}. Emisor: ${cert_issuer}" \
                        "Renovar: certbot renew"
                elif [ "$days_left" -lt 30 ]; then
                    finding "HIGH" "Certificado SSL expira en ${days_left} días" \
                        "Expira: ${cert_enddate}. Emisor: ${cert_issuer}" \
                        "Programar renovación antes de la fecha."
                else
                    finding "OK" "Certificado SSL válido (${days_left} días restantes)" \
                        "Expira: ${cert_enddate}. Emisor: ${cert_issuer}" ""
                fi
            fi

            # TLS Version
            local tls_version=$(echo "$cert_info" | grep "Protocol" | head -1 | awk '{print $NF}')
            if [ -n "$tls_version" ]; then
                case "$tls_version" in
                    TLSv1.3) finding "OK" "TLS 1.3 activo" "Protocolo: ${tls_version} (el más seguro disponible)." "";;
                    TLSv1.2) finding "OK" "TLS 1.2 activo" "Protocolo: ${tls_version} (aceptable, considerar habilitar TLS 1.3)." "";;
                    TLSv1.1|TLSv1) finding "CRITICAL" "TLS obsoleto: ${tls_version}" \
                        "TLS 1.0/1.1 están deprecados desde 2020. Vulnerables a BEAST, POODLE." \
                        "Configurar: ssl_protocols TLSv1.2 TLSv1.3;";;
                    *) finding "INFO" "Protocolo TLS: ${tls_version}" "Verificar manualmente." "";;
                esac
            fi
        fi
    else
        finding "INFO" "openssl no disponible" \
            "No se pudo analizar el certificado SSL. Instalar openssl para análisis completo." \
            "sudo apt install openssl (Linux) / brew install openssl (Mac)"
    fi
}

# ─── CAPA 2: CABECERAS DE SEGURIDAD ────────────────────────

scan_headers() {
    header "CAPA 2: Cabeceras de Seguridad HTTP"

    # Obtener headers
    curl -sI --max-time 10 "https://${DOMAIN}" > "$TEMP_HEADERS" 2>/dev/null

    if [ ! -s "$TEMP_HEADERS" ]; then
        finding "CRITICAL" "No se pudieron obtener headers" \
            "https://${DOMAIN} no respondió a la petición de headers." \
            "Verificar que el servidor está corriendo."
        return
    fi

    # Verificar cada header de seguridad
    local headers_to_check=(
        "Strict-Transport-Security|HSTS ausente|HIGH|Agregar: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload"
        "Content-Security-Policy|CSP ausente|HIGH|Implementar CSP: default-src 'self'; script-src 'self'"
        "X-Frame-Options|X-Frame-Options ausente|MEDIUM|Agregar: X-Frame-Options: DENY"
        "X-Content-Type-Options|X-Content-Type-Options ausente|MEDIUM|Agregar: X-Content-Type-Options: nosniff"
        "Referrer-Policy|Referrer-Policy ausente|MEDIUM|Agregar: Referrer-Policy: strict-origin-when-cross-origin"
        "Permissions-Policy|Permissions-Policy ausente|LOW|Agregar: Permissions-Policy: camera=(), microphone=(), geolocation=()"
    )

    for check in "${headers_to_check[@]}"; do
        IFS='|' read -r hname title sev fix <<< "$check"
        local value=$(grep -i "^${hname}:" "$TEMP_HEADERS" | head -1 | sed "s/^${hname}: *//i" | tr -d '\r')

        if [ -n "$value" ]; then
            finding "OK" "${hname} presente" \
                "Valor: ${value}" ""
        else
            finding "$sev" "$title" \
                "El header ${hname} no está presente en la respuesta de https://${DOMAIN}." \
                "$fix"
        fi
    done

    # Headers que NO deberían estar (information leakage)
    local leak_headers=("Server" "X-Powered-By" "X-AspNet-Version" "X-AspNetMvc-Version")
    for lh in "${leak_headers[@]}"; do
        local lvalue=$(grep -i "^${lh}:" "$TEMP_HEADERS" | head -1 | sed "s/^${lh}: *//i" | tr -d '\r')
        if [ -n "$lvalue" ]; then
            finding "MEDIUM" "Header ${lh} expuesto: ${lvalue}" \
                "Revela tecnología del servidor. Un atacante puede buscar CVEs específicos para ${lvalue}." \
                "Remover o vaciar el header ${lh} en la configuración del servidor."
        fi
    done

    # Cache-Control para la página principal
    local cache=$(grep -i "^Cache-Control:" "$TEMP_HEADERS" | head -1 | tr -d '\r')
    if [ -z "$cache" ]; then
        finding "LOW" "Cache-Control ausente" \
            "Sin Cache-Control, el contenido podría cachearse en proxies intermedios." \
            "Para páginas con datos sensibles: Cache-Control: no-store"
    fi
}

# ─── CAPA 3: FINGERPRINTING TECNOLÓGICO ────────────────────

scan_tech() {
    header "CAPA 3: Fingerprinting Tecnológico"

    # Obtener HTML
    curl -s --max-time 15 "https://${DOMAIN}" > "$TEMP_BODY" 2>/dev/null

    if [ ! -s "$TEMP_BODY" ]; then
        finding "INFO" "No se pudo obtener HTML" \
            "El sitio no devolvió contenido HTML." ""
        return
    fi

    # Detectar meta generator
    local generator=$(grep -oi '<meta[^>]*name=["'\'']generator["'\''][^>]*content=["'\''][^"'\'']*["'\'']' "$TEMP_BODY" | head -1 | grep -oi 'content=["'\''][^"'\'']*' | sed 's/content=["'\'']//')
    if [ -n "$generator" ]; then
        finding "MEDIUM" "Meta generator expuesto: ${generator}" \
            "El CMS/framework se identifica públicamente. Facilita búsqueda de CVEs." \
            "Remover el meta tag generator del HTML."
    fi

    # Detectar frameworks JS
    local frameworks=""
    grep -q "__next" "$TEMP_BODY" && frameworks="${frameworks}Next.js, "
    grep -q "__nuxt" "$TEMP_BODY" && frameworks="${frameworks}Nuxt, "
    grep -q "data-reactroot\|_reactRootContainer" "$TEMP_BODY" && frameworks="${frameworks}React, "
    grep -q "ng-version\|ng-app" "$TEMP_BODY" && frameworks="${frameworks}Angular, "
    grep -q "data-v-\|data-vue" "$TEMP_BODY" && frameworks="${frameworks}Vue, "
    grep -q "svelte" "$TEMP_BODY" && frameworks="${frameworks}Svelte, "
    grep -q "gatsby" "$TEMP_BODY" && frameworks="${frameworks}Gatsby, "
    grep -q "wp-content\|wp-includes" "$TEMP_BODY" && frameworks="${frameworks}WordPress, "

    if [ -n "$frameworks" ]; then
        frameworks=$(echo "$frameworks" | sed 's/, $//')
        finding "INFO" "Frameworks detectados: ${frameworks}" \
            "Tecnologías identificadas en el HTML del sitio." \
            "Verificar que las versiones detectadas no tienen CVEs conocidos."
    else
        finding "OK" "Framework no detectable desde HTML" \
            "No se detectaron fingerprints de frameworks conocidos. Esto reduce la superficie de ataque." ""
    fi

    # Contar scripts externos
    local ext_scripts=$(grep -oi 'src=["'\'']https\?://[^"'\'']*\.js' "$TEMP_BODY" | grep -v "${DOMAIN}" | wc -l | tr -d ' ')
    if [ "$ext_scripts" -gt 5 ]; then
        finding "MEDIUM" "Alto número de scripts externos: ${ext_scripts}" \
            "Cada script externo es un riesgo de supply chain. Si uno se compromete, tu sitio se compromete." \
            "Auditar cada script externo. Considerar self-hosting los críticos. Implementar SRI (Subresource Integrity)."
    elif [ "$ext_scripts" -gt 0 ]; then
        finding "INFO" "Scripts externos detectados: ${ext_scripts}" \
            "Scripts cargados desde dominios de terceros." ""
    fi
}

# ─── CAPA 4: ARCHIVOS EXPUESTOS ────────────────────────────

scan_files() {
    header "CAPA 4: Archivos y Rutas Expuestas"

    local sensitive_paths=(
        ".git/config|Repositorio Git expuesto|CRITICAL|Bloquear acceso: location ~ /\\.git { deny all; return 404; }"
        ".env|Variables de entorno expuestas|CRITICAL|Mover fuera del document root o bloquear acceso"
        ".git/HEAD|Git HEAD expuesto|CRITICAL|Bloquear acceso a todo .git/"
        "wp-config.php.bak|Backup de configuración WP|CRITICAL|Eliminar backups del servidor público"
        ".DS_Store|DS_Store expuesto|MEDIUM|Agregar .DS_Store a .gitignore y bloquear en servidor"
        "robots.txt|robots.txt accesible|INFO|Revisar que no revele rutas sensibles"
        ".well-known/security.txt|security.txt presente|INFO|Archivo de contacto de seguridad"
        "sitemap.xml|sitemap.xml accesible|INFO|Verificar que no expone rutas internas"
    )

    for check in "${sensitive_paths[@]}"; do
        IFS='|' read -r path title sev fix <<< "$check"
        local code=$(curl -sI -o /dev/null -w "%{http_code}" --max-time 5 "https://${DOMAIN}/${path}" 2>/dev/null || echo "000")

        case "$code" in
            200)
                if [ "$sev" = "INFO" ]; then
                    finding "OK" "${title}" \
                        "https://${DOMAIN}/${path} responde 200." ""
                else
                    finding "$sev" "${title}" \
                        "https://${DOMAIN}/${path} devuelve código 200 — ACCESIBLE PÚBLICAMENTE." \
                        "$fix"
                fi
                ;;
            301|302)
                if [ "$sev" = "CRITICAL" ]; then
                    finding "MEDIUM" "${path} redirige (${code})" \
                        "Redirige en vez de devolver 404. Podría indicar presencia del archivo." \
                        "Cambiar redirect por 404 para no confirmar existencia."
                fi
                ;;
            403)
                if [ "$sev" = "CRITICAL" ]; then
                    finding "LOW" "${path} bloqueado (403)" \
                        "El archivo existe pero el acceso está bloqueado. Mejor que 200 pero ideal sería 404." \
                        "Cambiar 403 por 404 para no confirmar existencia del archivo."
                fi
                ;;
            404|410)
                # No existe — perfecto para archivos sensibles
                if [ "$sev" = "CRITICAL" ] || [ "$sev" = "HIGH" ]; then
                    finding "OK" "${path} no accesible (${code})" \
                        "Correcto: el archivo no está expuesto públicamente." ""
                fi
                ;;
        esac
    done

    # Verificar robots.txt por rutas sensibles
    local robots_content=$(curl -s --max-time 5 "https://${DOMAIN}/robots.txt" 2>/dev/null)
    if echo "$robots_content" | grep -qi "admin\|backup\|config\|\.env\|database\|secret\|private\|internal"; then
        finding "MEDIUM" "robots.txt revela rutas sensibles" \
            "El archivo robots.txt lista rutas que podrían ser sensibles. Un atacante las usa como mapa." \
            "Remover rutas internas de robots.txt. No usar robots.txt como control de acceso."
    fi
}

# ─── CAPA 5: EMAIL Y DNS ───────────────────────────────────

scan_email_dns() {
    header "CAPA 5: Email y DNS"

    if ! command -v dig &> /dev/null; then
        finding "INFO" "dig no disponible" \
            "No se puede analizar DNS. Instalar bind-utils/dnsutils." \
            "sudo apt install dnsutils (Linux) / brew install bind (Mac)"
        return
    fi

    # SPF
    local spf=$(dig TXT "${DOMAIN}" +short 2>/dev/null | grep "v=spf1")
    if [ -n "$spf" ]; then
        if echo "$spf" | grep -q "\-all"; then
            finding "OK" "SPF configurado con hard fail (-all)" \
                "Registro: ${spf}" ""
        elif echo "$spf" | grep -q "~all"; then
            finding "MEDIUM" "SPF con soft fail (~all)" \
                "Registro: ${spf}. Soft fail permite que emails falsificados lleguen al destinatario." \
                "Cambiar ~all por -all para rechazo estricto de spoofing."
        else
            finding "LOW" "SPF presente pero sin -all ni ~all" \
                "Registro: ${spf}" \
                "Agregar -all al final del registro SPF."
        fi
    else
        finding "CRITICAL" "SPF ausente" \
            "No hay registro SPF para ${DOMAIN}. Cualquier servidor puede enviar email haciéndose pasar por @${DOMAIN}." \
            "Agregar TXT record: v=spf1 include:<tu_proveedor_email> -all"
    fi

    # DMARC
    local dmarc=$(dig TXT "_dmarc.${DOMAIN}" +short 2>/dev/null | grep "v=DMARC1")
    if [ -n "$dmarc" ]; then
        if echo "$dmarc" | grep -q "p=reject"; then
            finding "OK" "DMARC con p=reject" \
                "Registro: ${dmarc}" ""
        elif echo "$dmarc" | grep -q "p=quarantine"; then
            finding "OK" "DMARC con p=quarantine" \
                "Registro: ${dmarc}. Considerar migrar a p=reject cuando sea estable." ""
        elif echo "$dmarc" | grep -q "p=none"; then
            finding "HIGH" "DMARC con p=none (solo monitoreo)" \
                "Registro: ${dmarc}. p=none no bloquea emails falsificados." \
                "Migrar a p=quarantine y después a p=reject."
        fi
    else
        finding "CRITICAL" "DMARC ausente" \
            "No hay registro DMARC para ${DOMAIN}. Sin DMARC, no hay política para emails que fallen SPF/DKIM." \
            "Agregar TXT record en _dmarc.${DOMAIN}: v=DMARC1; p=quarantine; rua=mailto:dmarc@${DOMAIN}"
    fi

    # MX Records
    local mx=$(dig MX "${DOMAIN}" +short 2>/dev/null)
    if [ -n "$mx" ]; then
        finding "INFO" "Registros MX encontrados" \
            "$(echo "$mx" | head -3)" ""
    else
        finding "INFO" "Sin registros MX" \
            "El dominio no tiene registros MX configurados." ""
    fi

    # Nameservers
    local ns=$(dig NS "${DOMAIN}" +short 2>/dev/null)
    local ns_count=$(echo "$ns" | grep -c "." 2>/dev/null || echo "0")
    if [ "$ns_count" -ge 2 ]; then
        finding "OK" "Múltiples nameservers (${ns_count})" \
            "Redundancia DNS adecuada." ""
    elif [ "$ns_count" -eq 1 ]; then
        finding "MEDIUM" "Solo 1 nameserver" \
            "Sin redundancia DNS. Si el NS cae, todo el dominio queda inaccesible." \
            "Agregar al menos un segundo nameserver."
    fi
}

# ─── REPORTE FINAL ──────────────────────────────────────────

generate_report_header() {
    cat > "$REPORT" << EOF
# FORTRESS SHIELD CLI v${VERSION} — Informe de Seguridad
## Dominio: ${DOMAIN}
## Fecha: $(date '+%Y-%m-%d %H:%M:%S %Z')
## Tipo: Análisis EASM pasivo · 100% legal · No intrusivo

---

## Resumen Ejecutivo

EOF
}

generate_report_footer() {
    local total=$((CRITICAL + HIGH + MEDIUM + LOW))
    local score=100

    score=$((score - CRITICAL * 25))
    score=$((score - HIGH * 10))
    score=$((score - MEDIUM * 3))
    score=$((score - LOW * 1))
    [ $score -lt 0 ] && score=0

    local label=""
    if [ $score -ge 80 ]; then label="PROTEGIDO"
    elif [ $score -ge 60 ]; then label="ACEPTABLE"
    elif [ $score -ge 40 ]; then label="EN RIESGO"
    else label="CRÍTICO"
    fi

    # Insertar resumen al inicio del reporte
    local temp_report=$(mktemp)
    head -8 "$REPORT" > "$temp_report"

    cat >> "$temp_report" << EOF
**Score: ${score}/100 (${label})**

| Severidad | Cantidad |
|-----------|----------|
| CRITICAL  | ${CRITICAL} |
| HIGH      | ${HIGH} |
| MEDIUM    | ${MEDIUM} |
| LOW       | ${LOW} |
| OK        | ${OK} |
| INFO      | ${INFO} |
| **TOTAL** | **$((total + OK + INFO))** |

EOF

    tail -n +9 "$REPORT" >> "$temp_report"
    mv "$temp_report" "$REPORT"

    # Agregar footer
    cat >> "$REPORT" << EOF

---

## Metodología

Este análisis fue ejecutado por FORTRESS SHIELD CLI v${VERSION}.

**Frameworks:** OWASP WSTG · NIST CSF 2.0 · PTES (fases 1-3)
**Tipo:** 100% pasivo y legal. No se penetró, explotó ni accedió a sistemas privados.
**Herramientas:** curl, openssl, dig (análisis directo, datos reales)
**Capas analizadas:** Transporte/Cifrado, Cabeceras HTTP, Fingerprinting, Archivos Expuestos, Email/DNS

---

\`\`\`
FORTRESS SHIELD CLI v${VERSION}
Dominio: ${DOMAIN}
Score: ${score}/100 (${label})
Fecha: $(date '+%Y-%m-%d %H:%M:%S')
CONFIDENCIAL · INTERNO
\`\`\`
EOF

    # Mostrar resumen en terminal
    echo ""
    echo -e "${P}${BOLD}═══ RESUMEN FINAL ═══${NC}"
    echo ""
    echo -e "  Dominio: ${W}${DOMAIN}${NC}"
    echo -e "  Score:   ${W}${score}/100${NC} (${label})"
    echo ""
    echo -e "  ${R}CRITICAL:${NC} ${CRITICAL}"
    echo -e "  ${Y}HIGH:${NC}     ${HIGH}"
    echo -e "  ${Y}MEDIUM:${NC}   ${MEDIUM}"
    echo -e "  ${G}LOW:${NC}      ${LOW}"
    echo -e "  ${G}OK:${NC}       ${OK}"
    echo -e "  ${B}INFO:${NC}     ${INFO}"
    echo ""
    echo -e "  Reporte: ${C}${REPORT}${NC}"
    echo ""

    if [ $CRITICAL -gt 0 ]; then
        echo -e "  ${R}${BOLD}⛔ ${CRITICAL} hallazgo(s) CRITICAL requiere(n) atención inmediata.${NC}"
    elif [ $HIGH -gt 0 ]; then
        echo -e "  ${Y}${BOLD}⚠️  ${HIGH} hallazgo(s) HIGH requiere(n) atención antes de producción.${NC}"
    else
        echo -e "  ${G}${BOLD}✅ Sin hallazgos críticos ni altos.${NC}"
    fi
    echo ""
}

# ─── MAIN ───────────────────────────────────────────────────

cmd_scan() {
    local domain="$1"
    local mode="${2:---full}"

    init "$domain"
    generate_report_header

    echo -e "${P}${BOLD}"
    echo "  ╔═══════════════════════════════════════════════════╗"
    echo "  ║      FORTRESS SHIELD CLI v${VERSION}                    ║"
    echo "  ║      Scanner EASM · Datos Reales · Pasivo        ║"
    echo "  ╚═══════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo -e "  Dominio: ${W}${DOMAIN}${NC}"
    echo -e "  Modo:    ${W}${mode}${NC}"
    echo -e "  Fecha:   $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""

    scan_transport
    scan_headers
    scan_tech
    scan_files
    scan_email_dns

    generate_report_footer
}

cmd_help() {
    echo -e "${BOLD}FORTRESS SHIELD CLI v${VERSION}${NC} — Scanner EASM desde Terminal"
    echo ""
    echo "Uso:"
    echo -e "  ${C}./fortress-shield-cli.sh scan${NC} dominio.com          Scan completo"
    echo -e "  ${C}./fortress-shield-cli.sh scan${NC} dominio.com --quick  Scan rápido"
    echo -e "  ${C}./fortress-shield-cli.sh help${NC}                      Esta ayuda"
    echo ""
    echo "Requisitos: curl, openssl, dig"
    echo "Reportes se guardan en: ~/.fortress/shield/reports/"
}

case "${1:-help}" in
    scan)   cmd_scan "${2:-}" "${3:---full}";;
    help)   cmd_help;;
    *)      echo "Uso: $0 scan dominio.com"; exit 1;;
esac
