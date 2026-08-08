#!/usr/bin/env bash
# Funciones de apoyo de install.sh. No se ejecuta por si solo.

BIN_PATH="$HOME/.local/bin/fortress"
ICON_PATH="$HOME/.local/share/icons/hicolor/512x512/apps/fortress.png"
MENU_DIR="$HOME/.local/share/applications"
MENU_FILE="$MENU_DIR/fortress.desktop"

# El .AppImage mas reciente, este el dist dentro o fuera del proyecto.
find_appimage() {
  ls -1t "$1"/../dist/FORTRESS-*.AppImage "$1"/dist/FORTRESS-*.AppImage 2>/dev/null | head -1
}

warn_missing_fuse() {
  ldconfig -p 2>/dev/null | grep -q libfuse.so.2 && return 0
  echo "[aviso] Falta libfuse2: los AppImage no arrancaran sin ella."
  echo "  Instalala con:  sudo apt install libfuse2"
}

# StartupWMClass debe coincidir con el WM_CLASS real que reporta Electron
# (verificado con xprop), o la barra de aplicaciones no asocia la ventana.
write_desktop_entry() {
  cat > "$1" <<EOF
[Desktop Entry]
Type=Application
Version=1.0
Name=FORTRESS. by Raisen
GenericName=Centro de mando FORTRESS
Comment=Audita tus proyectos con agentes de IA
Exec=$BIN_PATH
Icon=$ICON_PATH
Terminal=false
Categories=Development;
Keywords=fortress;claude;seguridad;auditoria;
StartupNotify=true
StartupWMClass=fortress-command-center
EOF
  chmod +x "$1"
}

resolve_desktop_dir() {
  local dir
  dir="$(xdg-user-dir DESKTOP 2>/dev/null || true)"
  [ -d "${dir:-}" ] || dir="$HOME/Escritorio"
  [ -d "$dir" ] || dir="$HOME/Desktop"
  [ -d "$dir" ] && printf '%s' "$dir"
}

warn_path_missing() {
  case ":$PATH:" in
    *":$HOME/.local/bin:"*) return 0 ;;
  esac
  echo
  echo "[aviso] ~/.local/bin no esta en tu PATH; el comando 'fortress' no funcionara."
  echo "  Anade a ~/.bashrc:  export PATH=\"\$HOME/.local/bin:\$PATH\""
}

# GUARDRAIL: reemplazar el AppImage bajo su mount FUSE vivo crashea la app (paso una
# vez). Nunca instalar EN CALIENTE. Ver CLAUDE.md > "Rebuild+install seguro".
running_fortress_signals() {
  # Señal DEFINITIVA: el mount FUSE del AppImage (existe solo mientras la app corre).
  # NO se matchea argv: `pgrep -f <binario>` daba falsos positivos con extracciones o
  # greps que solo MENCIONAN la ruta. El proceso real se confirma via /proc/exe.
  mount 2>/dev/null | grep -qi 'fortress' && echo 'fuse-mount'
  local pid
  for pid in $(pgrep -x fortress 2>/dev/null; pgrep -x electron 2>/dev/null); do
    case "$(readlink "/proc/$pid/exe" 2>/dev/null)" in
      *ortress* | *FORTRESS*) echo "app-$pid" ;;
    esac
  done
  true
}

# CAPA 1: rechaza la instalacion si la app esta viva (verificacion de PID ANTES).
refuse_if_running() {
  local signals
  signals="$(running_fortress_signals | tr '\n' ' ')"
  if [ -n "${signals// /}" ]; then
    echo "[ABORTADO] FORTRESS parece EN EJECUCION (senal: $signals)." >&2
    echo "  Reemplazar el AppImage en caliente crashea la app viva." >&2
    echo "  Cierrala por completo y vuelve a correr ./install.sh." >&2
    exit 1
  fi
  echo "[guard] PID antes: ninguno (app cerrada). Reemplazo en frio: seguro."
}

# CAPA 2: confirma que el reemplazo no dejo/arranco un proceso (verificacion DESPUES).
verify_after_install() {
  local signals
  signals="$(running_fortress_signals | tr '\n' ' ')"
  if [ -n "${signals// /}" ]; then
    echo "[aviso] Senal de FORTRESS tras instalar ($signals): instalar no debe arrancar la app." >&2
  else
    echo "[guard] PID despues: ninguno. Binario reemplazado sin proceso vivo afectado."
  fi
}
