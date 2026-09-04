# Changelog: MindNote (fork)

บันทึกทุก session จากทุกแพลตฟอร์มและทุกเครื่อง เรียงใหม่สุดอยู่บน

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
