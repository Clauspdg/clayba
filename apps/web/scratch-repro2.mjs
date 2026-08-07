// Follow-up isolation test: is ANY update to a freshly-created draft denied
// (regardless of field), or is it specifically about reviewedBy/rejectionReason
// being absent on the document? Tests both a trivial update and an update
// where reviewedBy/rejectionReason are pre-set to null at creation time.
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
import { getFirestore, collection, doc, setDoc, updateDoc, serverTimestamp, deleteDoc } from "firebase/firestore";

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

async function makeUser() {
  const email = `qa-repro-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  const cred = await createUserWithEmailAndPassword(auth, email, "Repro-Test-Password-123!");
  return cred.user;
}

async function testA_trivialUpdateNoReviewedByAtCreation() {
  console.log("\n=== Test A: doc created WITHOUT reviewedBy/rejectionReason, trivial update (no personalInfo) ===");
  const user = await makeUser();
  const ref = doc(collection(db, "driverApplications"));
  await setDoc(ref, { userId: user.uid, status: "draft", createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  try {
    await updateDoc(ref, { updatedAt: serverTimestamp() });
    console.log("RESULT: SUCCESS");
  } catch (err) {
    console.log("RESULT: FAILED —", err.code, err.message);
  }
  await deleteUser(user);
}

async function testB_reviewedByRejectionReasonPreSetToNull() {
  console.log("\n=== Test B: doc created WITH reviewedBy/rejectionReason explicitly set to null, then update personalInfo ===");
  const user = await makeUser();
  const ref = doc(collection(db, "driverApplications"));
  await setDoc(ref, {
    userId: user.uid,
    status: "draft",
    reviewedBy: null,
    rejectionReason: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  try {
    await updateDoc(ref, { personalInfo: { firstName: "Test" }, updatedAt: serverTimestamp() });
    console.log("RESULT: SUCCESS");
  } catch (err) {
    console.log("RESULT: FAILED —", err.code, err.message);
  }
  await deleteUser(user);
}

async function main() {
  await testA_trivialUpdateNoReviewedByAtCreation();
  await testB_reviewedByRejectionReasonPreSetToNull();
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("SCRIPT ERROR:", e);
    process.exit(1);
  });
