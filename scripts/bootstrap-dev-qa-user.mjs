// -----------------------------------------------------------------------------
// The Ride — DEV QA User Bootstrap (FLOW-02A.1)
//
// Sibling to bootstrap-dev-admin.mjs, same credential-free technique (the
// Firebase CLI's own already-authenticated `firebase login` session via
// `auth:export`/`auth:import` — no service-account key, no Admin SDK). The
// one difference: a QA driver/passenger applicant needs NO custom claim at
// all — a real sign-up never gets one either (see
// packages/firebase/src/client/auth.ts's toSessionUser: a role-less token
// defaults to Passenger client-side; "becoming a driver" is a Firestore
// application process, not a claim). This only sets `emailVerified: true`
// so the real /become-a-driver wizard is reachable without a real inbox to
// click a verification link from — everything after that (application,
// admin approval/activation) goes through the actual product flows.
//
// Usage (from monorepo root):
//   node scripts/bootstrap-dev-qa-user.mjs <email> [--project the-ride-dev]
// Always creates fresh (errors out if the email already exists) — QA
// fixtures should be disposable and unambiguous, never silently reused.
// -----------------------------------------------------------------------------
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash, randomBytes } from "node:crypto";

const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const PROJECT_PATTERN = /^[a-z0-9-]+$/;

const email = process.argv[2];
const projectArgIdx = process.argv.indexOf("--project");
const project = projectArgIdx !== -1 ? process.argv[projectArgIdx + 1] : "the-ride-dev";

if (!email || !EMAIL_PATTERN.test(email)) {
  console.error(`Usage: node scripts/bootstrap-dev-qa-user.mjs <email> [--project the-ride-dev]`);
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
    // Same Windows/libuv-on-exit quirk documented in bootstrap-dev-admin.mjs
    // — the command can genuinely succeed while npx's wrapper process still
    // crashes on the way out, poisoning the exit code. Trust stdout.
    const stdout = err.stdout ?? "";
    if (/imported successfully|exported .* account/i.test(stdout)) {
      return stdout;
    }
    throw err;
  }
}

function randomPassword() {
  return "QaFixture" + randomBytes(9).toString("base64url") + "!1";
}

function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = createHash("sha256").update(Buffer.concat([salt, Buffer.from(password, "utf8")])).digest();
  return { passwordHash: hash.toString("base64"), salt: salt.toString("base64") };
}

async function main() {
  const workdir = mkdtempSync(join(tmpdir(), "the-ride-qa-user-bootstrap-"));
  try {
    const exportPath = join(workdir, "export.json");
    firebase(["auth:export", exportPath, "--format=json"]);
    const exported = JSON.parse(readFileSync(exportPath, "utf8"));
    if (exported.users.some((u) => u.email === email)) {
      console.error(`${email} already exists — QA fixtures are meant to be created fresh. Pick a new email or delete the old one first.`);
      process.exit(1);
    }

    const password = randomPassword();
    const { passwordHash, salt } = hashPassword(password);
    const importPath = join(workdir, "import.json");
    writeFileSync(
      importPath,
      JSON.stringify({ users: [{ localId: randomBytes(14).toString("hex"), email, emailVerified: true, passwordHash, salt }] }),
    );
    firebase(["auth:import", importPath, "--hash-algo", "SHA256", "--hash-input-order", "SALT_FIRST", "--rounds", "1"]);
    console.log(`Created ${email} (no custom claim — a real sign-up doesn't get one either).`);
    console.log(`Password (shown once, not logged anywhere persistent): ${password}`);
  } finally {
    rmSync(workdir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
