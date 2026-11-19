"""
SentinelAI Safe File Restore Engine.
Restores files from content-addressed vault storage.
Enforces side-path restore by default; in-place overwrite requires explicit flag
and creates a pre-overwrite safety snapshot.
"""
import shutil
from datetime import datetime
from pathlib import Path
from typing import Optional, Union

from sentinel.db.models import VaultEntry
from sentinel.vault.storage import VaultStorage


class RestoreEngine:
    """
    Manages recovery of deleted or damaged files from the SentinelAI vault.
    """

    def __init__(self, vault_storage: Optional[VaultStorage] = None):
        self.vault = vault_storage or VaultStorage()

    def generate_side_path(self, target_path: Path) -> Path:
        """
        Generates a non-conflicting side-path:
        /path/to/file.ext -> /path/to/file.restored.20260101_120000.ext
        """
        parent = target_path.parent
        stem = target_path.stem
        suffix = target_path.suffix
        timestamp_str = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        return parent / f"{stem}.restored.{timestamp_str}{suffix}"

    def restore(
        self,
        vault_entry: Union[VaultEntry, str],
        target_destination: Optional[Union[str, Path]] = None,
        overwrite: bool = False,
    ) -> Path:
        """
        Restores a file from the vault to the filesystem.
        
        Args:
            vault_entry: Either a VaultEntry database model or content_hash string.
            target_destination: Optional destination path. Defaults to original_path if VaultEntry.
            overwrite: If True, overwrites destination in-place. If False, writes to a side-path.
            
        Returns:
            The Path where the file was restored.
        """
        if isinstance(vault_entry, VaultEntry):
            content_hash = vault_entry.file_hash
            orig_path = Path(vault_entry.original_path).expanduser().resolve()
        else:
            content_hash = str(vault_entry)
            orig_path = None

        dest = Path(target_destination).expanduser().resolve() if target_destination else orig_path
        if not dest:
            raise ValueError("Target destination must be provided when restoring from raw hash")

        blob_path = self.vault.get_blob_path(content_hash)
        if not blob_path.is_file():
            raise FileNotFoundError(f"Vault blob not found for hash: {content_hash}")

        # Determine final write destination
        if dest.exists() and not overwrite:
            final_dest = self.generate_side_path(dest)
        else:
            final_dest = dest

        # If overwriting an existing file, create a safety copy in vault first
        if dest.exists() and overwrite:
            self.vault.store_blob(dest)

        final_dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(blob_path, final_dest)

        if isinstance(vault_entry, VaultEntry) and self.vault.db:
            vault_entry.restored_at = datetime.utcnow()
            self.vault.db.commit()

        return final_dest
