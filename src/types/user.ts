export type UserRole = 'admin' | 'teacher' | 'student';

export interface UserData {
    uid: string;
    email?: string;
    displayName: string;
    role: UserRole;
    school?: string;
    classGrade?: string; // 'sinif'
    studentNo?: string;
    createdAt: number;
}
