// ─────────────────────────────────────────────────────────────
// js/firebase-config.js — จุดเชื่อมต่อ Firebase ที่ใช้ร่วมกันทุกหน้า
// โหลดผ่าน CDN โดยตรง (ไม่ใช้ bundler) ตามข้อกำหนด "ห้ามใช้ framework"
// ─────────────────────────────────────────────────────────────

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDKRKOJHG7iS_2uCPwy7GOO7DZjGU7028M",
  authDomain: "leaveeasy-nan.firebaseapp.com",
  projectId: "leaveeasy-nan",
  storageBucket: "leaveeasy-nan.firebasestorage.app",
  messagingSenderId: "966480630691",
  appId: "1:966480630691:web:bf663461b317fc895cc016"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
