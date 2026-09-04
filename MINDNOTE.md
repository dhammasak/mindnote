# MindNote — AI Assistant Instructions

Canonical instructions for every AI assistant working on this repo (Claude Code, ChatGPT / OpenAI Codex, Gemini). `CLAUDE.md`, `AGENTS.md`, and `GEMINI.md` all point here.

Read this before starting work. Do not contradict it without flagging to the project owner (TETY) first.

---

## What this is

**MindNote** is TETY's **personal-use** desktop markdown app — a fork of [hjinco/mdit](https://github.com/hjinco/mdit) (Apache-2.0). Not for public distribution, App Store, or upstream contribution.

It edits plain Markdown living inside TETY's existing Obsidian vault at `~/Documents/Obsidian/Tety_Obsidian/`. mdit provides the baseline (block editor, AI, file watching, graph view, vault indexing); MindNote layers TETY's workflows on top.

---

## Multi-machine, multi-platform protocol

TETY develops from **multiple machines** with **multiple AI assistants**. Follow this every session.

**Start**
1. `git pull`
2. `git log --oneline -10` — see what actually landed
3. Read `.project/CONTEXT.md` + top of `.project/CHANGELOG.md` if the Google Drive folder is mounted (see Paths). The code is the source of truth; docs may lag.

**End**
1. Commit and push — never leave a machine holding unpushed commits
2. Append a `.project/CHANGELOG.md` entry: date, **platform used**, **machine**, what changed and why
3. Update `.project/CONTEXT.md` if direction, active tasks, or decisions changed

**Hard rules**
- **Force-push is coordinated.** Never `git push --force` / `--force-with-lease` on `mindnote/customizations` without confirming no other machine holds the old hashes. When unsure, `git merge upstream/main` instead of `git rebase upstream/main` — merge commits are ugly but never strand a machine.
- **Never hand-edit lockfiles.** Regenerate `pnpm-lock.yaml` / `Cargo.lock` with their tools and commit the result. Lockfile drift is the #1 cross-machine breakage.
- **Verify before pushing:** `pnpm ts:check:desktop` and `cargo check --workspace` must both be green.
- **One branch per session** is preferred over committing straight onto `mindnote/customizations`.

---

## Commands

```bash
pnpm dev:desktop                  # run the app (Tauri; first Rust build ~3min, incremental 10-30s)
pnpm ts:check:desktop             # TypeScript check (must be green before push)
cargo check --workspace           # Rust check (must be green before push)
pnpm test:all                     # Vitest across packages
cargo test --workspace            # Rust tests
pnpm lint:fix                     # Biome — run after any TS change
cargo fmt --all                   # rustfmt — run after any Rust change
```

A pre-commit hook runs `pnpm lint:fix` automatically.

---

## Constraints

- **Personal use only.** No telemetry, no marketing site. Updater points at a private iCloud Drive feed, never hjinco/mdit releases.
- **Plain Markdown is the only storage format.** Files must stay readable by Obsidian unmodified.
- **Tauri stack — no rewrites.** React 19 + Rust + Tauri 2. No migration to Swift, Electron, SvelteKit.
- **Track upstream selectively.** `upstream` = hjinco/mdit. Merge when useful, skip when it conflicts with our customisations.
- **macOS is the target.** Windows / mobile out of scope.

---

## Conventions

**Naming** — App: `MindNote`. Bundle ID: `app.mindnote` (dev `app.mindnote.dev`). Workspace state dir: `.mindnote/` inside the vault. Keychain service: `app.mindnote`.

**Kept from mdit deliberately** (minimise upstream diff, not user-visible): npm packages `@mdit/*`, Rust binary `mdit`, MCP server id `mdit`.

**Commits** — conventional commits (`feat:`, `fix:`, `chore:`, `style:`, `rebrand:`), scoped where useful: `feat(quick-note):`, `fix(window):`.

**Language** — UI, code, comments, commit messages, and these docs are English. Conversation with TETY is Thai/English mixed.

---

## Upstream sync — known conflict patterns

- **`apps/desktop/src-tauri/tauri.conf.json`** — upstream version bumps collide with ours. Keep `MindNote` / `app.mindnote` / our updater endpoint; take upstream's version number as the base and let our own bump commits replay on top.
- **`Cargo.lock` / `pnpm-lock.yaml`** — during a rebase, `git checkout --theirs <lockfile>` to unblock, then `pnpm install` + `cargo check --workspace` at the end and commit drift as `chore(deps): sync lockfile after upstream rebase`.

---

## Paths

| What | Where |
|---|---|
| Source code | `~/Code/mindnote/` (local per machine — never in Drive; `target/` and `node_modules/` break Drive sync) |
| Narrative project docs | `<Google Drive>/My Drive/Newton/Newton_2025/Cross_Project/MindNote/.project/` |
| Obsidian vault (workspace) | `~/Documents/Obsidian/Tety_Obsidian/` |
| Workspace state | `<vault>/.mindnote/` |
| Attachments | `<vault>/Attached File/` |
| New notes default | `<vault>/MindNote/` |
| AI API keys | macOS Keychain, service `app.mindnote` |
| Release channel | private iCloud Drive DMG feed |

The Drive `.project/` folder holds the longer narrative (CONTEXT, CHANGELOG, PROCESS, SKILLS). This file is self-contained so work is possible on a machine where Drive is not mounted.

---

## Out of scope

Public distribution, App Store, cross-platform parity, multi-user / collaboration, telemetry, hosted auth or sync (upstream deleted those in 2026-09).
