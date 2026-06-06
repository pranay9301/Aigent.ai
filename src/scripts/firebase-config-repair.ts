import fs from "fs";
import path from "path";

const CONFIG_PATH = path.resolve(process.cwd(), "firebase-applet-config.json");
const ENV_PATH = path.resolve(process.cwd(), ".env.local");
const BLUEPRINT_PATH = path.resolve(process.cwd(), "firebase-blueprint.json");

const REQUIRED_KEYS = ["projectId", "appId", "apiKey", "authDomain", "firestoreDatabaseId", "storageBucket", "messagingSenderId", "measurementId"];

function readJsonSafe(filePath: string): any | null {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[firebase-config] invalid JSON: ${filePath}`, err);
    return null;
  }
}

function loadEnv(path: string): Record<string, string> {
  const values: Record<string, string> = {};
  if (!fs.existsSync(path)) return values;
  const lines = fs.readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!key) continue;
    values[key] = value.replace(/^["']|["']$/g, "");
  }
  return values;
}

function isValidApiKey(value: string | undefined): boolean {
  if (!value) return false;
  return value.trim().startsWith("AIza") && value.trim().length >= 20;
}

function validateConfig(record: any): { ok: boolean; issues: string[] } {
  const issues: string[] = [];
  for (const key of REQUIRED_KEYS) {
    if (!record || typeof record[key] !== "string" || !record[key]) {
      issues.push(`Missing or empty key: ${key}`);
    }
  }

  const apiKey = typeof record?.apiKey === "string" ? record.apiKey : "";
  const apiKeyClean = apiKey.trim();
  if (apiKey !== apiKeyClean) issues.push("apiKey contains leading/trailing whitespace");
  if (!isValidApiKey(apiKeyClean)) issues.push("apiKey is invalid: must start with AIza and be at least 20 chars");

  const authDomain = typeof record?.authDomain === "string" ? record.authDomain : "";
  if (!authDomain.endsWith(".firebaseapp.com")) issues.push("authDomain does not look like a Firebase web auth domain");

  const pid = typeof record?.projectId === "string" ? record.projectId : "";
  if (!pid) issues.push("projectId is required");

  return { ok: issues.length === 0, issues };
}

function repairConfig(record: any): any {
  const repaired = { ...(record || {}) };

  if (!repaired.projectId) repaired.projectId = "microsaas-d9323";
  if (!repaired.appId) repaired.appId = "1:210149898782:web:195a733cd5a7cdbfa74c0f";
  if (!repaired.authDomain) repaired.authDomain = `${repaired.projectId}.firebaseapp.com`;
  if (!repaired.firestoreDatabaseId) repaired.firestoreDatabaseId = "(default)";
  if (!repaired.storageBucket) repaired.storageBucket = `${repaired.projectId}.firebasestorage.app`;
  if (!repaired.messagingSenderId) repaired.messagingSenderId = "210149898782";
  if (!repaired.measurementId || repaired.measurementId.startsWith("PASTE")) repaired.measurementId = "";

  return repaired;
}

function writeConfig(record: any): void {
  fs.writeFileSync(CONFIG_PATH, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  console.log(`[firebase-config] wrote: ${CONFIG_PATH}`);
}

function main() {
  const report = {
    file: CONFIG_PATH,
    read: { valid: false, repaired: false },
    checks: {
      json: false,
      requiredKeys: false,
      apiKey: false,
      authDomain: false,
      projectId: false,
    },
    needsReset: false,
    executed: {},
  };

  const existing = readJsonSafe(CONFIG_PATH);
  report.checks.json = existing !== null;

  if (existing === null) {
    console.log("[firebase-config] current config is invalid JSON -> will repair");
  }

  let working = existing && typeof existing === "object" ? { ...existing } : {};

  report.checks.requiredKeys = REQUIRED_KEYS.every((key) => typeof working[key] === "string" && working[key].trim() !== "");
  report.checks.projectId = typeof working.projectId === "string" && working.projectId.trim().length > 0;
  report.checks.authDomain = typeof working.authDomain === "string" && working.authDomain.endsWith(".firebaseapp.com");

  const validation = validateConfig(working);
  report.checks.apiKey = isValidApiKey(typeof working.apiKey === "string" ? working.apiKey : undefined);

  let source = "existing";
  if (!validation.ok) {
    const env = loadEnv(ENV_PATH);
    const envPatch: Record<string, string> = {
      apiKey: env.VITE_FIREBASE_API_KEY || env.FIREBASE_API_KEY || "",
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || env.FIREBASE_AUTH_DOMAIN || "",
      projectId: env.VITE_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID || "",
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || env.FIREBASE_STORAGE_BUCKET || "",
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || env.FIREBASE_MESSAGING_SENDER_ID || "",
      appId: env.VITE_FIREBASE_APP_ID || env.FIREBASE_APP_ID || "",
      measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || env.FIREBASE_MEASUREMENT_ID || "",
      firestoreDatabaseId: env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || env.FIREBASE_FIRESTORE_DATABASE_ID || "",
    };

    const patched = { ...working };
    for (const [key, value] of Object.entries(envPatch)) {
      if (value && (!patched[key] || patched[key] === "")) {
        patched[key] = value;
      }
    }

    const patchedValidation = validateConfig(patched);
    if (patchedValidation.ok) {
      working = patched;
      source = ".env.local";
      console.log("[firebase-config] restored required keys from .env.local");
    } else {
      console.error("[firebase-config] .env.local did not provide a valid config:", patchedValidation.issues);
    }
  }

  if (!validateConfig(working).ok) {
    const blueprint = readJsonSafe(BLUEPRINT_PATH);
    // Blueprint is schema/metadata, not values. Use only for static defaults.
    const defaults = {
      measurementId: "",
    };
    working = { ...repairConfig(working), ...defaults };
    source = `${source}+defaults`;
    console.log("[firebase-config] applied built-in defaults");
  }

  const finalValidation = validateConfig(working);
  if (!finalValidation.ok) {
    console.error("[firebase-config] still invalid after repair:", finalValidation.issues);
    process.exitCode = 1;
    return;
  }

  if (!report.checks.json || !report.checks.requiredKeys) {
    writeConfig(working);
    report.read.repaired = true;
  }

  report.read.valid = true;
  report.executed = { action: source, validation: finalValidation };
  console.log("[firebase-config] OK:", finalValidation);
  console.log(JSON.stringify(report, null, 2));
}

main();
