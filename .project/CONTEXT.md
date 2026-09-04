# Project Context: MindNote (fork)

**Last Updated:** 2026-09-04  
**Last Platform:** Claude Code  
**Last Machine:** macbook-pro-16  
**Project Phase:** Active development

---

## Current Status
ปล่อย **v0.8.8** แล้ว (universal DMG อยู่ใน iCloud Releases) — แก้บั๊กปุ่ม **Install** ในแจ้งเตือนอัปเดต ซึ่งกดแล้วเงียบมาตั้งแต่มีฟีเจอร์นี้
macbook-pro-16 อัปเดตเป็น 0.8.8 แล้ว

## Active Tasks
- [ ] กรอก INSTRUCTIONS.md
- [ ] อัปเดต imac-condo + imac-home เป็น 0.8.8 — บิลด์เก่ากว่านี้ปุ่ม Install ยังพัง ต้องเปิด DMG จาก Finder เองครั้งสุดท้าย
- [ ] merge หรือทิ้ง `main` ให้จบ — ตอนนี้ค้างอยู่ที่ พ.ค. 2026 มี 7 commits ที่ไม่มีใน `mindnote/customizations`

## Key Decisions
- **Quick Note destinations** = `MindNote` (default) / `Inbox` / `FlashCard` / `Save as…`
  โฟลเดอร์ย่อยเขียนตรงเข้า `<vault>/<folder>/` ไม่ผ่าน dialog และถูก `mkdir` ให้อัตโนมัติครั้งแรก
  ส่วน `Save as…` เปิด native dialog รูทที่ vault สำหรับเคสที่อยากเลือกเอง
  ตัวเลือกล่าสุดจำไว้ใน localStorage key `mindnote.quickNote.saveFolder`

## Known Issues / Blockers
- DMG ไม่ได้ notarize (ad-hoc sign เท่านั้น) — เครื่องอื่นอาจต้องเปิดผ่าน right-click → Open ครั้งแรก
- imac-condo: `cargo` ไม่อยู่บน `PATH` ของ non-login shell ต้อง `export PATH="$HOME/.cargo/bin:$PATH"` ก่อนสั่ง build
- ปุ่ม Install ใช้ได้ตั้งแต่ 0.8.8 เท่านั้น — ACL ถูก compile ฝังในไบนารี บิลด์ ≤ 0.8.7 บนเครื่องอื่นจึงยังกดไม่ได้
- `main` แยกทางกับ `mindnote/customizations` ตั้งแต่ พ.ค. 2026 — อย่า merge งานเข้า `main` โดยไม่ตรวจก่อน

## Next Steps
1. อัปเดต imac-condo + imac-home เป็น 0.8.8 (เปิด DMG จาก Finder เอง เพราะบิลด์เก่ายังพัง)
2. ทดสอบปุ่ม Install ของจริงตอนออก 0.8.9
3. กรอก INSTRUCTIONS.md

---

## Environment (ต่อเครื่อง)
| Machine | Local path | Notes |
|---|---|---|
| macbook-pro-16 | ~/Code/mindnote | |
| imac-condo | ~/Code/mindnote | |
| imac-home | ~/Code/mindnote | |

> ห้ามใส่ absolute path ที่ผูกกับเครื่องเดียวในไฟล์อื่น — ใช้ path relative เสมอ
