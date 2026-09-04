# Changelog: MindNote (fork)

บันทึกทุก session จากทุกแพลตฟอร์มและทุกเครื่อง เรียงใหม่สุดอยู่บน

---

## [2026-09-04] Release v0.8.8 + install — Claude Code @ macbook-pro-16
- merge `fix/updater-install-button` เข้า `mindnote/customizations` (`328329e`) — **ไม่ merge เข้า `main`** เพราะ `main` ค้างอยู่ที่ พ.ค. 2026 ตามหลังอยู่ 51 commits (มี 7 commits ที่ยังไม่ถูกยกมา) การ merge เข้านั่นจะย้อนโค้ดทั้งก้อน
- ตัด **v0.8.8** universal (`x86_64 arm64` ผ่าน guard ของ release.sh) วาง DMG + `latest.json` ลง iCloud Releases แล้ว
- ติดตั้งทับ `/Applications/MindNote.app` บนเครื่องนี้ (0.8.6 → 0.8.8) — เครื่องนี้ยังไม่เคยขึ้น 0.8.7 สวนทางกับที่ CONTEXT เคยบันทึกว่าอัปเดตแล้ว (นั่นคือ imac-condo)
- ยืนยันหลังติดตั้ง: `CFBundleShortVersionString` = 0.8.8, `lipo -archs` = `x86_64 arm64`, และ `allow-open-path` + path scope ฝังอยู่ใน ACL ของไบนารีจริง
- สำรอง 0.8.6 ไว้ที่โฟลเดอร์ชั่วคราวของ session (หายเมื่อ session จบ — ถ้าอยากเก็บถาวรต้องย้ายเอง)
- ⚠️ ลายเซ็นเป็น ad-hoc และเปลี่ยนทุกบิลด์ — สิทธิ์ระดับระบบ (global shortcut / accessibility) อาจต้องอนุญาตใหม่หลังอัปเดต

---

## [2026-09-04] Fix: ปุ่ม Install ในแจ้งเตือนอัปเดตไม่ทำงาน — Claude Code @ imac-condo
- อาการ: toast "MindNote 0.8.7 is available" ขึ้นปกติ แต่กด **Install** แล้วเงียบ ไม่มีอะไรเกิดขึ้น
- สาเหตุที่ 1 — permission: capability ให้แค่ `opener:default` ซึ่งมีเฉพาะ `allow-open-url` / `allow-reveal-item-in-dir` / `allow-default-urls` **ไม่มี `allow-open-path`** → คำสั่ง `openPath(dmgPath)` ถูก ACL ปฏิเสธ
- สาเหตุที่ 2 — silent failure: `onClick` เรียก `void openUpdateDmg(...)` ไม่มี `catch` → error ที่ ACL โยนกลับมาถูกกลืนหมด ผู้ใช้จึงไม่เห็นแม้แต่ข้อความ error
- แก้: เพิ่ม `opener:allow-open-path` แบบมี scope จำกัดเฉพาะ `$HOME/Library/Mobile Documents/com~apple~CloudDocs/MindNote/Releases/*.dmg` (open_path ต้องผ่านทั้ง permission และ path scope) + ห่อปุ่ม Install ด้วย `installUpdate()` ที่ fallback ไป reveal in Finder แล้วขึ้น toast บอกเหตุผลเมื่อ mount ไม่สำเร็จ
- ตรวจแล้ว: `pnpm lint`, `pnpm ts:check:desktop`, `cargo check -p mdit` เขียว และยืนยันว่า `allow-open-path` ปรากฏใน `gen/schemas/capabilities.json` ที่ build script ผลิตออกมาจริง
- ยังไม่ได้ตัดรีลีส — build 0.8.7 ที่ติดตั้งอยู่ยังมีบั๊กนี้ ต้องขึ้น 0.8.8 ถึงจะกด Install ได้จริง ระหว่างนี้เปิด DMG จาก Finder เอง

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
