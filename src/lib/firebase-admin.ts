import { initializeApp, getApps, getApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Note: For production, you should use environment variables for the service account
// or use the default application credentials if running on GCP/Firebase Functions.
// For local development, you might need a service account key file.

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : undefined;

if (!getApps().length) {
    if (serviceAccount) {
        initializeApp({
            credential: cert(serviceAccount),
        });
    } else {
        initializeApp();
    }
}

const adminDb = getFirestore();
const adminAuth = getAuth();

export { adminDb, adminAuth };
