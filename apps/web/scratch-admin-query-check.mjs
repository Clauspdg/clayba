import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, query, where, orderBy, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB7JqGkOR5EQptl8WHEEAfDTVUecb9-I_Y",
  authDomain: "the-ride-dev.firebaseapp.com",
  projectId: "the-ride-dev",
  storageBucket: "the-ride-dev.firebasestorage.app",
  messagingSenderId: "1054412663514",
  appId: "1:1054412663514:web:b2e04ba61940701446d3e3",
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const PENDING_STATUSES = ["submitted", "documents_pending", "background_check", "vehicle_inspection", "interview", "approved"];

async function main() {
  const email = `qa-idxcheck-${Date.now()}@example.com`;
  await createUserWithEmailAndPassword(auth, email, "Repro-Test-Password-123!");
  console.log("Signed in as non-admin test user, running EXACT ApplicationsTab query shape...");
  try {
    const q = query(collection(db, "driverApplications"), where("status", "in", PENDING_STATUSES), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    console.log("RESULT: query executed without error. Doc count visible to this non-admin:", snap.size, "(expect 0 or permission-denied, since this user owns none of them)");
  } catch (err) {
    console.log("RESULT: query FAILED —", err.code, "|", err.message);
  }
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
