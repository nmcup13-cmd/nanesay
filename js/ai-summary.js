// ─────────────────────────────────────────────────────────────
// js/ai-summary.js — เรียก OpenRouter ให้สรุปใบลาสั้น ๆ ให้หัวหน้าอ่านก่อนกดอนุมัติ
// (สัปดาห์ที่ 8) — เรียกตรงจาก browser เพราะสเปกห้ามเขียนเซิร์ฟเวอร์เอง
// ─────────────────────────────────────────────────────────────

import { OPENROUTER_API_KEY, OPENROUTER_MODEL } from "./ai-config.js";

var เวลารอสูงสุด = 15000; // ms — ตาม US-09: เรียกไม่สำเร็จหรือรอเกิน 15 วินาที ต้องไม่ค้าง

// คืนค่า { สำเร็จ: true, ข้อความ, input } หรือ { สำเร็จ: false, เหตุผล, input }
export async function สรุปใบลาด้วยAI(ใบ) {
  var input =
    "หัวข้อ: " + ใบ.title + "\n" +
    "ประเภทการลา: " + ใบ.leaveTypeName + "\n" +
    "วันที่ลา: " + ใบ.startDate + " ถึง " + ใบ.endDate + "\n" +
    "ผู้ขอลา: " + ใบ.requesterName + "\n" +
    "เหตุผล: " + ใบ.reason;

  var ตัวตัดเวลา = new AbortController();
  var หมดเวลาแล้ว = setTimeout(function () { ตัวตัดเวลา.abort(); }, เวลารอสูงสุด);

  var response;
  try {
    response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: ตัวตัดเวลา.signal,
      headers: {
        Authorization: "Bearer " + OPENROUTER_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          {
            role: "user",
            content:
              "สรุปใบลานี้ให้หัวหน้าอ่านก่อนตัดสินใจอนุมัติ ภายใน 1-2 ประโยค ภาษาไทย กระชับ ไม่ต้องทักทาย:\n\n" + input,
          },
        ],
      }),
    });
  } catch (err) {
    clearTimeout(หมดเวลาแล้ว);
    if (err.name === "AbortError") {
      return { สำเร็จ: false, เหตุผล: "รอเกิน 15 วินาที ระบบไม่สามารถสรุปให้ได้ตอนนี้", input: input };
    }
    return { สำเร็จ: false, เหตุผล: "เรียก AI ไม่สำเร็จ: " + err.message, input: input };
  }
  clearTimeout(หมดเวลาแล้ว);

  if (!response.ok) {
    return { สำเร็จ: false, เหตุผล: "เรียก AI ไม่สำเร็จ (HTTP " + response.status + ")", input: input };
  }

  var data;
  try {
    data = await response.json();
  } catch (err) {
    return { สำเร็จ: false, เหตุผล: "อ่านผลลัพธ์จาก AI ไม่สำเร็จ", input: input };
  }

  var ข้อความ = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (!ข้อความ || !ข้อความ.trim()) {
    return { สำเร็จ: false, เหตุผล: "AI ไม่ได้ตอบข้อความสรุปกลับมา", input: input };
  }

  return { สำเร็จ: true, ข้อความ: ข้อความ.trim(), input: input };
}
