// -----------------------------------------------------------------------------
// The Ride — DEV Admin Bootstrap (Driver Onboarding validation follow-up)
//
// Ensures one admin account exists in the-ride-dev with a working
// super_admin custom claim and a matching Firestore users/{uid} profile,
// WITHOUT needing a Firebase Admin SDK service-account key. seed-dev.ts
// (the general-purpose fixture seeder) needs FIREBASE_PROJECT_ID/
// CLIENT_EMAIL/PRIVATE_KEY and currently fails to even start under both
// Node's native TypeScript loader and tsx, for unrelated workspace-module-
// resolution reasons — and per this task's own guidance, a tracked project
// file requiring a private key isn't preferred when a safer path exists.
//
// This script only needs the Firebase CLI's own already-authenticated
// session (`firebase login`) — no stored credential of any kind — via
// `firebase auth:export`/`auth:import`, which the CLI's OAuth user session
// is allowed to call directly. It's a plain .mjs with zero workspace
// package imports specifically so it can never hit that resolution bug.
//
// Idempotency: if the target account already has the correct custom claim,
// this is a complete no-op (no password touched). The ONE unavoidable
// side effect is the FIRST time a claim is assigned to a pre-existing
// account with no claim yet: `auth:import` requires re-writing the whole
// user record, and Firebase does not expose a way to carry an existing
// password hash forward without knowing the project's private scrypt
// signer parameters (by design — those aren't recoverable via the CLI's
// user OAuth session). That first-time transition necessarily invalidates
// whatever password the account had; this script immediately sends a real
// password-reset email so the account stays usable. Every run after that
// first one is a pure no-op.
//
// Usage (from monorepo root):
//   node scripts/bootstrap-dev-admin.mjs [email] [--project the-ride-dev]
// Defaults to theride@admin.com / the-ride-dev.
// -----------------------------------------------------------------------------
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash, randomBytes } from "node:crypto";

const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const PROJECT_PATTERN = /^[a-z0-9-]+$/;

const email = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "theride@admin.com";
const projectArgIdx = process.argv.indexOf("--project");
const project = projectArgIdx !== -1 ? process.argv[projectArgIdx + 1] : "the-ride-dev";
const ROLE = "super_admin";

// `firebase` is invoked with shell:true (Windows needs a shell to resolve the
// npx .cmd shim) — that concatenates argv into a single command line instead
// of passing an argv array, so any argument reaching it must be validated
// against a strict allowlist pattern first to rule out shell metacharacters.
if (!EMAIL_PATTERN.test(email)) {
  console.error(`Invalid email: ${email}`);
  process.exit(1);
}
if (!PROJECT_PATTERN.test(project)) {
  console.error(`Invalid --project value: ${project}`);
  process.exit(1);
}

function firebase(args) {
  try {
    return execFileSync("npx", ["firebase", ...args, "--project", project], { encoding: "utf8", shell: true });
  } catch (err) {
    // Node/libuv on Windows sometimes crashes the npx wrapper process on exit
    // ("Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)") *after* the
    // underlying firebase command already completed successfully — the real
    // output is still on stdout, only the exit code is poisoned. Trust stdout
    // over the exit code rather than failing a genuinely successful run.
    const stdout = err.stdout ?? "";
    if (/imported successfully|exported .* account/i.test(stdout)) {
      return stdout;
    }
    throw err;
  }
}

function randomPassword() {
  return "Bootstrap" + randomBytes(9).toString("base64url") + "!1";
}

function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = createHash("sha256").update(Buffer.concat([salt, Buffer.from(password, "utf8")])).digest();
  return { passwordHash: hash.toString("base64"), salt: salt.toString("base64") };
}

async function main() {
  const workdir = mkdtempSync(join(tmpdir(), "the-ride-admin-bootstrap-"));
  try {
    const exportPath = join(workdir, "export.json");
    firebase(["auth:export", exportPath, "--format=json"]);
    const exported = JSON.parse(readFileSync(exportPath, "utf8"));
    const existing = exported.users.find((u) => u.email === email);

    if (existing) {
      const claims = existing.customAttributes ? JSON.parse(existing.customAttributes) : {};
      if (claims.role === ROLE) {
        console.log(`OK: ${email} (${existing.localId}) already has the ${ROLE} claim — no changes made.`);
        return;
      }
      console.log(`${email} exists (${existing.localId}) without the ${ROLE} claim. Assigning it now.`);
      console.log("NOTE: this will invalidate the account's current password (unavoidable — see this file's header comment).");
      const importPath = join(workdir, "import.json");
      writeFileSync(
        importPath,
        JSON.stringify({ users: [{ localId: existing.localId, email, emailVerified: existing.emailVerified ?? false, customAttributes: JSON.stringify({ role: ROLE }) }] }),
      );
      firebase(["auth:import", importPath]);
      firebase(["auth:export", exportPath, "--format=json"]); // just to confirm below, not read further here
      console.log(`Set { role: "${ROLE}" } on ${email}.`);
      console.log("A password-reset email should be sent separately (see Part 3 of the driver-onboarding validation) so the account stays usable.");
    } else {
      console.log(`${email} does not exist yet. Creating it with the ${ROLE} claim.`);
      const password = randomPassword();
      const { passwordHash, salt } = hashPassword(password);
      const importPath = join(workdir, "import.json");
      writeFileSync(
        importPath,
        JSON.stringify({ users: [{ localId: randomBytes(14).toString("hex"), email, emailVerified: true, passwordHash, salt, customAttributes: JSON.stringify({ role: ROLE }) }] }),
      );
      firebase(["auth:import", importPath, "--hash-algo", "SHA256", "--hash-input-order", "SALT_FIRST", "--rounds", "1"]);
      console.log(`Created ${email} with the ${ROLE} claim.`);
      console.log(`Password (shown once, not logged anywhere persistent): ${password}`);
    }
  } finally {
    rmSync(workdir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
