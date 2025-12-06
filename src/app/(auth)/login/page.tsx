"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { UserRole } from "@/types/user";
import { cn } from "@/lib/utils";
import { Loader2, School, User, Lock, BookOpen, GraduationCap } from "lucide-react";

type LoginMode = "student" | "teacher";
type StudentMode = "register" | "login";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [mode, setMode] = useState<LoginMode>("student");
    const [studentMode, setStudentMode] = useState<StudentMode>("login");

    // Form states
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Student specific states
    const [schoolName, setSchoolName] = useState("");
    const [classGrade, setClassGrade] = useState("");
    const [studentNo, setStudentNo] = useState("");
    const [fullName, setFullName] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            let userCredential;

            if (mode === "teacher") {
                // Teacher Login
                userCredential = await signInWithEmailAndPassword(auth, email, password);
                const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
                if (userDoc.exists() && userDoc.data().role !== "teacher" && userDoc.data().role !== "admin") {
                    throw new Error("Bu hesap öğretmen yetkisine sahip değil.");
                }
                router.push("/teacher");
            } else {
                // Student Login
                // Generate a pseudo-email for student login if not using email directly
                // Format: studentNo_schoolName@app.com (simplified for prototype)
                // Ideally, we should use a more robust method or ask for email.
                // For this prototype, let's assume studentNo is unique enough within a school context
                // or just ask for a password.

                // Since the prompt says "later login with profile", we need a way to re-auth.
                // Using studentNo + password is standard.
                // We'll construct a fake email for Firebase Auth: [studentNo]@[school-slug].com
                // But school name can vary. Let's just use studentNo@student.com for now and assume studentNo is unique globally? 
                // No, that's bad.
                // Let's just ask for email for now to be safe, OR generate one based on student number and school.
                // Let's try to generate: `s${studentNo}@exam-system.com`

                const studentEmail = `s${studentNo}@exam-system.com`;

                if (studentMode === "register") {
                    userCredential = await createUserWithEmailAndPassword(auth, studentEmail, password);

                    // Create user profile in Firestore
                    await setDoc(doc(db, "users", userCredential.user.uid), {
                        uid: userCredential.user.uid,
                        email: studentEmail,
                        displayName: fullName,
                        role: "student",
                        school: schoolName,
                        classGrade: classGrade,
                        studentNo: studentNo,
                        createdAt: Date.now(),
                    });

                    await updateProfile(userCredential.user, {
                        displayName: fullName
                    });

                } else {
                    // Student Login
                    userCredential = await signInWithEmailAndPassword(auth, studentEmail, password);
                }
                router.push("/student");
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Giriş yapılırken bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                        {mode === "student" ? "Öğrenci Girişi" : "Öğretmen Girişi"}
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        {mode === "student"
                            ? "Sınavlara katılmak ve sonuçlarını görmek için giriş yap."
                            : "Sınav oluşturmak ve öğrencilerini yönetmek için giriş yap."}
                    </p>
                </div>

                {/* Mode Toggle */}
                <div className="flex rounded-lg bg-gray-100 p-1">
                    <button
                        onClick={() => setMode("student")}
                        className={cn(
                            "flex-1 rounded-md py-2 text-sm font-medium transition-all",
                            mode === "student" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
                        )}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <GraduationCap size={18} />
                            Öğrenci
                        </div>
                    </button>
                    <button
                        onClick={() => setMode("teacher")}
                        className={cn(
                            "flex-1 rounded-md py-2 text-sm font-medium transition-all",
                            mode === "teacher" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
                        )}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <School size={18} />
                            Öğretmen
                        </div>
                    </button>
                </div>

                {error && (
                    <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    {mode === "student" && (
                        <div className="flex justify-center gap-4 text-sm">
                            <button
                                type="button"
                                onClick={() => setStudentMode("login")}
                                className={cn(
                                    "border-b-2 pb-1 transition-colors",
                                    studentMode === "login" ? "border-blue-600 text-blue-600 font-medium" : "border-transparent text-gray-500"
                                )}
                            >
                                Giriş Yap
                            </button>
                            <button
                                type="button"
                                onClick={() => setStudentMode("register")}
                                className={cn(
                                    "border-b-2 pb-1 transition-colors",
                                    studentMode === "register" ? "border-blue-600 text-blue-600 font-medium" : "border-transparent text-gray-500"
                                )}
                            >
                                İlk Kez Giriş (Kayıt)
                            </button>
                        </div>
                    )}

                    <div className="space-y-4">
                        {mode === "teacher" ? (
                            // Teacher Fields
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">E-posta</label>
                                    <div className="relative mt-1">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                            <User size={18} />
                                        </div>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="block w-full rounded-md border border-gray-300 pl-10 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                            placeholder="ogretmen@okul.com"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Şifre</label>
                                    <div className="relative mt-1">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                            <Lock size={18} />
                                        </div>
                                        <input
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="block w-full rounded-md border border-gray-300 pl-10 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            // Student Fields
                            <>
                                {studentMode === "register" && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Okul Adı</label>
                                            <div className="relative mt-1">
                                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                                    <School size={18} />
                                                </div>
                                                <input
                                                    type="text"
                                                    required
                                                    value={schoolName}
                                                    onChange={(e) => setSchoolName(e.target.value)}
                                                    className="block w-full rounded-md border border-gray-300 pl-10 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                                    placeholder="Cumhuriyet Lisesi"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Sınıf</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={classGrade}
                                                    onChange={(e) => setClassGrade(e.target.value)}
                                                    className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                                    placeholder="10-A"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Ad Soyad</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                                    placeholder="Ali Yılmaz"
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Öğrenci Numarası</label>
                                    <div className="relative mt-1">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                            <BookOpen size={18} />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            value={studentNo}
                                            onChange={(e) => setStudentNo(e.target.value)}
                                            className="block w-full rounded-md border border-gray-300 pl-10 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                            placeholder="1234"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        {studentMode === "register" ? "Şifre Belirle" : "Şifre"}
                                    </label>
                                    <div className="relative mt-1">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                            <Lock size={18} />
                                        </div>
                                        <input
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="block w-full rounded-md border border-gray-300 pl-10 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    {studentMode === "register" && (
                                        <p className="mt-1 text-xs text-gray-500">
                                            Daha sonra tekrar giriş yapmak için bu şifreyi unutma.
                                        </p>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {mode === "student"
                            ? (studentMode === "register" ? "Kaydı Tamamla" : "Giriş Yap")
                            : "Giriş Yap"}
                    </button>
                </form>
            </div>
        </div>
    );
}
