import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";

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

async function main() {
  const email = `qa-e2e-${Date.now()}@example.com`;
  const user = (await createUserWithEmailAndPassword(auth, email, "Repro-Test-Password-123!")).user;
  const userId = user.uid;
  console.log("Created test user:", userId, email);

  const ref = doc(collection(db, "driverApplications"));
  await setDoc(ref, { userId, status: "draft", createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  console.log("createDraftApplication:", ref.id, "OK");

  const steps = [
    ["personal", { personalInfo: { firstName: "Test", lastName: "Driver", phoneNumber: "555-0100", dateOfBirth: "1990-01-01", address: "123 Main St", city: "Springfield" } }],
    ["license", { license: { licenseNumber: "D1234567", licenseState: "CA", licenseExpiresAt: "2030-01-01" } }],
    ["vehicle", { vehicleInfo: { make: "Toyota", model: "Camry", year: 2020, color: "Blue", plateNumber: "ABC123" } }],
    ["insurance", { insurance: { provider: "Acme Insurance", policyNumber: "P-9999", expiresAt: "2027-01-01" } }],
    ["profilePhotoUrl (Firestore field only, no real upload)", { profilePhotoUrl: "https://example.com/fake.jpg" }],
  ];
  for (const [name, patch] of steps) {
    await updateDoc(ref, { ...patch, updatedAt: serverTimestamp() });
    console.log(`Step (${name}): OK`);
  }

  // Simulate refresh: re-fetch via findOwnApplication-equivalent query before submit.
  const preSubmitQuery = query(collection(db, "driverApplications"), where("userId", "==", userId), where("status", "in", ["draft", "submitted"]));
  const preSubmitSnap = await getDocs(preSubmitQuery);
  console.log("\n[refresh simulation] findOwnApplication query count before submit:", preSubmitSnap.size, "(expect 1)");
  const reloaded = preSubmitSnap.docs[0].data();
  console.log("[refresh simulation] reloaded personalInfo present:", Boolean(reloaded.personalInfo), "| license present:", Boolean(reloaded.license));

  await updateDoc(ref, { status: "submitted", submittedAt: serverTimestamp(), updatedAt: serverTimestamp() });
  console.log("\nsubmitApplication: OK");

  const finalSnap = await getDoc(ref);
  const data = finalSnap.data();
  console.log("\nFinal status:", data.status);
  console.log("Final fields present:", {
    personalInfo: Boolean(data.personalInfo),
    license: Boolean(data.license),
    vehicleInfo: Boolean(data.vehicleInfo),
    insurance: Boolean(data.insurance),
    profilePhotoUrl: Boolean(data.profilePhotoUrl),
    createdAt: data.createdAt?.constructor?.name,
    updatedAt: data.updatedAt?.constructor?.name,
    submittedAt: data.submittedAt?.constructor?.name,
  });

  const dupCheckQuery = query(collection(db, "driverApplications"), where("userId", "==", userId));
  const dupCheckSnap = await getDocs(dupCheckQuery);
  console.log("\nTotal driverApplications docs for this user (duplicate check):", dupCheckSnap.size, "(expect 1)");

  console.log("\n=== TEST ARTIFACTS FOR MANUAL CLEANUP (owner client cannot delete driverApplications; allow delete: if false) ===");
  console.log("Auth user uid:", userId, "email:", email);
  console.log("driverApplications doc id:", ref.id);
}

main().then(() => process.exit(0)).catch((e) => { console.error("SCRIPT ERROR:", e); process.exit(1); });
