export type UserRole = 'admin' | 'teacher' | 'student';
export type UserPlan = 'free' | 'premium';

// Free plan limits
export const FREE_PLAN_LIMITS = {
    maxExams: 3,
    maxStudents: 50,
};

export interface UserData {
    uid: string;
    email?: string;
    displayName: string;
    role: UserRole;
    plan: UserPlan;
    quota: {
        maxExams: number;
        maxStudents: number;
    };
    usage: {
        examCount: number;
        studentCount: number;
    };
    school?: string;
    classGrade?: string;
    studentNo?: string;
    createdAt: number;
}

// Student data for metadata-based soft login (no Firebase Auth)
export interface StudentData {
    id: string;
    firstName: string;      // Ad
    lastName: string;       // Soyad
    schoolNumber: string;   // Okul No
    schoolName: string;     // Okul Adı
    createdAt: number;
}
