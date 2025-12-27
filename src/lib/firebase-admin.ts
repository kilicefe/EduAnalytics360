import { initializeApp, getApps, cert, AppOptions } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Firebase Admin configuration for server-side operations
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : undefined;

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;

if (!getApps().length) {
    const appOptions: AppOptions = {};

    if (serviceAccount) {
        // Use service account if available
        appOptions.credential = cert(serviceAccount);
    } else if (projectId) {
        // Fallback: use project ID for environments without service account
        // This enables read-only Firestore access with security rules
        appOptions.projectId = projectId;
    }

    initializeApp(appOptions);
}

const adminDb = getFirestore();
const adminAuth = getAuth();

export { adminDb, adminAuth };
