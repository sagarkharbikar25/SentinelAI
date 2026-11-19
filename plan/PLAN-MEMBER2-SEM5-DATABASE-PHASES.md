---
phase: sem5-database
plan: MEMBER2_SEM5_DATABASE_PHASES
role: Member 2 (Database & Storage Architect)
type: execution
autonomous: true
wave: 1
depends_on: []
---

# Semester 5 Database & Storage Master Execution Plan
**Role:** Database Architecture, Cryptographic Vault & Tamper-Evident Storage  
**Objective:** Deliver a production-grade SQLite engine with WAL mode, cryptographic SHA-256 hash chaining with anti-tamper triggers, verification tool (`verify_log.py`), and content-addressed deduplicated vault storage with side-path recovery.  
**Style & Protocol:** Enforces `/ponytail` (minimalist, standard library first, zero unneeded code) and `/executor` (atomic phase tasks, verification steps, strict success gates).  
**Constraint:** All work remains strictly local on `member-2-database`; do not push to remote without user permission.

---

## Context Files
* `daemon/sentinel/db/database.py` — SQLite engine configuration, connection pooling, and PRAGMAs.
* `daemon/sentinel/db/models.py` — SQLAlchemy ORM schemas, primary/foreign keys, and indices.
* `daemon/sentinel/db/seed.py` — Database seeder for baseline tables and policies.
* `daemon/sentinel/core/hash_chain.py` — SHA-256 hash chaining and SQLite anti-tamper triggers.
* `daemon/sentinel/tools/verify_log.py` — Tamper-verification traversal tool.
* `daemon/sentinel/vault/storage.py` — Content-addressed blob store with deduplication.
* `daemon/sentinel/vault/restore.py` — Safe side-path and in-place recovery engine.
* `daemon/tests/test_database.py` — Database schema & PRAGMA test suite.
* `daemon/tests/test_hash_chain.py` — Hash chain & trigger verification test suite.
* `daemon/tests/test_vault.py` — Vault storage & recovery test suite.

---

## Phase 1: SQLite Engine Hardening & Schema Alignment
**Goal:** Configure SQLite with high-concurrency WAL mode, foreign key enforcement, and complete relational schemas for Member 2.

* [x] **Task 1.1** `type="auto"`: Configure SQLite PRAGMAs in `daemon/sentinel/db/database.py`
  - Enable `PRAGMA journal_mode=WAL;`
  - Enable `PRAGMA foreign_keys=ON;`
  - Enable `PRAGMA synchronous=NORMAL;`
* [x] **Task 1.2** `type="auto"`: Extend `daemon/sentinel/db/models.py`
  - Add `Scope` table (`id`, `path`, `is_zone`, `protection_level`, `quota_bytes`, `created_at`).
  - Add `RestorePoint` table (`id`, `session_id`, `created_at`, `label`, `manifest_json`).
  - Add `prev_hash` (String 64) and `row_hash` (String 64) columns to `AuditLog`.
* [x] **Task 1.3** `type="auto"`: Update `daemon/tests/test_database.py`
  - Verify PRAGMA foreign keys and WAL mode.
  - Verify `Scope`, `RestorePoint`, and `AuditLog` hash fields.
* **Verification:**
  ```powershell
  & "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe" -m pytest daemon/tests/test_database.py -v
  ```
* **Done Criteria:** SQLite engine initializes with WAL and foreign keys active; all database tests pass. (VERIFIED - 6 passed)

---

## Phase 2: Tamper-Evident Cryptographic Hash Chain
**Goal:** Implement mathematical append-only immutability for the flight recorder log.

* [x] **Task 2.1** `type="auto"`: Build `daemon/sentinel/core/hash_chain.py`
  - Deterministic row serialization (`canonical_json`).
  - SHA-256 chaining: `hash_i = SHA256(hash_{i-1} || canonical(row_i))`.
  - Genesis block hash anchor (`GENESIS_0000000000000000000000000000000000000000000000000000000000000000`).
  - Install SQLite `BEFORE UPDATE` and `BEFORE DELETE` triggers rejecting modifications on `audit_logs`.
* [x] **Task 2.2** `type="auto"`: Build `daemon/sentinel/tools/verify_log.py`
  - Traverses the entire audit log from genesis to head.
  - Verifies hash continuity; flags exact row ID if tampering occurs.
* [x] **Task 2.3** `type="auto"`: Create `daemon/tests/test_hash_chain.py`
  - Test chain integrity on sequential inserts.
  - Test SQLite trigger blocking manual SQL UPDATE and DELETE.
  - Test `verify_log` correctly catches tampered rows.
* **Verification:**
  ```powershell
  & "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe" -m pytest daemon/tests/test_hash_chain.py -v
  ```
* **Done Criteria:** Tamper triggers actively reject direct SQL edits; `verify_log` accurately detects chain breaks. (VERIFIED - 4 passed)

---

## Phase 3: Content-Addressed Vault Storage & Deduplication
**Goal:** Deliver a fast, content-addressed blob store for file preservation.

* [x] **Task 3.1** `type="auto"`: Implement `daemon/sentinel/vault/storage.py`
  - Store blobs under `VAULT_DIR / "blobs" / hash[:2] / hash.blob`.
  - SHA-256 content deduplication (identical files reuse the same blob).
  - Store file metadata in `VaultEntry` (or `file_versions`).
  - Enforce size cap (50MB default for full backup).
* [x] **Task 3.2** `type="auto"`: Implement `daemon/sentinel/vault/scopes.py`
  - Watched scope resolver with exclusion filters (`node_modules`, `.git`, `__pycache__`, `venv`, `dist`).
* **Verification:**
  ```powershell
  & "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe" -c "from sentinel.vault.storage import VaultStorage; print('VaultStorage OK')"
  ```
* **Done Criteria:** Files can be securely backed up into deduplicated content-addressed blobs. (VERIFIED)

---

## Phase 4: Safe File Restore Engine
**Goal:** Recover deleted or damaged files without overwriting newer work.

* [x] **Task 4.1** `type="auto"`: Implement `daemon/sentinel/vault/restore.py`
  - Side-path restore default: `{original_dir}/{filename}.restored.{timestamp}.{ext}`.
  - Explicit in-place overwrite mode with safety backup before replacing.
* [x] **Task 4.2** `type="auto"`: Create `daemon/tests/test_vault.py`
  - Test backup and deduplication of identical files.
  - Test side-path restore preserving original files.
  - Test in-place overwrite mode.
* **Verification:**
  ```powershell
  & "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe" -m pytest daemon/tests/test_vault.py -v
  ```
* **Done Criteria:** Full backup and restore lifecycle tested with 100% assertions. (VERIFIED - 4 passed)

---

## Phase 5: Full Integration & Non-Regression Suite
**Goal:** Verify all Member 1 + Member 2 subsystems work together cleanly.

* [x] **Task 5.1** `type="auto"`: Integrate hash-chaining into `routes.py` audit logging.
* [x] **Task 5.2** `type="auto"`: Run complete test suite across all modules:
  - `test_database.py`
  - `test_hash_chain.py`
  - `test_vault.py`
  - `test_api.py`
  - `test_decision_engine.py`
  - `test_shims.py`
  - `test_manifest_checker.py`
  - `test_policy_engine.py`
  - `test_risk_scorer.py`
* **Verification:**
  ```powershell
  & "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe" -m pytest daemon/tests/ -v
  ```
* **Done Criteria:** All tests pass with zero errors, zero regressions, and zero uncommitted files. (VERIFIED - 39 passed)
