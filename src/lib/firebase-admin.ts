import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Firebase Admin configuration for Netlify Serverless Functions
// Uses explicit environment variables instead of ADC (Application Default Credentials)

if (!admin.apps.length) {
    const projectId = process.env.GOOGLE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    console.log("[Firebase Admin] Initializing...");
    console.log("[Firebase Admin] Project ID:", projectId);
    console.log("[Firebase Admin] Client Email:", clientEmail ? "SET" : "NOT SET");
    console.log("[Firebase Admin] Private Key:", privateKey ? "SET (length: " + privateKey.length + ")" : "NOT SET");

    if (projectId && clientEmail && privateKey) {
        try {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
            });
            console.log("[Firebase Admin] ✅ Initialized with service account credentials");
        } catch (error) {
            console.error("[Firebase Admin] ❌ Failed to initialize with cert:", error);
            // Fallback to project ID only
            admin.initializeApp({ projectId });
            console.log("[Firebase Admin] ⚠️ Fallback: Initialized with project ID only");
        }
    } else if (projectId) {
        // Fallback for environments without full credentials
        admin.initializeApp({ projectId });
        console.log("[Firebase Admin] ⚠️ Initialized with project ID only (limited access)");
    } else {
        console.error("[Firebase Admin] ❌ No credentials available!");
        throw new Error("Firebase Admin credentials not configured");
    }
}

const adminDb = getFirestore();
const adminAuth = getAuth();

export { admin, adminDb, adminAuth };
