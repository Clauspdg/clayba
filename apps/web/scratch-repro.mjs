// Throwaway repro script — mirrors the EXACT client-SDK calls the real
// become-a-driver wizard makes (createDraftApplication then
// saveApplicationProgress for the "personal" step), against the real
// deployed the-ride-dev project and its currently-deployed firestore.rules.
// Creates one disposable Auth user + one disposable Firestore doc, prints
// the exact result, then deletes both.
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut, deleteUser } from "firebase/auth";
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

const email = `qa-repro-${Date.now()}@example.com`;
const password = "Repro-Test-Password-123!";

async function main() {
  console.log("1) Creating disposable test user:", email);
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const userId = cred.user.uid;
  console.log("   uid:", userId);

  console.log("2) createDraftApplication — exact write from packages/firebase/src/client/driver-application.ts");
  const ref = doc(collection(db, "driverApplications"));
  const input = { userId, status: "draft" };
  await setDoc(ref, { ...input, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  console.log("   draft created, id:", ref.id);

  console.log("3) saveApplicationProgress({ personalInfo }) — exact write the 'personal' step's Next button makes");
  try {
    await updateDoc(ref, {
      personalInfo: {
        firstName: "Test",
        lastName: "Driver",
        phoneNumber: "555-0100",
        dateOfBirth: "1990-01-01",
        address: "123 Main St",
        city: "Springfield",
      },
      updatedAt: serverTimestamp(),
    });
    console.log("   RESULT: SUCCESS — update was allowed by firestore.rules");
  } catch (err) {
    console.log("   RESULT: FAILED");
    console.log("   error.code:", err.code);
    console.log("   error.message:", err.message);
  }

  console.log("4) Cleanup — deleting disposable doc + user");
  try {
    await deleteDoc(ref);
  } catch (e) {
    console.log("   (cleanup) could not delete doc as self, will need manual cleanup:", e.code);
  }
  await deleteUser(cred.user);
  console.log("   cleanup complete");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("SCRIPT ERROR:", e);
    process.exit(1);
  });
