"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { UserData, FREE_PLAN_LIMITS } from "@/types/user";
import { useRouter } from "next/navigation";

interface AuthContextType {
    user: User | null;
    userData: UserData | null;
    loading: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userData: null,
    loading: true,
    logout: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (firebaseUser) {
                try {
                    const userRef = doc(db, "users", firebaseUser.uid);
                    const userDoc = await getDoc(userRef);

                    if (userDoc.exists()) {
                        setUserData(userDoc.data() as UserData);
                    } else {
                        // Self-healing: Auto-create missing user profile
                        console.log("[AuthProvider] User document not found, creating default profile...");
                        const newProfile: UserData = {
                            uid: firebaseUser.uid,
                            email: firebaseUser.email || "",
                            displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Öğretmen",
                            role: "teacher",
                            plan: "free",
                            quota: {
                                maxExams: FREE_PLAN_LIMITS.maxExams,
                                maxStudents: FREE_PLAN_LIMITS.maxStudents,
                            },
                            usage: {
                                examCount: 0,
                                studentCount: 0,
                            },
                            createdAt: Date.now(),
                        };
                        await setDoc(userRef, newProfile);
                        setUserData(newProfile);
                        console.log("[AuthProvider] Default user profile created successfully");
                    }
                } catch (error) {
                    console.error("[AuthProvider] Error fetching/creating user data:", error);
                    setUserData(null);
                }
            } else {
                setUserData(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const logout = async () => {
        await firebaseSignOut(auth);
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ user, userData, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
