// -----------------------------------------------------------------------------
// The Ride — DEV Seed Script (Sprint 5, Part 5)
//
// Seeds the-ride-dev with: 1 admin, 1 dispatcher, 1 support, 2 drivers
// (with vehicles + activated applications), 2 passengers, vehicle
// categories, platform settings (pricing + dispatch configuration all live
// on `PlatformSettings` — see docs/versioning.md's sibling doc
// docs/deployment.md for why there's no separate "pricing" collection).
//
// Idempotent: exits immediately if the `users` collection is non-empty
// ("seed only if collections are empty"). Re-run safely on a fresh
// project; it will not duplicate or overwrite data on a seeded one.
//
// Every write goes through `@the-ride/firebase`'s real repositories
// (Part 3: "Maintain repositories", "Maintain all Zod validation") — each
// document is `schema.parse()`d before `create()`, exactly like
// `VehicleCategoriesRepository.createCategory()` does, since the Firestore
// converter only validates on *read*, not on write (see converter.ts).
//
// Usage (needs FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY
// — see .env.development.local, never committed):
//   pnpm --filter @the-ride/scripts seed:dev
// -----------------------------------------------------------------------------
import { initializeAdminApp, getAdminAuth, getAdminFirestore } from "@the-ride/firebase/admin";
import { assignUserRole } from "@the-ride/firebase/auth";
import { createRepositories } from "@the-ride/firebase/firestore";
import {
  DEFAULT_PLATFORM_SETTINGS,
  DEFAULT_VEHICLE_CATEGORIES,
  DriverAccountStatus,
  DriverApplicationStatus,
  DriverAvailabilityStatus,
  Role,
  UserStatus,
  VehicleStatus,
  driverApplicationSchema,
  driverSchema,
  passengerProfileSchema,
  platformSettingsSchema,
  userSchema,
  vehicleSchema,
} from "@the-ride/types";

const DEV_PASSWORD = "TheRide2026!";

interface SeedUser {
  email: string;
  role: Role;
  displayName: string;
}

const SEED_USERS: SeedUser[] = [
  { email: "admin@dev.theride.app", role: Role.ADMIN, displayName: "Dana Admin" },
  { email: "dispatcher@dev.theride.app", role: Role.DISPATCHER, displayName: "Deshawn Dispatcher" },
  { email: "support@dev.theride.app", role: Role.SUPPORT, displayName: "Sam Support" },
  { email: "driver1@dev.theride.app", role: Role.DRIVER, displayName: "Dana Driver" },
  { email: "driver2@dev.theride.app", role: Role.DRIVER, displayName: "Drew Driver" },
  { email: "passenger1@dev.theride.app", role: Role.PASSENGER, displayName: "Priya Passenger" },
  { email: "passenger2@dev.theride.app", role: Role.PASSENGER, displayName: "Paulo Passenger" },
];

async function ensureAuthUser(seed: SeedUser): Promise<string> {
  const auth = getAdminAuth();
  try {
    const existing = await auth.getUserByEmail(seed.email);
    return existing.uid;
  } catch {
    const created = await auth.createUser({ email: seed.email, password: DEV_PASSWORD, displayName: seed.displayName, emailVerified: true });
    await assignUserRole(created.uid, seed.role);
    return created.uid;
  }
}

