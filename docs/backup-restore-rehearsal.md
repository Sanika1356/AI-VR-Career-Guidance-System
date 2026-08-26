# PostgreSQL Backup and Restore Rehearsal

**Project:** AI-VR Career Guidance System  
**Scope:** Non-production backup verification and restore rehearsal  
**Script:** `server/scripts/backup-restore-rehearsal.sh`  
**Package command:** `pnpm --dir server db:backup:rehearse`

## Purpose

The rehearsal verifies that a PostgreSQL custom-format dump can be created from a non-production Pathfinder database, restored into a separate empty database, and checked for structural and selected data-count parity. The script never deletes or overwrites a restore database that contains tables, and it requires an explicit `BACKUP_RESTORE_ALLOW=true` opt-in.

The script accepts connection strings through environment variables rather than storing credentials in the repository:

```bash
DATABASE_URL='postgresql://user:password@source-host:5432/source_db' \
BACKUP_RESTORE_DATABASE_URL='postgresql://user:password@restore-host:5432/restore_db' \
BACKUP_RESTORE_ALLOW=true \
pnpm --dir server db:backup:rehearse
```

The source and restore URLs must reference separate non-production databases. The restore database must be empty. Production credentials, connection strings, dump files, and personal data must not be committed or pasted into this document.

## Verification performed

| Date | Source | Restore target | Result |
|---|---|---|---|
| 2026-08-26 | Local development PostgreSQL | Separate local empty restore database | Passed |

The local rehearsal produced a temporary custom-format dump, restored it successfully, and confirmed parity for **25 public tables**, **21 applied migrations**, and **3 `resume_analyses` rows**. The temporary dump was removed automatically when the command completed.

## Checks performed by the script

The rehearsal first confirms that the restore database has no public tables. It then creates a compressed custom-format dump with ownership and ACL restoration disabled, restores that dump into the separate database, and compares the source and restored counts for public tables, migration records, and stored resume-analysis records. Any mismatch or restore error fails the command.

The script is intentionally a verification tool rather than a production backup scheduler. A production or hosted-database schedule must be configured through the approved hosting provider’s encrypted backup mechanism or a separately reviewed operations environment. It must use a restricted backup identity, an isolated restore target, retention and deletion policies, alerting, and a documented owner. No production credentials are required for this repository-level rehearsal.

## Operational runbook

Before a release, provision or select a non-production source database and a separate empty restore database. Confirm that the operator has permission to read the source and create objects in the restore target. Run the package command with connection strings supplied by the shell or secret manager, retain only the pass/fail output and sanitized counts, and destroy the temporary restore database and any exported dump according to the environment’s retention policy.

A successful rehearsal does not prove that a hosted provider’s automated backups, point-in-time recovery, cross-region replication, or production permissions are configured correctly. Those controls still require provider-specific evidence and an approved non-production restore rehearsal. The script also does not validate application-level semantics beyond the selected counts; teams should add domain-specific assertions when the restore process or schema changes materially.
