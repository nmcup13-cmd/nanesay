// ─────────────────────────────────────────────────────────────
// js/new-leave-request.js — หน้าที่ 2 ยื่นใบลาใหม่
// สัปดาห์ที่ 6: บันทึกใบลาใหม่ลง Firestore จริง (โฟลเดอร์ leaveRequests)
// ประเภทการลาในรายการเลื่อนลงก็อ่านจาก Firestore จริง (โฟลเดอร์ leaveTypes)
// ─────────────────────────────────────────────────────────────

import { db, auth } from "./firebase-config.js";
import {
  collection,
  getDocs,
  addDoc,
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

var ฟอร์ม = document.getElementById("ฟอร์มใบลา");
var ช่องประเภท = document.getElementById("leaveTypeId");
var กล่องเตือน = document.getElementById("ข้อความเตือน");
var ปุ่มบันทึก = document.getElementById("ปุ่มบันทึก");
var ประเภททั้งหมด = [];

โหลดประเภทการลา();

async function โหลดประเภทการลา() {
  try {
    const สแนปช็อต = await getDocs(collection(db, "leaveTypes"));
    ประเภททั้งหมด = สแนปช็อต.docs.map(function (เอกสาร) {
      return Object.assign({ id: เอกสาร.id }, เอกสาร.data());
    });
  } catch (err) {
    เตือน("โหลดประเภทการลาไม่สำเร็จ: " + err.message);
    return;
  }

  if (ประเภททั้งหมด.length === 0) {
    เตือน("ยังไม่มีประเภทการลาในระบบ — ต้อง seed ข้อมูล leaveTypes ก่อน (เปิด seed.html)");
    return;
  }

  ประเภททั้งหมด.forEach(function (ประเภท) {
    var ตัวเลือก = document.createElement("option");
    ตัวเลือก.value = ประเภท.id;
    ตัวเลือก.textContent = ประเภท.name;
    ช่องประเภท.appendChild(ตัวเลือก);
  });
}

ฟอร์ม.addEventListener("submit", function (e) {
  e.preventDefault();

  var ค่า = {
    title: document.getElementById("title").value.trim(),
    reason: document.getElementById("reason").value.trim(),
    leaveTypeId: ช่องประเภท.value,
    startDate: document.getElementById("startDate").value,
    endDate: document.getElementById("endDate").value,
  };

  // ตรวจว่ากรอกครบก่อนบันทึก
  if (!ค่า.title || !ค่า.reason || !ค่า.leaveTypeId || !ค่า.startDate || !ค่า.endDate) {
    เตือน("กรอกไม่ครบ — ต้องกรอกทุกช่องก่อนกดบันทึก");
    return;
  }
  if (ค่า.endDate < ค่า.startDate) {
    เตือน("วันที่สิ้นสุดต้องไม่มาก่อนวันที่เริ่มลา");
    return;
  }

  var ประเภท = ประเภททั้งหมด.find(function (t) { return t.id === ค่า.leaveTypeId; });

  // สัปดาห์ที่ 7: ผู้ขอลาคือคนที่ล็อกอินอยู่จริง (nav.js การันตีแล้วว่าเข้าหน้านี้ได้ต้องล็อกอินอยู่)
  var ใบใหม่ = {
    title: ค่า.title,
    reason: ค่า.reason,
    status: "รอพิจารณา", // ใบใหม่เริ่มที่ รอพิจารณา เสมอ
    requesterId: auth.currentUser.uid,
    requesterName: auth.currentUser.displayName || auth.currentUser.email,
    approverId: "", approverName: "",
    leaveTypeId: ประเภท.id, leaveTypeName: ประเภท.name,
    startDate: ค่า.startDate,
    endDate: ค่า.endDate,
    createdAt: เวลาตอนนี้(),
  };

  ปุ่มบันทึก.disabled = true;
  addDoc(collection(db, "leaveRequests"), ใบใหม่)
    .then(function () {
      location.href = "leave-requests";
    })
    .catch(function (err) {
      เตือน("บันทึกไม่สำเร็จ: " + err.message);
      ปุ่มบันทึก.disabled = false;
    });
});

function เตือน(ข้อความ) {
  กล่องเตือน.textContent = "⚠️ " + ข้อความ;
  กล่องเตือน.classList.remove("hidden");
}
