// Focused probe: does uploadBytes against the profile-photo path hang forever,
// reject quickly, or reject after a long SDK-internal retry timeout, when
// Firebase Storage has not been provisioned for the project?
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
import { getStorage, ref as storageRef, uploadBytes } from "firebase/storage";

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
const storage = getStorage(app);

const TINY_JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
  "base64",
);

async function main() {
  const email = `qa-probe-${Date.now()}@example.com`;
  const user = (await createUserWithEmailAndPassword(auth, email, "Repro-Test-Password-123!")).user;
  console.log("uid:", user.uid);
  const start = Date.now();
  try {
    const photoRef = storageRef(storage, `drivers/${user.uid}/profile-photo.jpg`);
    await Promise.race([
      uploadBytes(photoRef, TINY_JPEG, { contentType: "image/jpeg" }),
      new Promise((_, rej) => setTimeout(() => rej(new Error("PROBE TIMEOUT after 25s")), 25000)),
    ]);
    console.log("UPLOAD SUCCEEDED in", Date.now() - start, "ms");
  } catch (err) {
    console.log("UPLOAD FAILED/TIMED OUT after", Date.now() - start, "ms —", err.code || err.name, "|", err.message);
  }
  await deleteUser(user);
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
