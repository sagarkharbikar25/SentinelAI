from pathlib import Path
from uuid import uuid4
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from sentinel.db.models import Base, VaultEntry
from sentinel.vault.restore import RestoreEngine
from sentinel.vault.scopes import is_excluded, is_in_watched_scope
from sentinel.vault.storage import VaultStorage


@pytest.fixture
def vault_env(tmp_path):
    vault_dir = tmp_path / "sentinel_vault"
    db_path = tmp_path / "test.db"
    engine = create_engine(f"sqlite:///{db_path}", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    session_factory = sessionmaker(bind=engine)
    session = session_factory()

    storage = VaultStorage(vault_dir=vault_dir, db=session)
    restore = RestoreEngine(vault_storage=storage)
    try:
        yield storage, restore, session, tmp_path
    finally:
        session.close()


def test_vault_content_addressed_deduplication(vault_env):
    storage, _, session, tmp_path = vault_env

    file1 = tmp_path / "original_a.txt"
    file2 = tmp_path / "original_b.txt"
    content = b"CRITICAL_PROJECT_CODE_VERSION_1"
    file1.write_bytes(content)
    file2.write_bytes(content)

    # Backup file1
    entry1 = storage.backup_file(file1, action_id="act-1")
    assert entry1.file_hash is not None
    assert storage.has_blob(entry1.file_hash) is True

    # Backup file2 (identical content)
    entry2 = storage.backup_file(file2, action_id="act-2")
    assert entry2.file_hash == entry1.file_hash
    assert entry2.vault_path == entry1.vault_path

    # Verify content read matches original
    stored_bytes = storage.read_blob_bytes(entry1.file_hash)
    assert stored_bytes == content


def test_scopes_and_default_exclusions(tmp_path):
    assert is_excluded(tmp_path / "node_modules" / "express" / "index.js") is True
    assert is_excluded(tmp_path / ".git" / "HEAD") is True
    assert is_excluded(tmp_path / "venv" / "bin" / "activate") is True
    assert is_excluded(tmp_path / "__pycache__" / "main.cpython-311.pyc") is True

    # Legitimate project file is NOT excluded
    assert is_excluded(tmp_path / "src" / "auth" / "login.py") is False

    # Watched scope checks
    watched = [str(tmp_path / "my_project")]
    assert is_in_watched_scope(tmp_path / "my_project" / "main.py", watched) is True
    assert is_in_watched_scope(tmp_path / "other_dir" / "secret.txt", watched) is False


def test_side_path_restore_by_default(vault_env):
    storage, restore, _, tmp_path = vault_env

    project_file = tmp_path / "app.py"
    original_code = b"print('version 1')"
    project_file.write_bytes(original_code)

    # Backup to vault
    entry = storage.backup_file(project_file)

    # Modify the original file (simulating agent edits)
    newer_code = b"print('version 2 - modified by agent')"
    project_file.write_bytes(newer_code)

    # Restore without overwrite flag (Default side-path mode)
    restored_path = restore.restore(entry, target_destination=project_file, overwrite=False)

    # Original file is preserved untouched
    assert project_file.read_bytes() == newer_code

    # Restored file is placed at side-path with restored timestamp
    assert restored_path != project_file
    assert "restored" in restored_path.name
    assert restored_path.read_bytes() == original_code


def test_in_place_overwrite_restore(vault_env):
    storage, restore, _, tmp_path = vault_env

    file_to_recover = tmp_path / "config.json"
    clean_config = b'{"status": "clean"}'
    file_to_recover.write_bytes(clean_config)

    entry = storage.backup_file(file_to_recover)

    # Corrupt original file
    file_to_recover.write_bytes(b'{"corrupted": true}')

    # In-place restore with overwrite=True
    restored_path = restore.restore(entry, target_destination=file_to_recover, overwrite=True)

    assert restored_path == file_to_recover
    assert file_to_recover.read_bytes() == clean_config
