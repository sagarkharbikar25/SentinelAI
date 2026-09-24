#!/usr/bin/env bash
# Install SentinelAI Shell Shims into ~/.sentinelai/shims and add to PATH

SHIM_DIR="$HOME/.sentinelai/shims"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

mkdir -p "$SHIM_DIR"

# Copy Python shims and create executable wrappers
cp "$SCRIPT_DIR/rm.py" "$SHIM_DIR/rm"
cp "$SCRIPT_DIR/mv.py" "$SHIM_DIR/mv"
cp "$SCRIPT_DIR/cp.py" "$SHIM_DIR/cp"
cp "$SCRIPT_DIR/chmod.py" "$SHIM_DIR/chmod"
cp "$SCRIPT_DIR/git_clean.py" "$SHIM_DIR/git-clean"
chmod +x "$SHIM_DIR/rm"
chmod +x "$SHIM_DIR/mv"
chmod +x "$SHIM_DIR/cp"
chmod +x "$SHIM_DIR/chmod"
chmod +x "$SHIM_DIR/git-clean"

echo "SentinelAI shims installed in $SHIM_DIR"
echo "To activate in your current session, run:"
echo 'export PATH="$HOME/.sentinelai/shims:$PATH"'

# Optionally append to shell profile
SHELL_RC="$HOME/.bashrc"
[ -f "$HOME/.zshrc" ] && SHELL_RC="$HOME/.zshrc"

if ! grep -q "SENTINELAI_SHIMS" "$SHELL_RC" 2>/dev/null; then
    echo '' >> "$SHELL_RC"
    echo '# SentinelAI Local Permission Broker Shims' >> "$SHELL_RC"
    echo 'export PATH="$HOME/.sentinelai/shims:$PATH"  # SENTINELAI_SHIMS' >> "$SHELL_RC"
    echo "Added SentinelAI shims to $SHELL_RC"
fi
