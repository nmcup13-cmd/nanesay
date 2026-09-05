// ─────────────────────────────────────────────────────────────
// js/signup.js — หน้าสมัครสมาชิก (สัปดาห์ที่ 7)
// สมัครด้วยอีเมล/รหัสผ่าน แล้วสร้างไฟล์ users/{uid} คู่กัน
// (role เริ่มต้นเป็น employee เสมอ — เปลี่ยน role ทำผ่านหน้านี้ไม่ได้)
// ─────────────────────────────────────────────────────────────

import { db, auth } from "./firebase-config.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

var ฟอร์ม = document.getElementById("ฟอร์มสมัคร");
var กล่องเตือน = document.getElementById("ข้อความเตือน");
var ปุ่มสมัคร = document.getElementById("ปุ่มสมัคร");

ฟอร์ม.addEventListener("submit", function (e) {
  e.preventDefault();

  var name = document.getElementById("name").value.trim();
  var email = document.getElementById("email").value.trim();
  var password = document.getElementById("password").value;

  if (!name || !email || !password) {
    เตือน("กรอกให้ครบทุกช่องก่อน จึงจะสมัครสมาชิกได้");
    return;
  }

  ปุ่มสมัคร.disabled = true;
  createUserWithEmailAndPassword(auth, email, password)
    .then(function (ผลลัพธ์) {
      var ผู้ใช้ = ผลลัพธ์.user;
      return updateProfile(ผู้ใช้, { displayName: name })
        .then(function () {
          return setDoc(doc(db, "users", ผู้ใช้.uid), { name: name, email: email, role: "employee" });
        });
    })
    .then(function () {
      location.href = "leave-requests";
    })
    .catch(function (err) {
      เตือน("สมัครสมาชิกไม่สำเร็จ: " + err.message);
      ปุ่มสมัคร.disabled = false;
    });
});

function เตือน(ข้อความ) {
  กล่องเตือน.textContent = "⚠️ " + ข้อความ;
  กล่องเตือน.classList.remove("hidden");
}
