# Project Context: MindNote (fork)

**Last Updated:** 2026-09-04  
**Last Platform:** Claude Code  
**Last Machine:** imac-condo  
**Project Phase:** Active development

---

## Current Status
กำลังขัด Quick Note window — ล่าสุดเพิ่ม `FlashCard` เป็นปลายทางบันทึก

## Active Tasks
- [ ] กรอก INSTRUCTIONS.md
- [ ] rebuild + ติดตั้ง DMG ใหม่บนทุกเครื่อง (build ที่ใช้อยู่เก่ากว่า picker + Save as…)

## Key Decisions
- **Quick Note destinations** = `MindNote` (default) / `Inbox` / `FlashCard` / `Save as…`
  โฟลเดอร์ย่อยเขียนตรงเข้า `<vault>/<folder>/` ไม่ผ่าน dialog และถูก `mkdir` ให้อัตโนมัติครั้งแรก
  ส่วน `Save as…` เปิด native dialog รูทที่ vault สำหรับเคสที่อยากเลือกเอง
  ตัวเลือกล่าสุดจำไว้ใน localStorage key `mindnote.quickNote.saveFolder`

## Known Issues / Blockers
- Build ที่ติดตั้งอยู่บนเครื่องยังเป็นรุ่นก่อน destination picker — UI จริงจะยังไม่โชว์ปุ่มจนกว่าจะ rebuild

## Next Steps
1. `pnpm dev:desktop` เพื่อดู Quick Note ของจริง แล้วออก DMG ใหม่
2. กรอก INSTRUCTIONS.md

---

## Environment (ต่อเครื่อง)
| Machine | Local path | Notes |
|---|---|---|
| macbook-pro-16 | ~/Code/mindnote | |
| imac-condo | ~/Code/mindnote | |
| imac-home | ~/Code/mindnote | |

> ห้ามใส่ absolute path ที่ผูกกับเครื่องเดียวในไฟล์อื่น — ใช้ path relative เสมอ
