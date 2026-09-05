// ─────────────────────────────────────────────────────────────
// js/nav.js — แถบเมนูด้านบนที่ใช้ร่วมกันทุกหน้า
// แก้เมนูที่ไฟล์นี้ที่เดียว ทุกหน้าเปลี่ยนตามพร้อมกัน
// สัปดาห์ที่ 7: เช็คสถานะล็อกอินจริง — ยังไม่ล็อกอินเด้งไปหน้า login,
// ล็อกอินอยู่แล้วเด้งออกจากหน้า login/signup, และแสดงชื่อผู้ใช้ + ปุ่มออกจากระบบ
// เมนูบางรายการซ่อน/แสดงตาม role ของผู้ใช้ ตามตาราง ACL.md
//
// วิธีใช้: ทุกหน้ามี <div id="nav"></div> ไว้บนสุดของ body
// ─────────────────────────────────────────────────────────────

import { auth } from "./firebase-config.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { ผู้ใช้ปัจจุบัน } from "./current-user.js";

var เมนูพื้นฐาน = [
  { href: "index",          ชื่อ: "หน้าแรก" },
  { href: "leave-requests", ชื่อ: "รายการใบลา" }
];

// ชื่อไฟล์ของหน้าที่กำลังเปิดอยู่ (ไม่มีนามสกุล .html เพราะใช้ clean URL) เอาไว้ขีดเส้นใต้เมนูที่ตรงกัน
var หน้าปัจจุบัน = location.pathname.split("/").pop().replace(/\.html$/, "") || "index";
var หน้าไม่ต้องล็อกอิน = ["login", "signup"];
var ที่วาง = document.getElementById("nav");

ผู้ใช้ปัจจุบัน().then(function (โปรไฟล์) {
  if (โปรไฟล์) {
    if (หน้าไม่ต้องล็อกอิน.indexOf(หน้าปัจจุบัน) !== -1) {
      location.href = "leave-requests";
      return;
    }

    var เมนู = เมนูพื้นฐาน.slice();
    if (โปรไฟล์.role === "employee") เมนู.push({ href: "new-leave-request", ชื่อ: "ยื่นใบลาใหม่" });
    if (โปรไฟล์.role === "hr") เมนู.push({ href: "leave-types", ชื่อ: "ประเภทการลา" });
    วาดเมนู(เมนู);

    var navUser = document.getElementById("navUser");
    var ผู้ใช้จริง = auth.currentUser;
    if (navUser && ผู้ใช้จริง) {
      navUser.innerHTML =
        esc(ผู้ใช้จริง.displayName || ผู้ใช้จริง.email) +
        ' <button type="button" id="ปุ่มออกจากระบบ" class="btn-ghost">ออกจากระบบ</button>';
      document.getElementById("ปุ่มออกจากระบบ").addEventListener("click", function () {
        signOut(auth).then(function () { location.href = "login"; });
      });
    }
  } else {
    if (หน้าไม่ต้องล็อกอิน.indexOf(หน้าปัจจุบัน) === -1) {
      location.href = "login";
      return;
    }
    วาดเมนู(เมนูพื้นฐาน);
  }
});

function วาดเมนู(เมนู) {
  var html = '<div class="navbar"><span class="brand">🔧 LeaveEasy</span>';
  เมนู.forEach(function (m) {
    var active = m.href === หน้าปัจจุบัน ? ' class="active"' : "";
    html += '<a href="' + m.href + '"' + active + ">" + m.ชื่อ + "</a>";
  });
  html += '<span class="nav-user" id="navUser"></span></div>';
  if (ที่วาง) ที่วาง.innerHTML = html;
}

// แถบเตือนสีเหลือง ใช้ตอนที่ยังไม่ได้ตั้งค่า Firebase
function showConfigWarning(ข้อความ) {
  var กล่อง = document.createElement("div");
  กล่อง.className = "alert alert-warn";
  กล่อง.innerHTML =
    "⚠️ <strong>ยังไม่ได้ตั้งค่า Firebase</strong> — " +
    (ข้อความ || "หน้านี้จึงยังไม่ได้อ่านข้อมูลจากฐานข้อมูลจริง") +
    "<br>วิธีตั้งค่าอยู่ในไฟล์ SETUP.md ขั้นที่ 4";
  var ที่วาง = document.querySelector(".container") || document.body;
  ที่วาง.insertBefore(กล่อง, ที่วาง.firstChild);
}
