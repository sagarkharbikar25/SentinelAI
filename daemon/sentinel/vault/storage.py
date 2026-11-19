"""
SentinelAI Content-Addressed Cryptographic Vault Storage.
Stores deduplicated file blobs indexed by SHA-256 under VAULT_DIR/blobs/ab/abcdef....blob
"""
import hashlib
import os
import shutil
from datetime import datetime
from pathlib import Path
from typing import Optional, Tuple
from uuid import uuid4

from sqlalchemy.orm import Session

from sentinel.config import VAULT_DIR
from sentinel.db.models import VaultEntry

MAX_RECOVERABLE_FILE_SIZE = 50 * 1024 * 1024  # 50 MB Cap


class VaultStorage:
    """
    Content-addressed immutable blob storage with deduplication.
    Identical file contents share the same blob on disk.
    """

    def __init__(self, vault_dir: Optional[Path] = None, db: Optional[Session] = None):
        self.vault_dir = Path(vault_dir or VAULT_DIR).expanduser().resolve()
        self.blobs_dir = self.vault_dir / "blobs"
        self.blobs_dir.mkdir(parents=True, exist_ok=True)
        self.db = db

    def compute_sha256(self, file_path: Path) -> str:
        """Computes SHA-256 checksum of a file efficiently in 64KB chunks."""
        hasher = hashlib.sha256()
        with open(file_path, "rb") as f:
            while chunk := f.read(65536):
                hasher.update(chunk)
        return hasher.hexdigest()

    def get_blob_path(self, content_hash: str) -> Path:
        """Returns the relative partitioned path: blobs/ab/abcdef...blob"""
        prefix = content_hash[:2]
        return self.blobs_dir / prefix / f"{content_hash}.blob"

    def has_blob(self, content_hash: str) -> bool:
        """Checks if a blob already exists in the content-addressed store."""
        return self.get_blob_path(content_hash).is_file()

    def store_blob(self, source_path: Path) -> Tuple[str, Path, int]:
        """
        Calculates SHA-256 and copies content to blob store if not already present.
        Returns (content_hash, blob_path, file_size_bytes).
        """
        source = Path(source_path).expanduser().resolve()
        if not source.is_file():
            raise FileNotFoundError(f"Source file not found: {source}")

        file_size = source.stat().st_size
        content_hash = self.compute_sha256(source)
        blob_path = self.get_blob_path(content_hash)

        # Content-addressed deduplication: if blob exists, skip write
        if not blob_path.exists():
            blob_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, blob_path)

        return content_hash, blob_path, file_size

    def backup_file(
        self,
        file_path: Path,
        action_id: Optional[str] = None,
        db_session: Optional[Session] = None,
    ) -> VaultEntry:
        """
        Backs up a file into the content-addressed vault and records a VaultEntry.
        """
        source = Path(file_path).expanduser().resolve()
        content_hash, blob_path, file_size = self.store_blob(source)

        entry = VaultEntry(
            id=str(uuid4()),
            action_id=action_id,
            original_path=str(source),
            vault_path=str(blob_path),
            file_hash=content_hash,
            file_size_bytes=file_size,
            encrypted=False,  # Plain content-addressed store in Sem 5
            deleted_at=datetime.utcnow(),
        )

        active_db = db_session or self.db
        if active_db:
            active_db.add(entry)
            active_db.commit()
            active_db.refresh(entry)

        return entry

    def read_blob_bytes(self, content_hash: str) -> bytes:
        """Reads raw bytes of a stored blob by hash."""
        blob_path = self.get_blob_path(content_hash)
        if not blob_path.exists():
            raise FileNotFoundError(f"Blob with hash {content_hash} not found in vault")
        return blob_path.read_bytes()
