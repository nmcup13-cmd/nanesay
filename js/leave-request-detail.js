// ─────────────────────────────────────────────────────────────
// js/leave-request-detail.js — หน้าที่ 3 รายละเอียดใบลา
// สัปดาห์ที่ 6: อ่านใบลาจริงจาก Firestore · ปุ่มอนุมัติ/ไม่อนุมัติแก้ status จริง
// ─────────────────────────────────────────────────────────────

import { db } from "./firebase-config.js";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  addDoc,
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { ผู้ใช้ปัจจุบัน } from "./current-user.js";
import { สรุปใบลาด้วยAI } from "./ai-summary.js";

var รหัสใบลา = ค่าจากURL("id");
var กล่องใบลา = document.getElementById("กล่องใบลา");
var กล่องความเห็น = document.getElementById("กล่องความเห็น");
var ใบ = null;
var ความเห็น = [];
var ผู้ใช้ = null; // { uid, role } ของคนที่ล็อกอินอยู่ ใช้กำหนดว่าโชว์ปุ่มไหนบ้าง (ตาม ACL.md)

โหลดข้อมูล();

async function โหลดข้อมูล() {
  if (!รหัสใบลา) {
    กล่องใบลา.innerHTML = "<p>ไม่พบใบขอลาที่ต้องการ — อาจถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง</p>";
    return;
  }

  var สแนปช็อต;
  try {
    สแนปช็อต = await getDoc(doc(db, "leaveRequests", รหัสใบลา));
  } catch (err) {
    กล่องใบลา.innerHTML = "<p>โหลดข้อมูลจาก Firestore ไม่สำเร็จ: " + esc(err.message) + "</p>";
    return;
  }

  if (!สแนปช็อต.exists()) {
    กล่องใบลา.innerHTML = "<p>ไม่พบใบขอลาที่ต้องการ — อาจถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง</p>";
    return;
  }

  ใบ = Object.assign({ id: สแนปช็อต.id }, สแนปช็อต.data());
  ผู้ใช้ = await ผู้ใช้ปัจจุบัน();

  var ความเห็นสแนปช็อต = await getDocs(collection(db, "leaveRequests", รหัสใบลา, "approvals"));
  ความเห็น = ความเห็นสแนปช็อต.docs.map(function (เอกสาร) {
    return Object.assign({ id: เอกสาร.id }, เอกสาร.data());
  });

  วาดใบลา();
  วาดความเห็น();
  กล่องความเห็น.classList.remove("hidden");

  document.getElementById("ปุ่มส่งความเห็น").addEventListener("click", ส่งความเห็น);
}

