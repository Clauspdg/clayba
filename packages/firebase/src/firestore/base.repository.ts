import type {
  CollectionReference,
  Firestore,
  FirestoreDataConverter,
  OrderByDirection,
  Query,
  UpdateData,
  WhereFilterOp,
} from "firebase-admin/firestore";

export interface ListOptions {
  limit?: number;
}

/**
 * Generic Firestore CRUD repository. Every collection-specific repository
 * in this folder extends this rather than calling the Firestore SDK
 * directly, so query shapes and converter usage stay consistent — see
 * `docs/firestore-schema.md` and the "Firestore access is centralized"
 * principle in `docs/architecture-sprint1.md`.
 */
export class FirestoreRepository<T extends { id: string }> {
  protected readonly collection: CollectionReference<T>;

  constructor(db: Firestore, collectionName: string, converter: FirestoreDataConverter<T>) {
    this.collection = db.collection(collectionName).withConverter(converter);
  }

  async findById(id: string): Promise<T | null> {
    const snapshot = await this.collection.doc(id).get();
    return snapshot.exists ? (snapshot.data() ?? null) : null;
  }

  async create(id: string, data: T): Promise<T> {
    await this.collection.doc(id).set(data);
    return data;
  }

  async update(id: string, data: UpdateData<T>): Promise<void> {
    await this.collection.doc(id).update(data);
  }

  async delete(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }

  async list(options: ListOptions = {}): Promise<T[]> {
    let query: Query<T> = this.collection;
    if (options.limit) {
      query = query.limit(options.limit);
    }
    const snapshot = await query.get();
    return snapshot.docs.map((doc) => doc.data());
  }

  async findWhere(field: string, op: WhereFilterOp, value: unknown): Promise<T[]> {
    const snapshot = await this.collection.where(field, op, value).get();
    return snapshot.docs.map((doc) => doc.data());
  }

  /** Filter + sort in one query. Requires a matching composite index — see `firestore.indexes.json`. */
  async findWhereOrdered(
    field: string,
    op: WhereFilterOp,
    value: unknown,
    orderByField: string,
    direction: OrderByDirection = "desc",
  ): Promise<T[]> {
    const snapshot = await this.collection.where(field, op, value).orderBy(orderByField, direction).get();
    return snapshot.docs.map((doc) => doc.data());
  }

  /** Allocates a new document ID without writing anything (for pre-generating IDs). */
  newId(): string {
    return this.collection.doc().id;
  }
}
