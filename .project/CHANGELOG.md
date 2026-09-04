# Changelog: MindNote (fork)

บันทึกทุก session จากทุกแพลตฟอร์มและทุกเครื่อง เรียงใหม่สุดอยู่บน

---

## [2026-09-04] Release v0.8.7 + install — Claude Code @ imac-condo
- ตัดรีลีส **v0.8.7** (universal x86_64 + arm64) ผ่าน `pnpm release patch` — build ~11 นาทีบนเครื่อง Intel
- วาง `MindNote-0.8.7.dmg` + `latest.json` ที่ `iCloud Drive/MindNote/Releases/` → **รีลีสแรกที่ลงกล่องจริง** (0.8.5 / 0.8.6 เคย bump แต่ไม่เคย build)
- ติดตั้งทับ `/Applications/MindNote.app` บนเครื่องนี้ (0.8.4 → 0.8.7) สำรอง 0.8.4 ไว้ในโฟลเดอร์ชั่วคราวของ session
- `fix(release)`: สคริปต์แก้เฉพาะบรรทัด `version` แทนการ `JSON.stringify` ทั้งไฟล์ — เดิมมันคลี่ array บรรทัดเดียวออกทุกครั้ง กลบ diff ของ bump จริง (ซ้ำรอย commit `b462300`)
- `docs(machines)`: บันทึกว่า `cargo`/`rustup` ไม่อยู่บน `PATH` ของ non-login shell บน imac-condo — `tauri dev` ตายด้วย "failed to run 'cargo metadata'" ถ้าไม่ export ก่อน

---

## [2026-09-04] Quick Note: FlashCard destination — Claude Code @ imac-condo
- เพิ่ม `FlashCard` เป็นปลายทางที่สามของ Quick Note (ต่อจาก MindNote / Inbox) — โฟลเดอร์ถูกสร้างอัตโนมัติที่ `<vault>/FlashCard/` ครั้งแรกที่ใช้
- ยืนยันว่า `Save as…` (native dialog รูทที่ vault) มีอยู่แล้วใน source ตั้งแต่ commit `0db8fb3` — build ที่ติดตั้งอยู่บนเครื่องเก่ากว่านั้น ต้อง rebuild ถึงจะเห็น
- ตรวจแล้ว: `pnpm lint:fix`, `pnpm ts:check:desktop` เขียว (ไม่แตะฝั่ง Rust)

---

## [2026-09-04] Initialisation — Claude Cowork @ imac-condo
- สร้างโฟลเดอร์ .project/ และไฟล์ชี้ทาง (CLAUDE.md / AGENTS.md / GEMINI.md)

---
_(entry ใหม่ใส่เหนือบรรทัดนี้)_
