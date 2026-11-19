# SentinelAI — Member 2 Detailed Master Plan
## Role: Database Architecture, Cryptographic Vault & Tamper-Evident Storage
* **Owner:** Member 2 (Database & Storage Architect)
* **Academic Timeline:** Semester 6 (Schema, Hash Chain, AES-256 Vault & Restore) ➔ Semester 7 (Optimization, Event Log Anchoring & Evidence Proofs)
* **Master Plan References:** `plan/final plan.md` (Sections 5, 6, 7, 14, 15, 16; Phases 1, 2)

---

## 1. Executive Role Summary & Code Ownership

Member 2 owns all persistent data storage, cryptographic protection, and recovery mechanisms in SentinelAI. This encompasses the relational SQLite database, the append-only SHA-256 hash-chained flight recorder log, the tamper-verification engine, and the AES-256-GCM encrypted, content-addressed, deduplicated Time-Machine Vault that guarantees file recoverability from autonomous agent actions.

### Dedicated Files & Subsystems Owned:
* `daemon/sentinel/db/database.py` — SQLite engine configuration, connection pooling, and WAL mode pragmas.
* `daemon/sentinel/db/models.py` — SQLAlchemy ORM schemas, primary/foreign key constraints, and indices.
* `daemon/sentinel/db/seed.py` — Baseline schemas, initial security rules, and test scopes.
* `daemon/sentinel/core/hash_chain.py` — Cryptographic SHA-256 chaining algorithm and SQL trigger definitions.
* `daemon/sentinel/core/event_log_anchor.py` — Periodic root hash checkpoint anchoring into Windows Event Log.
* `daemon/sentinel/tools/verify_log.py` — Command-line and API tool for end-to-end hash chain verification.
* `daemon/sentinel/vault/storage.py` — AES-256-GCM chunked blob storage, content addressing, and deduplication.
* `daemon/sentinel/vault/scopes.py` — Watched scope registry, ignore glob filters (`node_modules`, `.git`, caches).
* `daemon/sentinel/vault/restore.py` — Safe side-path and in-place restore engine with session restore points.

---

## 2. Technical Specifications & Architectural Standards

### 2.1 Complete Relational Data Model (`sentinel.db`)
Member 2 is responsible for implementing and indexing the complete normalized schema:

| Table Name | Primary Purpose & Schema Highlights |
| :--- | :--- |
| `agents` | Registered AI agents: `id`, `name` (Claude Code, Cursor, Antigravity, etc.), `version`, `detected_at`. |
| `sessions` | Agent sessions: `session_id`, `agent_id`, `started_at`, `ended_at`, `mode`, `in_box` (boolean), `is_elevated`. |
| `scopes` | Watched folders: `path`, `is_zone` (boolean), `protection_level` (BACKUP, ALERT_ONLY, IGNORE), `quota_bytes`. |
| `events` | Append-only normalized event log: `event_id`, `prev_hash`, `row_hash`, `ts`, `source`, `agent_id`, `kind`, `target_path`, `risk_score`. |
| `permission_ledger`| Authoritative ledger: `ledger_id`, `event_id`, `agent_name`, `requested_permission`, `decided_by` (USER, TIMEOUT_DENY, AUTO_RULE), `outcome`. |
| `file_versions` | Vault index: `version_id`, `scope_id`, `original_path`, `content_hash` (SHA-256), `blob_path`, `size_bytes`, `mtime`, `is_deleted`. |
| `restore_points` | Session recovery snapshots: `point_id`, `session_id`, `created_at`, `label`, `manifest_json`. |
| `alerts` | System alerts: `alert_id`, `event_id`, `severity` (LOW, MEDIUM, HIGH, CRITICAL), `alert_type` (BURST, CANARY, TIMEOUT_DENY), `acknowledged`. |
| `rules` & `rule_matches`| Active TOML security rules and historical match audits. |
| `canaries` | Deployed tripwire decoys: `canary_id`, `file_path`, `token_hash`, `planted_at`, `is_tripped`. |
| `ml_predictions` | Command classifier inference records: `pred_id`, `input_hash`, `model_version`, `label`, `confidence`, `latency_ms`. |
| `analyst_runs` & `citations` | Analyst questions, generated summaries, and foreign keys to cited `event_id` records. |
| `settings` & `research_metrics`| Application configurations and research benchmark data tables.

### 2.2 Tamper-Evident Cryptographic Hash Chain
The `events` table must be mathematically unmodifiable:
* **Chaining Formula**:
  $$\text{hash}_i = \text{SHA256}\left(\text{hash}_{i-1} \parallel \text{canonical}(\text{row}_i)\right)$$
* **Database Triggers**: Member 2 must create SQLite triggers that strictly reject any `UPDATE` or `DELETE` on the `events` table:
  ```sql
  CREATE TRIGGER abort_event_update BEFORE UPDATE ON events
  BEGIN
    SELECT RAISE(FAIL, 'Tamper-Evident Log Violation: UPDATE not permitted on events table.');
  END;

  CREATE TRIGGER abort_event_delete BEFORE DELETE ON events
  BEGIN
    SELECT RAISE(FAIL, 'Tamper-Evident Log Violation: DELETE not permitted on events table.');
  END;
  ```
* **Event Log Anchoring**: Every 100 events or every 10 minutes, the service writes the current head hash to the Windows Application Event Log (`Source: SentinelAI`, `EventID: 1001`). Tamper verification matches the DB chain head against the Windows Event Log.

