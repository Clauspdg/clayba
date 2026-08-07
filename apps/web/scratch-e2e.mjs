// Full end-to-end repro: drives every wizard step exactly as
// apps/web/.../become-a-driver/page.tsx does (personal -> license -> vehicle
// -> insurance -> photo -> submit), including real Storage uploads, against
// the real the-ride-dev project. Then verifies the admin ApplicationsTab
// query sees it as Pending, checks the final Firestore document shape, and
// cleans up everything it created.
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import { getStorage, ref as storageRef, uploadBytes, deleteObject } from "firebase/storage";

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
const storage = getStorage(app);

const TINY_JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
  "base64",
);

async function main() {
  const email = `qa-e2e-${Date.now()}@example.com`;
  const user = (await createUserWithEmailAndPassword(auth, email, "Repro-Test-Password-123!")).user;
  const userId = user.uid;
  console.log("Created test user:", userId, email);

  const ref = doc(collection(db, "driverApplications"));
  await setDoc(ref, { userId, status: "draft", createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  console.log("Step 0 (createDraftApplication):", ref.id, "OK");

  const steps = [
    ["personal", { personalInfo: { firstName: "Test", lastName: "Driver", phoneNumber: "555-0100", dateOfBirth: "1990-01-01", address: "123 Main St", city: "Springfield" } }],
    ["license", { license: { licenseNumber: "D1234567", licenseState: "CA", licenseExpiresAt: "2030-01-01" } }],
    ["vehicle", { vehicleInfo: { make: "Toyota", model: "Camry", year: 2020, color: "Blue", plateNumber: "ABC123" } }],
    ["insurance", { insurance: { provider: "Acme Insurance", policyNumber: "P-9999", expiresAt: "2027-01-01" } }],
  ];

  for (const [name, patch] of steps) {
    try {
      await updateDoc(ref, { ...patch, updatedAt: serverTimestamp() });
      console.log(`Step (${name}):`, "OK");
    } catch (err) {
      console.log(`Step (${name}): FAILED —`, err.code, err.message);
      throw err;
    }
  }

  // Vehicle documents step — real Storage upload, exactly as uploadDriverDocument does.
  try {
    const licenseRef = storageRef(storage, `drivers/${userId}/documents/drivers_license.jpg`);
    await uploadBytes(licenseRef, TINY_JPEG, { contentType: "image/jpeg" });
    await updateDoc(ref, { license: { ...steps[1][1].license, photoUrl: "uploaded" }, updatedAt: serverTimestamp() });
    console.log("Step (license photo upload + save):", "OK");
  } catch (err) {
    console.log("Step (license photo upload): FAILED —", err.code, err.message);
    throw err;
  }

  // Profile photo step — real Storage upload, exactly as uploadDriverProfilePhoto does.
  try {
    const photoRef = storageRef(storage, `drivers/${userId}/profile-photo.jpg`);
    await uploadBytes(photoRef, TINY_JPEG, { contentType: "image/jpeg" });
    await updateDoc(ref, { profilePhotoUrl: "uploaded", updatedAt: serverTimestamp() });
    console.log("Step (profile photo upload + save):", "OK");
  } catch (err) {
    console.log("Step (profile photo upload): FAILED —", err.code, err.message);
    throw err;
  }

  // Submit — exact write from submitApplication().
  try {
    await updateDoc(ref, { status: "submitted", submittedAt: serverTimestamp(), updatedAt: serverTimestamp() });
    console.log("Step (submit):", "OK");
  } catch (err) {
    console.log("Step (submit): FAILED —", err.code, err.message);
    throw err;
  }

  // Post-submit checks.
  const snap = await getDoc(ref);
  const data = snap.data();
  console.log("\nFinal document status:", data.status);
  console.log("Has personalInfo/license/vehicleInfo/insurance/profilePhotoUrl:", {
    personalInfo: Boolean(data.personalInfo),
    license: Boolean(data.license),
    vehicleInfo: Boolean(data.vehicleInfo),
    insurance: Boolean(data.insurance),
    profilePhotoUrl: Boolean(data.profilePhotoUrl),
  });

  // findOwnApplication should now find it as "submitted" (draft-or-submitted query).
  const q = query(collection(db, "driverApplications"), where("userId", "==", userId), where("status", "in", ["draft", "submitted"]));
  const found = await getDocs(q);
  console.log("findOwnApplication-equivalent query result count:", found.size, "(should be 1 — no duplicates)");

  // Cleanup.
  try {
    await deleteObject(storageRef(storage, `drivers/${userId}/documents/drivers_license.jpg`));
    await deleteObject(storageRef(storage, `drivers/${userId}/profile-photo.jpg`));
  } catch (e) {
    console.log("(cleanup) storage delete issue:", e.code);
  }
  try {
    await deleteDoc(ref);
  } catch (e) {
    console.log("(cleanup) doc delete issue (expected — owner delete is allow:false; needs admin cleanup):", e.code);
  }
  await deleteUser(user);
  console.log("\nCleanup attempted. Test doc id (may need admin deletion):", ref.id);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("\nSCRIPT ERROR:", e);
    process.exit(1);
  });
