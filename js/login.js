// ─────────────────────────────────────────────────────────────
// js/login.js — หน้าเข้าสู่ระบบ (สัปดาห์ที่ 7)
// ─────────────────────────────────────────────────────────────

import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

var ฟอร์ม = document.getElementById("ฟอร์มล็อกอิน");
var กล่องเตือน = document.getElementById("ข้อความเตือน");
var ปุ่มเข้าสู่ระบบ = document.getElementById("ปุ่มเข้าสู่ระบบ");

ฟอร์ม.addEventListener("submit", function (e) {
  e.preventDefault();

  var email = document.getElementById("email").value.trim();
  var password = document.getElementById("password").value;

  if (!email || !password) {
    เตือน("กรอกอีเมลและรหัสผ่านก่อน จึงจะเข้าสู่ระบบได้");
    return;
  }

  ปุ่มเข้าสู่ระบบ.disabled = true;
  signInWithEmailAndPassword(auth, email, password)
    .then(function () {
      location.href = "leave-requests";
    })
    .catch(function (err) {
      เตือน("เข้าสู่ระบบไม่สำเร็จ: " + err.message);
      ปุ่มเข้าสู่ระบบ.disabled = false;
    });
});

function เตือน(ข้อความ) {
  กล่องเตือน.textContent = "⚠️ " + ข้อความ;
  กล่องเตือน.classList.remove("hidden");
}
