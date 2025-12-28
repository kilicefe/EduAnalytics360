import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Firebase Admin configuration for Netlify Serverless Functions
// Uses explicit environment variables instead of ADC (Application Default Credentials)

if (!admin.apps.length) {
    const projectId = process.env.GOOGLE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;

    // Handle private key - try multiple methods
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (privateKey) {
        // Method 1: Replace escaped newlines with actual newlines
        privateKey = privateKey.replace(/\\n/g, '\n');

        // Method 2: If it's base64 encoded, decode it
        if (!privateKey.includes("-----BEGIN")) {
            try {
                privateKey = Buffer.from(privateKey, 'base64').toString('utf8');
            } catch (e) {
                // Not base64, continue with original
            }
        }
    }

    console.log("[Firebase Admin] === Initialization Debug ===");
    console.log("[Firebase Admin] Project ID:", projectId || "NOT SET");
    console.log("[Firebase Admin] Client Email:", clientEmail || "NOT SET");
    console.log("[Firebase Admin] Private Key Present:", !!privateKey);
    console.log("[Firebase Admin] Private Key Length:", privateKey?.length || 0);
    console.log("[Firebase Admin] Private Key Starts With:", privateKey?.substring(0, 30) || "N/A");
    console.log("[Firebase Admin] ================================");

    if (projectId && clientEmail && privateKey && privateKey.includes("-----BEGIN")) {
        try {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: projectId,
                    clientEmail: clientEmail,
                    privateKey: privateKey,
                }),
            });
            console.log("[Firebase Admin] ✅ Initialized with service account credentials");
        } catch (error: any) {
            console.error("[Firebase Admin] ❌ Failed to initialize with cert:", error.message);
            // Last resort fallback
            admin.initializeApp({ projectId });
            console.log("[Firebase Admin] ⚠️ Fallback: Initialized with project ID only");
        }
    } else if (projectId) {
        // Fallback for environments without full credentials
        admin.initializeApp({ projectId });
        console.log("[Firebase Admin] ⚠️ Initialized with project ID only (limited access)");
        console.log("[Firebase Admin] Missing: clientEmail=", !clientEmail, "privateKey valid=", privateKey?.includes("-----BEGIN"));
    } else {
        console.error("[Firebase Admin] ❌ No credentials available!");
        console.error("[Firebase Admin] GOOGLE_PROJECT_ID:", process.env.GOOGLE_PROJECT_ID);
        console.error("[Firebase Admin] NEXT_PUBLIC_FIREBASE_PROJECT_ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
        throw new Error("Firebase Admin credentials not configured");
    }
}

const adminDb = getFirestore();
const adminAuth = getAuth();

export { admin, adminDb, adminAuth };
