#!/usr/bin/env bash
# Instala FORTRESS Command Center: ejecutable, icono, entrada de menu y acceso
# directo en el escritorio. Todo dentro del usuario, sin sudo.
#
# Uso:  ./install.sh    (antes hay que generar el AppImage: npm run build:linux)
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/install-lib.sh
source "$HERE/scripts/install-lib.sh"

APPIMAGE="$(find_appimage "$HERE" || true)"
if [ -z "$APPIMAGE" ]; then
  echo "✗ No encuentro ningun FORTRESS-*.AppImage." >&2
  echo "  Generalo primero:  npm run build:linux" >&2
  exit 1
fi

warn_missing_fuse

mkdir -p "$(dirname "$BIN_PATH")" "$(dirname "$ICON_PATH")" "$MENU_DIR"
install -m 755 "$APPIMAGE" "$BIN_PATH"
install -m 644 "$HERE/build/icon.png" "$ICON_PATH"
write_desktop_entry "$MENU_FILE"

SHORTCUT=""
DESKTOP_DIR="$(resolve_desktop_dir)"
if [ -n "$DESKTOP_DIR" ]; then
  SHORTCUT="$DESKTOP_DIR/FORTRESS.desktop"
  write_desktop_entry "$SHORTCUT"
  # GNOME solo ejecuta los lanzadores marcados como de confianza.
  gio set "$SHORTCUT" metadata::trusted true 2>/dev/null || true
fi

update-desktop-database "$MENU_DIR" 2>/dev/null || true
gtk-update-icon-cache -f -t "$HOME/.local/share/icons/hicolor" 2>/dev/null || true

echo "✓ FORTRESS instalado"
echo "  Ejecutable:      $BIN_PATH"
echo "  Origen:          $APPIMAGE"
echo "  Entrada de menu: $MENU_FILE"
[ -n "$SHORTCUT" ] && echo "  Acceso directo:  $SHORTCUT"
echo "  Icono:           $ICON_PATH"
echo
echo "  Abrelo con doble click en el escritorio, buscando \"FORTRESS\" en tus"
echo "  aplicaciones, o desde la terminal con:  fortress"
warn_path_missing
