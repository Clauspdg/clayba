import type { Transaction, Wallet } from "@the-ride/types";
import {
  collection,
  limit as fsLimit,
  onSnapshot,
  orderBy,
  query,
  where,
  type Firestore,
  type Unsubscribe,
} from "firebase/firestore";

/**
 * Client-side wallet read access (Sprint 6) — read-only, matching
 * `firestore.rules` (`wallets`/`transactions` writes are backend-only via
 * `WalletsRepository`). No client-side wallet creation: a passenger with
 * no existing wallet document (nothing in this environment auto-provisions
 * one on sign-up) genuinely has none — surfaced as an empty state, not a
 * fabricated $0 wallet.
 */

export function subscribeMyWallet(
  db: Firestore,
  ownerId: string,
  onNext: (wallet: Wallet | null) => void,
  onError: (message: string) => void,
): Unsubscribe {
  const q = query(collection(db, "wallets"), where("ownerId", "==", ownerId), fsLimit(1));
  return onSnapshot(
    q,
    (snapshot) =>
      onNext(
        snapshot.empty
          ? null
          : ({ id: snapshot.docs[0]!.id, ...snapshot.docs[0]!.data() } as Wallet),
      ),
    (err) => onError(err.message),
  );
}

export function subscribeMyTransactions(
  db: Firestore,
  walletId: string,
  onNext: (transactions: Transaction[]) => void,
  onError: (message: string) => void,
): Unsubscribe {
  const q = query(
    collection(db, "transactions"),
    where("walletId", "==", walletId),
    orderBy("createdAt", "desc"),
  );
  return onSnapshot(
    q,
    (snapshot) => onNext(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Transaction)),
    (err) => onError(err.message),
  );
}