// ── วาดข้อมูลใบลาลงหน้าจอ ──
function วาดใบลา() {
  var แถว = [
    ["หัวข้อ", esc(ใบ.title)],
    ["เหตุผลการลา", esc(ใบ.reason)],
    ["ประเภทการลา", esc(ใบ.leaveTypeName)],
    ["วันที่ลา", esc(ใบ.startDate) + " ถึง " + esc(ใบ.endDate)],
    ["ผู้ขอลา", esc(ใบ.requesterName)],
    ["ผู้อนุมัติ", ใบ.approverName ? esc(ใบ.approverName) : "ยังไม่ได้กำหนดผู้อนุมัติ"],
    ["สถานะ", ป้ายสถานะ(ใบ.status)],
    ["วันที่ยื่น", esc(ใบ.createdAt)],
  ];

  var html = แถว.map(function (r) {
    return '<div class="field-row"><span class="k">' + r[0] + "</span><span>" + r[1] + "</span></div>";
  }).join("");

  // ปุ่มอนุมัติ/ไม่อนุมัติ: เฉพาะ manager/hr และห้ามอนุมัติใบของตัวเอง (ตาม ACL.md)
  // ปุ่มลบ: เฉพาะเจ้าของใบ ไม่ว่า role ใด — ทั้งคู่แสดงเฉพาะใบที่ยังรอพิจารณา
  var เป็นเจ้าของ = !!(ผู้ใช้ && ใบ.requesterId === ผู้ใช้.uid);
  var อนุมัติได้ = !!(ผู้ใช้ && (ผู้ใช้.role === "manager" || ผู้ใช้.role === "hr") && !เป็นเจ้าของ);
  var ลบได้ = เป็นเจ้าของ;

  // ปุ่มให้ AI ช่วยสรุปใบลา — เฉพาะคนที่กำลังจะพิจารณาใบนี้ (US-09/สัปดาห์ที่ 8)
  if (อนุมัติได้ && ใบ.status === "รอพิจารณา") {
    html +=
      '<div class="card" id="กล่องสรุปAI">' +
      "<h2>สรุปโดย AI</h2>" +
      (ใบ.aiSuggestion
        ? '<p class="badge badge-ai">ข้อเสนอจาก AI — โปรดตรวจสอบก่อนยืนยัน</p><p>' + esc(ใบ.aiSuggestion) + "</p>"
        : "<p>ยังไม่มีสรุปจาก AI สำหรับใบนี้</p>") +
      '<div id="เตือนสรุปAI" class="alert alert-error hidden"></div>' +
      '<div class="btn-row"><button type="button" id="ปุ่มสรุปAI">' +
      (ใบ.aiSuggestion ? "สรุปใหม่อีกครั้ง" : "ให้ AI ช่วยสรุปใบลา") +
      "</button></div>" +
      "</div>";
  }

  if (ใบ.status === "รอพิจารณา" && (อนุมัติได้ || ลบได้)) {
    html += '<div id="เตือนสถานะ" class="alert alert-error hidden"></div>';
    if (อนุมัติได้) {
      html +=
        '<div class="btn-row">' +
        '<button type="button" class="btn-ok" id="ปุ่มอนุมัติ">อนุมัติ</button>' +
        '<button type="button" class="btn-danger" id="ปุ่มไม่อนุมัติ">ไม่อนุมัติ</button>' +
        "</div>";
    }
    if (ลบได้) {
      html += '<div class="btn-row"><button type="button" class="btn-danger" id="ปุ่มลบ">ลบใบลา</button></div>';
    }
  } else if (ใบ.status !== "รอพิจารณา") {
    html += '<p class="hint">ใบนี้พิจารณาแล้ว จึงเปลี่ยนสถานะต่อไม่ได้</p>';
  }

  กล่องใบลา.innerHTML = html;

  if (อนุมัติได้ && ใบ.status === "รอพิจารณา") {
    document.getElementById("ปุ่มสรุปAI").addEventListener("click", สรุปด้วยAI);
    document.getElementById("ปุ่มอนุมัติ").addEventListener("click", function () { เปลี่ยนสถานะ("อนุมัติ"); });
    document.getElementById("ปุ่มไม่อนุมัติ").addEventListener("click", function () { เปลี่ยนสถานะ("ไม่อนุมัติ"); });
  }
  if (ลบได้ && ใบ.status === "รอพิจารณา") {
    document.getElementById("ปุ่มลบ").addEventListener("click", ลบใบลา);
  }
}

// ── ขั้น 1-3: อ่านใบลานี้ → ให้ AI เขียนสรุปสั้น ๆ → เขียนผลกลับลง Firestore ──
// สถานะ (status) ห้ามถูกแตะจากฟังก์ชันนี้เด็ดขาด — เปลี่ยนได้เฉพาะตอนกดอนุมัติ/ไม่อนุมัติเท่านั้น
async function สรุปด้วยAI() {
  var ปุ่ม = document.getElementById("ปุ่มสรุปAI");
  var เตือน = document.getElementById("เตือนสรุปAI");
  เตือน.classList.add("hidden");
  ปุ่ม.disabled = true;
  ปุ่ม.textContent = "กำลังสรุป…";

  var ผล = await สรุปใบลาด้วยAI(ใบ); // ← ขั้น 1 (อ่านใบลานี้) + ขั้น 2 (เขียนสรุปสั้น ๆ) อยู่ในนี้

  if (!ผล.สำเร็จ) {
    เตือน.textContent = "⚠️ " + ผล.เหตุผล + " — ยังกดอนุมัติ/ไม่อนุมัติได้ตามปกติ";
    เตือน.classList.remove("hidden");
    ปุ่ม.disabled = false;
    ปุ่ม.textContent = ใบ.aiSuggestion ? "สรุปใหม่อีกครั้ง" : "ให้ AI ช่วยสรุปใบลา";
    return;
  }

  // ขั้น 3: เขียนสรุปกลับลงฐาน — ช่อง aiSuggestion ของใบลา + โฟลเดอร์ย่อย aiLog (บันทึกทุกครั้งที่เรียก)
  try {
    await updateDoc(doc(db, "leaveRequests", รหัสใบลา), { aiSuggestion: ผล.ข้อความ });
    await addDoc(collection(db, "leaveRequests", รหัสใบลา, "aiLog"), {
      input: ผล.input,
      output: ผล.ข้อความ,
      createdAt: เวลาตอนนี้(),
    });
  } catch (err) {
    เตือน.textContent = "⚠️ สรุปสำเร็จ แต่บันทึกลงฐานข้อมูลไม่สำเร็จ: " + err.message + " — ยังกดอนุมัติ/ไม่อนุมัติได้ตามปกติ";
    เตือน.classList.remove("hidden");
    ปุ่ม.disabled = false;
    ปุ่ม.textContent = "ลองสรุปใหม่อีกครั้ง";
    return;
  }

  ใบ.aiSuggestion = ผล.ข้อความ;
  วาดใบลา();
}

