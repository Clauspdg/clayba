import { getDownloadURL, getStorage, ref, uploadBytes, type FirebaseStorage } from "firebase/storage";

import { getClientApp } from "./app";

let cachedStorage: FirebaseStorage | undefined;

export function getClientStorage(): FirebaseStorage {
  if (!cachedStorage) {
    cachedStorage = getStorage(getClientApp());
  }
  return cachedStorage;
}

/**
 * Uploads (Sprint 5, Part 4) — one storage path convention per upload kind.
 * Driver profile photo / documents and passenger avatar are keyed by the
 * *auth uid*, not the `drivers`/`passengers` Firestore document id: a
 * driver applicant uploads their license/photo *during* the application
 * flow, before a `Driver` record exists yet (only a `DriverApplication`
 * does) — uid is the one identifier guaranteed to exist at upload time.
 * `storage.rules` authorizes each path by that same uid segment. Vehicle
 * photos are the exception — a vehicle is a distinct entity with its own
 * id created alongside the vehicle record, not 1:1 with a single uid.
 *
 * Every function takes a `Blob` (works from both `fetch(uri).then(r =>
 * r.blob())` on Expo/React Native and a browser `<input type="file">`'s
 * `File`, which is itself a `Blob`) so this module has no
 * platform-specific image-picker dependency — callers own that choice.
 */

export type DriverDocumentType = "drivers_license" | "vehicle_insurance" | "vehicle_registration" | "background_check";

export async function uploadDriverProfilePhoto(uid: string, file: Blob): Promise<string> {
  const path = `drivers/${uid}/profile-photo.jpg`;
  return uploadAndGetUrl(path, file);
}

export async function uploadDriverDocument(uid: string, documentType: DriverDocumentType, file: Blob): Promise<string> {
  const path = `drivers/${uid}/documents/${documentType}.jpg`;
  return uploadAndGetUrl(path, file);
}

export async function uploadVehiclePhoto(vehicleId: string, index: number, file: Blob): Promise<string> {
  const path = `vehicles/${vehicleId}/photos/${index}.jpg`;
  return uploadAndGetUrl(path, file);
}

export async function uploadPassengerAvatar(uid: string, file: Blob): Promise<string> {
  const path = `passengers/${uid}/avatar.jpg`;
  return uploadAndGetUrl(path, file);
}

async function uploadAndGetUrl(path: string, file: Blob): Promise<string> {
  const storageRef = ref(getClientStorage(), path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

/** Fetches a local file URI (Expo `ImagePicker` result, or a browser object URL) into a `Blob` the upload functions above accept. */
export async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  return response.blob();
}
