import {
  FAVORITE_PLACES_SUBCOLLECTION,
  PASSENGERS_COLLECTION,
  PAYMENT_PREFERENCES_SUBCOLLECTION,
  favoritePlaceSchema,
  passengerPaymentPreferenceSchema,
  passengerProfileSchema,
  type FavoritePlace,
  type PassengerPaymentPreference,
  type PassengerProfile,
} from "@the-ride/types";
import type { Firestore } from "firebase-admin/firestore";

import { FirestoreRepository } from "./base.repository";
import { createFirestoreConverter } from "./converter";

export class PassengersRepository extends FirestoreRepository<PassengerProfile> {
  constructor(private readonly db: Firestore) {
    super(db, PASSENGERS_COLLECTION, createFirestoreConverter(passengerProfileSchema));
  }

  async listFavoritePlaces(passengerId: string): Promise<FavoritePlace[]> {
    const snapshot = await this.db
      .collection(PASSENGERS_COLLECTION)
      .doc(passengerId)
      .collection(FAVORITE_PLACES_SUBCOLLECTION)
      .withConverter(createFirestoreConverter(favoritePlaceSchema))
      .get();
    return snapshot.docs.map((doc) => doc.data());
  }

  async addFavoritePlace(passengerId: string, place: Omit<FavoritePlace, "id" | "passengerId" | "createdAt">): Promise<FavoritePlace> {
    const collection = this.db
      .collection(PASSENGERS_COLLECTION)
      .doc(passengerId)
      .collection(FAVORITE_PLACES_SUBCOLLECTION)
      .withConverter(createFirestoreConverter(favoritePlaceSchema));

    const id = collection.doc().id;
    const favoritePlace = favoritePlaceSchema.parse({ ...place, id, passengerId, createdAt: new Date() });
    await collection.doc(id).set(favoritePlace);
    return favoritePlace;
  }

  async listPaymentPreferences(passengerId: string): Promise<PassengerPaymentPreference[]> {
    const snapshot = await this.db
      .collection(PASSENGERS_COLLECTION)
      .doc(passengerId)
      .collection(PAYMENT_PREFERENCES_SUBCOLLECTION)
      .withConverter(createFirestoreConverter(passengerPaymentPreferenceSchema))
      .get();
    return snapshot.docs.map((doc) => doc.data());
  }
}