// ── เปลี่ยนสถานะจริงใน Firestore (แก้เฉพาะช่อง status) ──
async function เปลี่ยนสถานะ(สถานะใหม่) {
  // กฎ: จะไม่อนุมัติได้ ต้องมีความเห็นอย่างน้อย 1 รายการก่อน
  if (สถานะใหม่ === "ไม่อนุมัติ" && ความเห็น.length === 0) {
    alert("ต้องเขียนความเห็นอย่างน้อย 1 รายการก่อน จึงจะกดไม่อนุมัติได้");
    return;
  }

  var ปุ่มอนุมัติ = document.getElementById("ปุ่มอนุมัติ");
  var ปุ่มไม่อนุมัติ = document.getElementById("ปุ่มไม่อนุมัติ");
  ปุ่มอนุมัติ.disabled = true;
  ปุ่มไม่อนุมัติ.disabled = true;

  try {
    await updateDoc(doc(db, "leaveRequests", รหัสใบลา), { status: สถานะใหม่ });
  } catch (err) {
    var เตือน = document.getElementById("เตือนสถานะ");
    เตือน.textContent = "⚠️ เปลี่ยนสถานะไม่สำเร็จ: " + err.message;
    เตือน.classList.remove("hidden");
    ปุ่มอนุมัติ.disabled = false;
    ปุ่มไม่อนุมัติ.disabled = false;
    return;
  }

  ใบ.status = สถานะใหม่;
  วาดใบลา();
}

// ── ลบใบลาจริงจาก Firestore (ต้องยืนยันก่อนทุกครั้ง) ──
async function ลบใบลา() {
  if (!confirm("ยืนยันการลบใบลานี้หรือไม่ — ลบแล้วกู้คืนไม่ได้")) return;

  var ปุ่มลบ = document.getElementById("ปุ่มลบ");
  ปุ่มลบ.disabled = true;

  try {
    await deleteDoc(doc(db, "leaveRequests", รหัสใบลา));
  } catch (err) {
    var เตือน = document.getElementById("เตือนสถานะ");
    เตือน.textContent = "⚠️ ลบไม่สำเร็จ: " + err.message;
    เตือน.classList.remove("hidden");
    ปุ่มลบ.disabled = false;
    return;
  }

  location.href = "leave-requests";
}

// ── รายการความเห็น เรียงจากเก่าไปใหม่ ──
function วาดความเห็น() {
  var ที่วาง = document.getElementById("รายการความเห็น");
  if (ความเห็น.length === 0) {
    ที่วาง.innerHTML = "<p>ยังไม่มีความเห็นในใบนี้</p>";
    return;
  }
  ที่วาง.innerHTML = ความเห็น
    .slice()
    .sort(function (a, b) { return a.createdAt < b.createdAt ? -1 : 1; })
    .map(function (c) {
      return '<div class="comment"><div class="meta">' + esc(c.authorName) + " · " + esc(c.createdAt) +
             "</div><div>" + esc(c.message) + "</div></div>";
    }).join("");
}

// ── ส่งความเห็นใหม่ (ยังเก็บในหน่วยความจำเท่านั้น — ยังไม่บันทึกลง Firestore) ──
function ส่งความเห็น() {
  var ช่อง = document.getElementById("ข้อความความเห็น");
  var เตือน = document.getElementById("เตือนความเห็น");
  var ข้อความ = ช่อง.value.trim();

  if (!ข้อความ) {
    เตือน.textContent = "⚠️ พิมพ์ข้อความก่อน จึงจะส่งความเห็นได้";
    เตือน.classList.remove("hidden");
    return;
  }
  เตือน.classList.add("hidden");

  // สัปดาห์ที่ 6 ยังไม่มีล็อกอิน จึงสมมติว่าผู้เขียนคือ สมหญิง รักงาน
  ความเห็น.push({
    id: "ap-ใหม่-" + Date.now(),
    requestId: ใบ.id,
    authorId: "u002", authorName: "สมหญิง รักงาน",
    message: ข้อความ,
    createdAt: เวลาตอนนี้(),
  });
  ช่อง.value = "";
  วาดความเห็น();
}