### 2.3 Cryptographic Time-Machine Vault
* **Storage Location**: Stored in `C:\ProgramData\SentinelAI\vault\` (or user-chosen directory on D:).
* **ACL Hardening**: Directory must have strict Windows ACLs:
  `icacls D:\SentinelAI /grant:r "SYSTEM:(OI)(CI)F" "BUILTIN\Administrators:(OI)(CI)F" "NT SERVICE\SentinelAI:(OI)(CI)F"`
  Standard user access must be completely denied.
* **Content-Addressed Deduplication**:
  * Files are chunked and hashed via SHA-256.
  * Identical files share the same encrypted blob on disk (`blobs/<first-2-chars>/<sha256>.blob`).
* **Encryption**: Each blob is encrypted using **AES-256-GCM** with a unique 96-bit initialization vector (IV) and authentication tag.
* **Master Key Management**: Keys are stored in `C:\ProgramData\SentinelAI\keys\master.key` protected by ACLs (service-only). Do **not** use machine-scope DPAPI.
* **Quotas & Retention**:
  * Global quota default: $10\text{ GB}$ (warns at $80\%$).
  * Version retention: Keep last $N=5$ versions per file or up to 30 days.
  * Size Cap: Files $> 50\text{ MB}$ store metadata only and are flagged `is_recoverable = FALSE`.

### 2.4 Restore Engine
* **Side-Path Default**: To prevent accidental loss of newly authored work, default restore writes to:
  `{original_directory}\{filename}.restored.{timestamp}.{ext}`
* **In-Place Overwrite**: If the user explicitly selects "Overwrite", the restore engine first creates a vault snapshot of the current destination file before overwriting it.

---

## 3. Semester 6 Detailed Roadmap (Schema, Hash Chain & Vault)

### Milestone 1: Relational Schema & SQLite Optimization
* [ ] Implement complete SQLAlchemy models in `models.py` for all 15 tables listed in Section 2.1.
* [ ] Configure WAL mode (`PRAGMA journal_mode=WAL;`), foreign keys (`PRAGMA foreign_keys=ON;`), and synchronous mode (`PRAGMA synchronous=NORMAL;`) in `database.py`.
* [ ] Add composite indices on `(target_path, ts)`, `(agent_id, ts)`, and `(risk_score, ts)`.
* [ ] **Exit Verification**: Verify that inserting 1,000 events takes $< 100\text{ ms}$ and WAL files are maintained properly.

### Milestone 2: Hash Chain Engine & Anti-Tamper Triggers
* [ ] Implement canonical row serialization (deterministic JSON with sorted keys) in `hash_chain.py`.
* [ ] Add SQLite `BEFORE UPDATE` and `BEFORE DELETE` triggers on `events`.
* [ ] Build `daemon/sentinel/tools/verify_log.py` to traverse the chain, recalculate every hash, and pinpoint the exact row where tampering occurred.
* [ ] **Exit Verification**: Manually edit an event row using SQLite CLI; run `verify_log.py` and confirm it raises `TAMPER_DETECTED` with the exact row ID.

### Milestone 3: AES-256-GCM Blob Storage & Scopes
* [ ] Implement AES-256-GCM encryption/decryption in `vault/storage.py` using `cryptography.hazmat`.
* [ ] Build content-addressed deduplication: blobs are named after their SHA-256 ciphertext hash.
* [ ] Implement watched scopes configuration with default ignore lists (`node_modules`, `.git/objects`, `venv`, `__pycache__`).
* [ ] **Exit Verification**: Store two identical 5 MB files; verify that only one 5 MB blob is created in the vault directory.

### Milestone 4: Restore Engine & Restore Points
* [ ] Implement side-path restore logic in `vault/restore.py`.
* [ ] Implement atomic in-place overwrite with safety snapshots.
* [ ] Create `restore_points` API allowing users or agents to checkpoint an entire project directory before beginning a multi-file task.
* [ ] **Exit Verification**: Overwrite a file 3 times; verify that all 3 prior versions can be independently restored and SHA-256 match the originals.

---

## 4. Semester 7 Detailed Roadmap (Event Log Anchoring & Evidence Proofs)

### Milestone 5: Windows Event Log Anchoring
* [ ] Implement `daemon/sentinel/core/event_log_anchor.py` to write periodic checkpoint records to Windows Event Log via `pywin32`.
* [ ] Extend `verify_log.py` to compare SQLite chain head with Event Log records.
* [ ] **Exit Verification**: Demonstrate proof in Event Viewer (`eventvwr.msc`) showing periodic SentinelAI head hashes.

### Milestone 6: High-Performance Pruning & Quota Engine
* [ ] Implement background vacuum and pruning routines: remove expired versions ($> 30\text{ days}$ or $> N$ versions) when quota exceeds $80\%$.
* [ ] Verify that pruning safely updates blob reference counts before deleting physical blobs.
* [ ] **Exit Verification**: Fill vault to 10 GB limit; verify that pruning reclaims space without corrupting active versions.

### Milestone 7: Capstone Artifacts & Defense Collaboration
* [ ] Provide raw database benchmark numbers to Member 5 for the research paper (RQ1, RQ3).
* [ ] Verify ACL enforcement on fresh VM install with Member 5.
* [ ] Prepare database architecture diagrams and ER diagrams for the Capstone defense slide deck.

---

## 5. Exit Evidence Deliverables
1. `docs/evidence/phase1/hash_chain_tamper_test.txt` — Proof of hash-chain breakage detection on modified rows.
2. `docs/evidence/phase2/vault_recovery_sha256.json` — Pre- and post-restore SHA-256 match verification logs.
3. `docs/evidence/phase1/event_viewer_anchor.png` — Screenshot showing root hash in Windows Event Viewer.
4. `docs/evidence/phase2/deduplication_ratio.csv` — Disk savings metrics proving deduplication effectiveness.
