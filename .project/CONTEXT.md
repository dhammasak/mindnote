# Project Context: MindNote (fork)

**Last Updated:** 2026-09-04  
**Last Platform:** Claude Code  
**Last Machine:** imac-condo  
**Project Phase:** Active development

---

## Current Status
ปล่อย **v0.8.7** แล้ว (universal DMG อยู่ใน iCloud Releases) — Quick Note มีปลายทาง MindNote / Inbox / FlashCard / Save as… ครบ

## Active Tasks
- [ ] กรอก INSTRUCTIONS.md
- [ ] อัปเดต MacBook Pro + iMac ที่บ้านเป็น 0.8.7 (เมนู MindNote → Check for Update… หลัง iCloud ซิงก์)

## Key Decisions
- **Quick Note destinations** = `MindNote` (default) / `Inbox` / `FlashCard` / `Save as…`
  โฟลเดอร์ย่อยเขียนตรงเข้า `<vault>/<folder>/` ไม่ผ่าน dialog และถูก `mkdir` ให้อัตโนมัติครั้งแรก
  ส่วน `Save as…` เปิด native dialog รูทที่ vault สำหรับเคสที่อยากเลือกเอง
  ตัวเลือกล่าสุดจำไว้ใน localStorage key `mindnote.quickNote.saveFolder`

## Known Issues / Blockers
- DMG ไม่ได้ notarize (ad-hoc sign เท่านั้น) — เครื่องอื่นอาจต้องเปิดผ่าน right-click → Open ครั้งแรก
- imac-condo: `cargo` ไม่อยู่บน `PATH` ของ non-login shell ต้อง `export PATH="$HOME/.cargo/bin:$PATH"` ก่อนสั่ง build

## Next Steps
1. เปิด MindNote 0.8.7 ตรวจแถบปลายทางใน Quick Note ของจริง
2. อัปเดตอีกสองเครื่องผ่าน Check for Update…
3. กรอก INSTRUCTIONS.md

---

## Environment (ต่อเครื่อง)
| Machine | Local path | Notes |
|---|---|---|
| macbook-pro-16 | ~/Code/mindnote | |
| imac-condo | ~/Code/mindnote | |
| imac-home | ~/Code/mindnote | |

> ห้ามใส่ absolute path ที่ผูกกับเครื่องเดียวในไฟล์อื่น — ใช้ path relative เสมอ
