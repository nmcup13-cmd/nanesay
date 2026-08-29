// ─────────────────────────────────────────────────────────────
// js/seed.js — เครื่องมือใส่ข้อมูลตัวอย่างลง Firestore ครั้งเดียว
// ไม่ใช่หน้าจอหลักของระบบ ใช้คู่กับ seed.html เท่านั้น
// คัดลอกข้อมูลจาก window.LEAVE_DATA (js/data.js) ไปเก็บด้วย id เดิมเป๊ะ
// ─────────────────────────────────────────────────────────────

import { db } from "./firebase-config.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const ปุ่ม = document.getElementById("ปุ่มเริ่ม");
const บันทึก = document.getElementById("บันทึก");

function log(ข้อความ) {
  บันทึก.innerHTML += "<p>" + ข้อความ + "</p>";
}

ปุ่ม.addEventListener("click", function () {
  ปุ่ม.disabled = true;
  บันทึก.innerHTML = "";
  seedAll().catch(function (err) {
    log('<span style="color:#b3261e">เกิดข้อผิดพลาด: ' + err.message + "</span>");
    ปุ่ม.disabled = false;
  });
});

async function seedAll() {
  log("เริ่มใส่ข้อมูล…");

  for (const u of window.LEAVE_DATA.users) {
    await setDoc(doc(db, "users", u.id), { name: u.name, email: u.email, role: u.role });
  }
  log("✅ users: " + window.LEAVE_DATA.users.length + " รายการ");

  for (const lt of window.LEAVE_DATA.leaveTypes) {
    await setDoc(doc(db, "leaveTypes", lt.id), { name: lt.name });
  }
  log("✅ leaveTypes: " + window.LEAVE_DATA.leaveTypes.length + " รายการ");

  for (const lr of window.LEAVE_DATA.leaveRequests) {
    await setDoc(doc(db, "leaveRequests", lr.id), {
      title: lr.title,
      reason: lr.reason,
      status: lr.status,
      requesterId: lr.requesterId,
      requesterName: lr.requesterName,
      approverId: lr.approverId,
      approverName: lr.approverName,
      leaveTypeId: lr.leaveTypeId,
      leaveTypeName: lr.leaveTypeName,
      startDate: lr.startDate,
      endDate: lr.endDate,
      createdAt: lr.createdAt
    });
  }
  log("✅ leaveRequests: " + window.LEAVE_DATA.leaveRequests.length + " รายการ");

  for (const ap of window.LEAVE_DATA.approvals) {
    await setDoc(doc(db, "leaveRequests", ap.requestId, "approvals", ap.id), {
      authorId: ap.authorId,
      authorName: ap.authorName,
      message: ap.message,
      createdAt: ap.createdAt
    });
  }
  log("✅ approvals: " + window.LEAVE_DATA.approvals.length + " รายการ");

  log("<strong>เสร็จแล้ว — เปิด Firebase Console เพื่อตรวจสอบ</strong>");
  ปุ่ม.disabled = false;
}