async function main() {
  initializeAdminApp({
    projectId: process.env.FIREBASE_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
    privateKey: process.env.FIREBASE_PRIVATE_KEY!,
  });

  const db = getAdminFirestore();
  const repos = createRepositories(db);

  const existingUsers = await repos.users.list({ limit: 1 });
  if (existingUsers.length > 0) {
    console.log("Seed skipped — the `users` collection is already non-empty.");
    return;
  }

  console.log("Seeding the-ride-dev...\n");

  const now = new Date();
  const uidByEmail = new Map<string, string>();

  for (const seed of SEED_USERS) {
    const uid = await ensureAuthUser(seed);
    uidByEmail.set(seed.email, uid);
    const user = userSchema.parse({
      id: uid,
      email: seed.email,
      displayName: seed.displayName,
      role: seed.role,
      status: UserStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    });
    await repos.users.create(uid, user);
    console.log(`  user       ${seed.email} (${seed.role})`);
  }

  await repos.vehicleCategories.seedDefaults();
  console.log(`  categories ${DEFAULT_VEHICLE_CATEGORIES.length} vehicle categories`);

  const existingSettings = await repos.settings.getGlobal();
  if (!existingSettings) {
    const settings = platformSettingsSchema.parse({
      id: "global",
      ...DEFAULT_PLATFORM_SETTINGS,
      supportEmail: "support@dev.theride.app",
      maintenanceMode: false,
      featureFlags: {},
      updatedBy: uidByEmail.get("admin@dev.theride.app"),
      updatedAt: now,
    });
    await repos.settings.create("global", settings);
    console.log("  settings   platform settings (pricing + dispatch configuration)");
  }

  const [economyCategory, suvCategory] = DEFAULT_VEHICLE_CATEGORIES;

  const driverSeeds = [
    {
      email: "driver1@dev.theride.app",
      plateNumber: "RIDE-001",
      make: "Toyota",
      model: "Camry",
      categoryId: economyCategory!.id,
      location: { latitude: 40.7128, longitude: -74.006 },
      available: true,
    },
    {
      email: "driver2@dev.theride.app",
      plateNumber: "RIDE-002",
      make: "Honda",
      model: "CR-V",
      categoryId: (suvCategory ?? economyCategory)!.id,
      location: { latitude: 40.73, longitude: -73.99 },
      available: false,
    },
  ];

  for (const seed of driverSeeds) {
    const uid = uidByEmail.get(seed.email)!;

    const applicationId = repos.driverApplications.newId();
    const application = driverApplicationSchema.parse({
      id: applicationId,
      userId: uid,
      status: DriverApplicationStatus.ACTIVATED,
      submittedAt: now,
      reviewedBy: uidByEmail.get("admin@dev.theride.app"),
      createdAt: now,
      updatedAt: now,
    });
    await repos.driverApplications.create(applicationId, application);

    const vehicleId = repos.vehicles.newId();
    const vehicle = vehicleSchema.parse({
      id: vehicleId,
      driverId: uid,
      make: seed.make,
      model: seed.model,
      year: 2021,
      color: "Silver",
      plateNumber: seed.plateNumber,
      status: VehicleStatus.APPROVED,
      vehicleCategoryId: seed.categoryId,
      createdAt: now,
      updatedAt: now,
    });
    await repos.vehicles.create(vehicleId, vehicle);

    const driver = driverSchema.parse({
      id: uid,
      userId: uid,
      applicationId,
      status: DriverAccountStatus.ACTIVE,
      vehicleId,
      rating: 4.9,
      completedTrips: 42,
      score: 98,
      availabilityStatus: seed.available ? DriverAvailabilityStatus.AVAILABLE : DriverAvailabilityStatus.OFFLINE,
      lastKnownLocation: seed.location,
      lastLocationUpdatedAt: now,
      acceptanceRate: 0.95,
      cancellationRate: 0.02,
      createdAt: now,
      updatedAt: now,
    });
    await repos.drivers.create(uid, driver);
    console.log(`  driver     ${seed.email} -> ${seed.plateNumber} (${seed.available ? "available" : "offline"})`);
  }

  for (const email of ["passenger1@dev.theride.app", "passenger2@dev.theride.app"]) {
    const uid = uidByEmail.get(email)!;
    const passenger = passengerProfileSchema.parse({
      id: uid,
      userId: uid,
      createdAt: now,
      updatedAt: now,
    });
    await repos.passengers.create(uid, passenger);
    console.log(`  passenger  ${email}`);
  }

  console.log(`\nSeed complete. All seed accounts share the password: ${DEV_PASSWORD}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
