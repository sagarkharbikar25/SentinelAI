"""
SentinelAI Stage-and-Apply Staging Engine (SentinelBox Foundation).
Provisions isolated workspaces, computes diffs, and safely applies approved changes.
"""
import difflib
import hashlib
import os
import shutil
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from sentinel.config import SENTINEL_HOME
from sentinel.vault.scopes import is_excluded
from sentinel.vault.storage import VaultStorage

BOX_WORKSPACES_DIR = SENTINEL_HOME / "box_workspaces"


class BoxManager:
    """Manages isolated agent staging workspaces and the Stage-and-Apply workflow."""

    def __init__(self, base_dir: Optional[Path] = None, vault: Optional[VaultStorage] = None):
        self.workspaces_root = Path(base_dir or BOX_WORKSPACES_DIR).expanduser().resolve()
        self.workspaces_root.mkdir(parents=True, exist_ok=True)
        self.vault = vault or VaultStorage()

    def _hash_file(self, path: Path) -> str:
        hasher = hashlib.sha256()
        with open(path, "rb") as f:
            while chunk := f.read(65536):
                hasher.update(chunk)
        return hasher.hexdigest()

    def get_workspace_dir(self, session_id: str) -> Path:
        return self.workspaces_root / session_id

    def provision_workspace(self, session_id: str, source_project: Path) -> Tuple[Path, Dict[str, str]]:
        """Copies source project into an isolated workspace and records baseline manifest."""
        src = Path(source_project).expanduser().resolve()
        ws = self.get_workspace_dir(session_id)
        if ws.exists():
            shutil.rmtree(ws)
        ws.mkdir(parents=True, exist_ok=True)

        manifest: Dict[str, str] = {}
        for root, dirs, files in os.walk(src):
            # Prune excluded directories in-place
            dirs[:] = [d for d in dirs if not is_excluded(Path(root) / d)]
            for file in files:
                fpath = Path(root) / file
                if is_excluded(fpath):
                    continue
                rel = fpath.relative_to(src).as_posix()
                target_f = ws / rel
                target_f.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(fpath, target_f)
                manifest[rel] = self._hash_file(fpath)

        return ws, manifest

    def compute_diff(self, session_id: str, baseline_manifest: Dict[str, str]) -> Dict[str, Any]:
        """Calculates added, modified (with unified diffs), and deleted files."""
        ws = self.get_workspace_dir(session_id)
        if not ws.exists():
            raise FileNotFoundError(f"Workspace {session_id} not found")

        current_files: Dict[str, str] = {}
        for root, dirs, files in os.walk(ws):
            dirs[:] = [d for d in dirs if not is_excluded(Path(root) / d)]
            for file in files:
                fpath = Path(root) / file
                if is_excluded(fpath):
                    continue
                rel = fpath.relative_to(ws).as_posix()
                current_files[rel] = self._hash_file(fpath)

        added = [f for f in current_files if f not in baseline_manifest]
        deleted = [f for f in baseline_manifest if f not in current_files]
        modified = []

        for f, curr_hash in current_files.items():
            if f in baseline_manifest and curr_hash != baseline_manifest[f]:
                # Generate text diff preview
                diff_text = None
                try:
                    fpath = ws / f
                    lines = fpath.read_text(encoding="utf-8", errors="replace").splitlines(keepends=True)
                    diff_text = "".join(difflib.unified_diff([], lines, fromfile="baseline", tofile=f))
                except Exception:
                    diff_text = "(Binary diff)"
                modified.append({"path": f, "old_hash": baseline_manifest[f], "new_hash": curr_hash, "diff": diff_text})

        return {"added": added, "modified": modified, "deleted": deleted, "has_changes": bool(added or modified or deleted)}

    def apply_changes(
        self,
        session_id: str,
        dest_project: Path,
        approved_files: Optional[List[str]] = None,
    ) -> List[str]:
        """Applies approved staged changes to real host project with pre-apply vault safety backups."""
        ws = self.get_workspace_dir(session_id)
        dest = Path(dest_project).expanduser().resolve()
        applied: List[str] = []

        # Find all files in workspace
        for root, dirs, files in os.walk(ws):
            dirs[:] = [d for d in dirs if not is_excluded(Path(root) / d)]
            for file in files:
                ws_f = Path(root) / file
                rel = ws_f.relative_to(ws).as_posix()
                if approved_files is not None and rel not in approved_files:
                    continue

                target_host = dest / rel
                target_host.parent.mkdir(parents=True, exist_ok=True)

                # Snapshot existing host file into vault before overwriting
                if target_host.exists():
                    self.vault.backup_file(target_host, action_id=f"box-apply-{session_id}")

                shutil.copy2(ws_f, target_host)
                applied.append(rel)

        return applied

    def discard_workspace(self, session_id: str) -> bool:
        """Cleans up and removes the isolated workspace."""
        ws = self.get_workspace_dir(session_id)
        if ws.exists():
            shutil.rmtree(ws, ignore_errors=True)
            return True
        return False
