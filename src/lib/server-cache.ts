import admin from "firebase-admin";
import { cache } from "./neural-optim";

let db: any = null;
let initialized = false;

async function initFirestore() {
  if (initialized) return db;
  initialized = true;

  try {
    // Support FIREBASE_SERVICE_ACCOUNT_KEY (JSON string) or individual env vars
    let serviceAccount: any = null;

    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      };
    }

    if (!serviceAccount) {
      console.warn("Firebase Admin: no service account configured, using in-memory cache only");
      return null;
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }

    db = admin.firestore();
    console.log("Firebase Admin: connected, cache persistence enabled");
    return db;
  } catch (err) {
    console.warn("Firebase Admin: init failed, using in-memory cache only:", err);
    return null;
  }
}

// Hydrate in-memory cache from Firestore on cold start
async function hydrateCache() {
  const firestore = await initFirestore();
  if (!firestore) return;

  try {
    const now = Date.now();
    const snap = await firestore.collection("aiCache")
      .where("expires", ">", now)
      .orderBy("expires", "desc")
      .limit(200)
      .get();

    let count = 0;
    for (const doc of snap.docs) {
      const data = doc.data();
      const ttlSeconds = Math.max(1, Math.floor((data.expires - now) / 1000));
      cache.set(doc.id, data.value, ttlSeconds);
      count++;
    }
    if (count > 0) {
      console.log(`Firebase Admin: hydrated ${count} cache entries from Firestore`);
    }
  } catch (err) {
    console.warn("Firebase Admin: cache hydration failed:", err);
  }
}

// Persist a cache entry to Firestore (fire-and-forget)
export async function persistCacheEntry(key: string, value: any, expiresAt: number) {
  const firestore = await initFirestore();
  if (!firestore) return;

  try {
    await firestore.collection("aiCache").doc(key).set({
      value,
      expires: expiresAt,
      updatedAt: Date.now(),
    });
  } catch (err) {
    console.warn("Firebase Admin: cache persist failed:", err);
  }
}

// Start hydration (non-blocking)
hydrateCache();

export { initFirestore };
