import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

let app: ReturnType<typeof initializeApp>;

const firebaseConfigEnv = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfig.measurementId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || firebaseConfig.firestoreDatabaseId,
};

function assertFirebaseApiKey(value: string | undefined) {
  if (!value || typeof value === 'undefined' || value === 'null') {
    throw new Error(
      'Firebase client init failed: missing/invalid VITE_FIREBASE_API_KEY. Set a valid Firebase Web API key in .env.local, then restart the dev server.'
    );
  }
  const trimmed = value.trim();
  if (!trimmed.startsWith('AIza') || trimmed.length < 20) {
    throw new Error(
      'Firebase client init failed: invalid VITE_FIREBASE_API_KEY. Use a valid Firebase Web API key starting with "AIza...".'
    );
  }
  return trimmed;
}

assertFirebaseApiKey(firebaseConfigEnv.apiKey);
firebaseConfigEnv.apiKey = firebaseConfigEnv.apiKey.trim();

try {
  app = initializeApp(firebaseConfigEnv);
} catch (err) {
  console.error('[Aigent.ai][firebase] initializeApp failed:', err, '\nConfig:', firebaseConfigEnv);
  throw err;
}
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfigEnv.firestoreDatabaseId);

export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}
