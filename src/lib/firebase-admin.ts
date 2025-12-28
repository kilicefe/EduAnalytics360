import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Firebase Admin configuration for Netlify Serverless Functions
// Uses explicit environment variables instead of ADC (Application Default Credentials)

if (!admin.apps.length) {
    const projectId = process.env.GOOGLE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;

    // Get private key - prefer Base64 encoded version for reliability
    let privateKey: string | undefined;

    if (process.env.GOOGLE_PRIVATE_KEY_BASE64) {
        // Decode Base64 encoded private key (most reliable method)
        try {
            privateKey = Buffer.from(process.env.GOOGLE_PRIVATE_KEY_BASE64, 'base64').toString('utf8');
            console.log("[Firebase Admin] Private key decoded from Base64 successfully");
        } catch (e) {
            console.error("[Firebase Admin] Failed to decode Base64 private key:", e);
        }
    } else if (process.env.GOOGLE_PRIVATE_KEY) {
        // Fallback: try to use direct private key with newline fix
        privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
        console.log("[Firebase Admin] Using direct private key with newline replacement");
    }

    console.log("[Firebase Admin] === Initialization Debug ===");
    console.log("[Firebase Admin] Project ID:", projectId || "NOT SET");
    console.log("[Firebase Admin] Client Email:", clientEmail || "NOT SET");
    console.log("[Firebase Admin] Private Key Present:", !!privateKey);
    console.log("[Firebase Admin] Private Key Length:", privateKey?.length || 0);
    console.log("[Firebase Admin] Private Key Valid:", privateKey?.includes("-----BEGIN PRIVATE KEY-----") && privateKey?.includes("-----END PRIVATE KEY-----"));
    console.log("[Firebase Admin] ================================");

    if (projectId && clientEmail && privateKey && privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
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
        console.log("[Firebase Admin] Missing credentials - clientEmail:", !clientEmail, "privateKey valid:", privateKey?.includes("-----BEGIN"));
    } else {
        console.error("[Firebase Admin] ❌ No credentials available!");
        throw new Error("Firebase Admin credentials not configured");
    }
}

const adminDb = getFirestore();
const adminAuth = getAuth();

export { admin, adminDb, adminAuth };
