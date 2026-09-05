// ─────────────────────────────────────────────────────────────
// js/current-user.js — helper กลาง: เอา uid + role ของคนที่ล็อกอินอยู่
// ใช้ร่วมกันโดย nav.js, leave-requests.js, leave-request-detail.js
// เพื่อกำหนดว่าจะโชว์ปุ่ม/เมนูไหนบ้างตามตาราง ACL.md
// ─────────────────────────────────────────────────────────────

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

// คืนค่า Promise ที่ resolve เป็น { uid, role } ของผู้ใช้ที่ล็อกอินอยู่ หรือ null ถ้าไม่ได้ล็อกอิน
export function ผู้ใช้ปัจจุบัน() {
  return new Promise(function (resolve) {
    onAuthStateChanged(auth, async function (ผู้ใช้) {
      if (!ผู้ใช้) {
        resolve(null);
        return;
      }
      var สแนป;
      try {
        สแนป = await getDoc(doc(db, "users", ผู้ใช้.uid));
      } catch (err) {
        resolve({ uid: ผู้ใช้.uid, role: "employee" });
        return;
      }
      resolve({ uid: ผู้ใช้.uid, role: (สแนป.exists() && สแนป.data().role) || "employee" });
    });
  });
}
