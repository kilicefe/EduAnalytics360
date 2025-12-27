import { initializeApp, getApps, cert, AppOptions } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Firebase Admin configuration for server-side operations
let serviceAccount: any = undefined;

try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        // Fix private_key newlines - sometimes they get escaped during env var transfer
        if (serviceAccount.private_key) {
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }
        console.log("[Firebase Admin] Service account loaded successfully");
    }
} catch (error) {
    console.error("[Firebase Admin] Failed to parse service account:", error);
}

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;

if (!getApps().length) {
    const appOptions: AppOptions = {};

    if (serviceAccount && serviceAccount.private_key && serviceAccount.client_email) {
        // Use service account if available and valid
        appOptions.credential = cert(serviceAccount);
        console.log("[Firebase Admin] Using service account credentials");
    } else if (projectId) {
        // Fallback: use project ID for environments without service account
        appOptions.projectId = projectId;
        console.log("[Firebase Admin] Using project ID only (limited access)");
    } else {
        console.error("[Firebase Admin] No credentials available!");
    }

    try {
        initializeApp(appOptions);
        console.log("[Firebase Admin] App initialized successfully");
    } catch (initError) {
        console.error("[Firebase Admin] Failed to initialize:", initError);
    }
}

const adminDb = getFirestore();
const adminAuth = getAuth();

export { adminDb, adminAuth };
