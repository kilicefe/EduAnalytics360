"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { collection, query, where, getDocs, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { StudentData } from "@/types/user";
import { useRouter } from "next/navigation";

// Session storage key
const STUDENT_SESSION_KEY = "eduanalytics_student_session";

interface StudentContextType {
    student: StudentData | null;
    loading: boolean;
    loginStudent: (data: Omit<StudentData, "id" | "createdAt">) => Promise<StudentData>;
    logoutStudent: () => void;
}

const StudentContext = createContext<StudentContextType>({
    student: null,
    loading: true,
    loginStudent: async () => { throw new Error("Not implemented"); },
    logoutStudent: () => { },
});

export function StudentProvider({ children }: { children: React.ReactNode }) {
    const [student, setStudent] = useState<StudentData | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Restore session on mount
    useEffect(() => {
        try {
            const stored = sessionStorage.getItem(STUDENT_SESSION_KEY);
            if (stored) {
                const parsed = JSON.parse(stored) as StudentData;
                setStudent(parsed);
            }
        } catch (error) {
            console.error("Error restoring student session:", error);
            sessionStorage.removeItem(STUDENT_SESSION_KEY);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Upsert Logic: Find existing student or create new one
     * Query by schoolNumber + schoolName combination
     */
    const loginStudent = useCallback(async (
        data: Omit<StudentData, "id" | "createdAt">
    ): Promise<StudentData> => {
        const { firstName, lastName, schoolNumber, schoolName } = data;

        // Query for existing student
        const studentsRef = collection(db, "students");
        const q = query(
            studentsRef,
            where("schoolNumber", "==", schoolNumber),
            where("schoolName", "==", schoolName)
        );

        const snapshot = await getDocs(q);

        let studentData: StudentData;

        if (!snapshot.empty) {
            // Student exists - use existing record
            const existingDoc = snapshot.docs[0];
            studentData = {
                id: existingDoc.id,
                ...existingDoc.data()
            } as StudentData;

            // Update name if different (optional - they might have typo'd before)
            // For now, we just use the existing data as-is
            console.log("Student found:", studentData.id);
        } else {
            // Student doesn't exist - create new
            const newStudentData = {
                firstName,
                lastName,
                schoolNumber,
                schoolName,
                createdAt: Date.now(),
            };

            const docRef = await addDoc(studentsRef, newStudentData);
            studentData = {
                id: docRef.id,
                ...newStudentData,
            };

            console.log("New student created:", studentData.id);
        }

        // Save to session storage
        sessionStorage.setItem(STUDENT_SESSION_KEY, JSON.stringify(studentData));
        setStudent(studentData);

        return studentData;
    }, []);

    const logoutStudent = useCallback(() => {
        sessionStorage.removeItem(STUDENT_SESSION_KEY);
        setStudent(null);
        router.push("/login");
    }, [router]);

    return (
        <StudentContext.Provider value={{ student, loading, loginStudent, logoutStudent }}>
            {children}
        </StudentContext.Provider>
    );
}

export const useStudent = () => useContext(StudentContext);
