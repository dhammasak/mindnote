# MindNote — Dev Machines

Per-machine setup for this project. TETY develops MindNote from more than one Mac; toolchain drift between them is the most common cause of "works on my laptop" failures, so each machine records what it actually has.

Companion to [`MINDNOTE.md`](./MINDNOTE.md), which holds the project instructions themselves.

---

## Reference versions

These are the versions the project is known-good on. A machine that differs isn't automatically broken, but if you hit a lockfile or build failure, check here first.

| Tool | Version |
|---|---|
| Node | 24.14.1 |
| pnpm | 10.30.0 |
| Rust / Cargo | 1.95.0 |
| Xcode CLT | `/Applications/Xcode.app/Contents/Developer` |

---

## Machines

### MacBook Pro (primary)

| | |
|---|---|
| Computer name | Dhammasak's MacBook Pro |
| Model / chip | MacBookPro18,1 — Apple M1 Pro (arm64) |
| macOS | 26.6.2 (25G83) |
| Node | v24.14.1 (via nvm, `~/.nvm/versions/node/v24.14.1/bin/node`) |
| pnpm | 10.30.0 |
| Rust | 1.95.0 |
| Repo path | `~/Code/mindnote/` |
| Google Drive | mounted ✅ — `~/Library/CloudStorage/GoogleDrive-dhammasak@gmail.com/My Drive/` |
| Obsidian vault | present ✅ — `~/Documents/Obsidian/Tety_Obsidian/` |
| Playwright browsers | installed ✅ (chromium-1208) |
| git identity | TETY \<dhammasak@gmail.com\> |
| Last verified | 2026-09-04 |

### iMac

Not yet recorded. On first run there, fill this in with the snippet below.

| | |
|---|---|
| Computer name | _TBD_ |
| Model / chip | _TBD_ |
| macOS | _TBD_ |
| Node | _TBD_ |
| pnpm | _TBD_ |
| Rust | _TBD_ |
| Repo path | _TBD (expected `~/Code/mindnote/`)_ |
| Google Drive | _TBD_ |
| Obsidian vault | _TBD_ |
| Playwright browsers | _TBD_ |
| git identity | _TBD_ |
| Last verified | _TBD_ |

---

## Recording a machine

Run this from the repo root and paste the output into a row above.

```bash
cd ~/Code/mindnote && {
  echo "Computer name: $(scutil --get ComputerName 2>/dev/null)"
  echo "Model / chip:  $(sysctl -n hw.model) — $(sysctl -n machdep.cpu.brand_string) ($(uname -m))"
  echo "macOS:         $(sw_vers -productVersion) ($(sw_vers -buildVersion))"
  echo "Node:          $(node -v) [$(which node)]"
  echo "pnpm:          $(pnpm -v)"
  echo "Rust:          $(rustc --version | cut -d' ' -f2)"
  echo "Xcode CLT:     $(xcode-select -p)"
  echo "Repo path:     $(pwd)"
  echo "Google Drive:  $([ -d "$HOME/Library/CloudStorage/GoogleDrive-dhammasak@gmail.com/My Drive" ] && echo mounted || echo MISSING)"
  echo "Vault:         $([ -d "$HOME/Documents/Obsidian/Tety_Obsidian" ] && echo present || echo MISSING)"
  echo "Playwright:    $(ls "$HOME/Library/Caches/ms-playwright" 2>/dev/null | tr '\n' ' ')"
  echo "git identity:  $(git config user.name) <$(git config user.email)>"
}
```

---

## First-time setup on a new machine

```bash
git clone https://github.com/dhammasak/mindnote.git ~/Code/mindnote
cd ~/Code/mindnote
git checkout mindnote/customizations
git remote add upstream https://github.com/hjinco/mdit.git
pnpm install
cargo check --workspace
```

Then, only if you intend to run the editor Storybook tests:

```bash
pnpm -C packages/editor exec playwright install chromium
```

Verify the machine is good:

```bash
pnpm ts:check:desktop && cargo check --workspace && pnpm test:all
```

---

## Things that legitimately differ per machine

These are **not** bugs — don't "fix" them to match another machine.

- **Repo path.** `~/Code/mindnote/` by convention, but nothing depends on it.
- **Node install method.** nvm on the MacBook Pro; another machine may use Homebrew or Volta. Only the version matters.
- **Google Drive mount path.** Contains the account email, and the client can mount it elsewhere. `MINDNOTE.md` is deliberately self-contained so work is possible without Drive; only the narrative `.project/` docs live there.
- **Playwright browsers.** A per-machine cache, not in the repo. Absent until you install it; only the Storybook test project needs it.

## Things that must NOT differ

- **Node / pnpm / Rust versions** — mismatches produce lockfile churn that then gets committed and breaks the other machine.
- **`pnpm-lock.yaml` and `Cargo.lock`** — always regenerate with the tool, always commit, never hand-edit.
- **The Obsidian vault as workspace.** Notes are TETY's real daily-driver data. Never modify vault notes while testing; create a scratch note if you need to type into something, and say so.
