# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this directory is

This is **not** a conventional application codebase with a build system. It is a **working directory for the TypingX / alparka (typx.ai) "X download → local edit → upload" workflow**. An "X" is a single self-contained interactive educational app downloaded from the platform as a ZIP. The job here is: unzip a downloaded X, edit it locally, repackage it as a new version (`v2-1`), and upload it back through the admin API so that the platform's studio restore / version-edit / remix features keep working.

The single source of truth for every step is **`x-upload-workflow-for-cli-llm (1).md`** (Korean, ~920 lines). Read the relevant section before doing packaging or upload work — the rules below are a map into it, not a replacement.

Current contents:
- `x-upload-workflow-for-cli-llm (1).md` — the authoritative workflow guide.
- `4.B1-3_전체와부분_겹쳐진모양26p(AS-4).zip` — a downloaded X (the app "전체와부분 / 겹쳐진 모양"). Its files live under a top-level folder (`5/`) inside the zip.
- `#1/` — empty scratch directory.

## Naming: external (zip/API) vs internal (server/DB)

The workflow doc constantly switches between these. Keep them straight:

| External (zip, API, frontend) | Internal (server, DB) |
|---|---|
| `x`, `x_id`, `x_name` | `app`, `app_id`, `app_name` |
| `xs` | `apps` |
| `mongo_app_id` (e.g. `20260416101005_fedb...`) | same; equals `app_metadata.json`'s `id` |
| `version_name` (`v1-1`, `v2-1`) | `version` |
| `version_id` (UUID) | `id` (PK of `app_versions`) |

`x_id` in practice = the `id` field inside the unzipped folder's `app_metadata.json`.

## Anatomy of a downloaded X

Root code/data files: `app.ts`, `main.ts`, `main.js` (build output), `appHelper.ts`, `index.html`, `style.css`, `tsconfig.json`, `data.json`. Plus `assets/` (thumbnails + app-specific media) and `archive/` (the version tree). The app itself is a TypeScript canvas game; `data.json` holds its content. There is no build step to run here — `main.js` is uploaded as-is even though a server-side helper could regenerate it.

Four metadata files are **DB snapshots regenerated on download, not EFS files**: `meta.json`, `change_log.json`, `app_metadata.json`, `chat.json`. Editing them locally only matters for repackaging (`meta.json` / `change_log.json`); `app_metadata.json` and the upload itself ignore them (see below).

## The versioning / archive model (the core architecture)

This is what makes packaging non-trivial. Every version is a delta stored under `archive/v{N}-{M}/`:
- `meta.json` — per-version metadata: `file_index` (path → `{hash, size, mtime}` for **every** live file), `changes` (`Add`/`Change`/`Delete` entries), `no_changes` (files identical to an ancestor, pointing at `last_version`/`last_version_id`), plus `version`/`version_id`/`parent`/`parent_id`/`timestamp`/`summary`/`engine_version`.
- `files/` — actual bytes of only the Add/Change files for that version.
- `archive/change_log.json` — the version tree; exactly one entry has `is_current: true` (the active version, usually `v1-1`).

Restore walks three layers: the version's own `files/`, then the `no_changes` chain to an ancestor's `files/`. A new version's `parent` and any `no_changes.last_version` **must** name versions whose folders are included in the same upload, or parent/file references become NULL in the DB and restore can later `FileNotFoundError`.

To create the new version, follow **§5** of the doc (full algorithm + pseudocode). New version name comes from `make_new_version_name` (`v1-1` parent → `v2-1`). **Prefer the "all-Change" simple mode (§5.3)** when diffing is uncertain: mark every file `Change`/`Add`, copy all of `file_index` into `v2-1/files/`, leave `no_changes: []`. It is the safest and is the requested default — the only cost is ~2× EFS usage, so avoid it for asset-heavy apps (§5.2 normal mode there).

## Hashing — must match exactly

`file_index` hash = the byte hash of the uploaded root file = the byte hash of the copy in `v2-1/files/`, all three identical. Use streamed SHA-256 (8192-byte chunks), **lowercase 64-char hex** (`snapshot_manager.py:32-41` is the reference impl, reproduced in §8). Uppercase or mismatched hashes break the next version's diff.

## Uploading

`POST {API_BASE}/admin/xs/upload`, multipart, `Authorization: Bearer <ADMIN_JWT>`. Send `title` (required), optional `category`/`description`, and parallel `files[]` / `paths[]` arrays (equal length) covering **every** file in the work folder. Each `paths[i]` gets its **first path segment stripped** by the server, so prefix with anything — convention is `upload/` (e.g. `upload/archive/v2-1/meta.json`). POSIX slashes only; no `..`, no absolute paths. Full curl/Python examples in §9.

API bases: local `http://localhost:8000`, prod `https://api.typx.ai`. Always complete a local end-to-end verification before uploading to production (§13).

Key consequences to remember:
- Upload **always creates a new X** with a new `mongo_app_id`; the original is untouched. Author becomes the uploading admin.
- The new X is **unpublished by design** (`is_published=False`, `approval_status=NONE`) and not visible in arcade/home; reach it via `/studio/{x_id}`. Publishing is a separate step (§13.5: admin `approve` = method A, or studio `publish-x` = method B which also toggles `allow_remix`).
- `title`/`category`/`description` come from the upload Form, **not** from `app_metadata.json` (server never reads it). Capture the response `mongo_app_id` — it's needed for verification, publishing, and zombie cleanup.
- A 500 can leave a **version-less "zombie" app** committed in the DB (the endpoint isn't atomic); follow the cleanup procedure in §12.7. Common 500 causes: `engine_version` over 50 chars, bad JSON, hash mismatch, missing parent.

## Hard rules (do not violate — §11)

- Never modify existing files under `archive/v1-1/files/` (breaks restore/hash checks).
- Never put `DEFAULT_IGNORE` files (`meta.json`, `change_log.json`, `app_metadata.json`, `chat.json`, `*.bak`, `archive/**`) into `file_index`.
- POSIX `/` only in all paths; no backslashes, no null bytes; lowercase hashes.
- Don't leave deleted assets in `file_index`; don't leave a file out of both `v2-1/files/` and `no_changes`.
- Exactly one `is_current: true` in `change_log.json`; `parent` and `no_changes.last_version` must reference versions present in the upload.
- Strip stray hidden files (`.DS_Store`, editor swaps) before packaging — they would land in `file_index`.
- If you replace `assets/thumbnail.webp`, regenerate the full pyramid (`thumbnail_64/128/256/512.webp`); the server does not (§12.2).

## Verification & publishing

After upload, run the §10 checklist via the admin page + `/studio/{x_id}` (app is private so it won't appear in arcade): confirm active version is `v2-1`, edited content is present, version tree shows `v1-1 → v2-1`, and restore works both directions. Only then publish via §13.5 if arcade exposure is wanted.

## Reference

Section §14 of the doc maps every behavior to exact files/line numbers in the server repo (`alparka-back/`, e.g. `app/api/admin/apps.py`, `snapshot_manager.py`, `version_service.py`). Line numbers are pinned to 2026-04-17 `alparka-back@main` and may drift; use them as starting points if deeper investigation is needed.
