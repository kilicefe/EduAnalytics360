"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useStudent } from "@/contexts/StudentContext";
import { FREE_PLAN_LIMITS } from "@/types/user";
import { cn } from "@/lib/utils";
import { Loader2, School, User, Lock, BookOpen, GraduationCap, UserCircle, Mail, UserPlus } from "lucide-react";

type LoginMode = "student" | "teacher";
type TeacherMode = "login" | "register";

export default function LoginPage() {
    const router = useRouter();
    const { loginStudent } = useStudent();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [mode, setMode] = useState<LoginMode>("student");
    const [teacherMode, setTeacherMode] = useState<TeacherMode>("login");

    // Teacher form states
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");

    // Student form states
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [schoolNumber, setSchoolNumber] = useState("");
    const [schoolName, setSchoolName] = useState("");

    const handleTeacherLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));

            if (userDoc.exists()) {
                const userData = userDoc.data();
                if (userData.role !== "teacher" && userData.role !== "admin") {
                    throw new Error("Bu hesap öğretmen yetkisine sahip değil.");
                }
            }

            router.push("/teacher");
        } catch (err: any) {
            console.error(err);
            if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
                setError("E-posta veya şifre hatalı.");
            } else if (err.code === "auth/invalid-credential") {
                setError("Geçersiz kimlik bilgileri.");
            } else {
                setError(err.message || "Giriş yapılırken bir hata oluştu.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleTeacherRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            if (!displayName.trim()) {
                throw new Error("Ad Soyad alanı zorunludur.");
            }
            if (password.length < 6) {
                throw new Error("Şifre en az 6 karakter olmalıdır.");
            }

            // Create Firebase Auth user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // Update display name
            await updateProfile(userCredential.user, { displayName: displayName.trim() });

            // Create user document in Firestore with free plan
            await setDoc(doc(db, "users", userCredential.user.uid), {
                uid: userCredential.user.uid,
                email: email,
                displayName: displayName.trim(),
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
            });

            router.push("/teacher");
        } catch (err: any) {
            console.error(err);
            if (err.code === "auth/email-already-in-use") {
                setError("Bu e-posta adresi zaten kullanılıyor.");
            } else if (err.code === "auth/weak-password") {
                setError("Şifre çok zayıf. En az 6 karakter kullanın.");
            } else if (err.code === "auth/invalid-email") {
                setError("Geçersiz e-posta adresi.");
            } else {
                setError(err.message || "Kayıt yapılırken bir hata oluştu.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleStudentLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            if (!firstName.trim() || !lastName.trim() || !schoolNumber.trim() || !schoolName.trim()) {
                throw new Error("Tüm alanları doldurunuz.");
            }

            await loginStudent({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                schoolNumber: schoolNumber.trim(),
                schoolName: schoolName.trim(),
            });

            router.push("/student");
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Giriş yapılırken bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
            <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-xl">
                <div className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600">
                        {mode === "student" ? (
                            <GraduationCap className="h-8 w-8 text-white" />
                        ) : (
                            <School className="h-8 w-8 text-white" />
                        )}
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                        {mode === "student"
                            ? "Öğrenci Girişi"
                            : teacherMode === "login"
                                ? "Öğretmen Girişi"
                                : "Öğretmen Kaydı"}
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        {mode === "student"
                            ? "Sınavlara katılmak için bilgilerinizi girin."
                            : teacherMode === "login"
                                ? "Hesabınıza giriş yapın."
                                : "Ücretsiz hesap oluşturun. (3 sınav, 50 öğrenci)"}
                    </p>
                </div>

                {/* Mode Toggle */}
                <div className="flex rounded-xl bg-gray-100 p-1">
                    <button
                        onClick={() => { setMode("student"); setError(""); }}
                        className={cn(
                            "flex-1 rounded-lg py-2.5 text-sm font-medium transition-all",
                            mode === "student"
                                ? "bg-white text-blue-600 shadow-sm"
                                : "text-gray-500 hover:text-gray-900"
                        )}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <GraduationCap size={18} />
                            Öğrenci
                        </div>
                    </button>
                    <button
                        onClick={() => { setMode("teacher"); setError(""); }}
                        className={cn(
                            "flex-1 rounded-lg py-2.5 text-sm font-medium transition-all",
                            mode === "teacher"
                                ? "bg-white text-blue-600 shadow-sm"
                                : "text-gray-500 hover:text-gray-900"
                        )}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <School size={18} />
                            Öğretmen
                        </div>
                    </button>
                </div>

                {error && (
                    <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-100">
                        {error}
                    </div>
                )}

                {mode === "teacher" ? (
                    <>
                        {/* Teacher Login/Register Toggle */}
                        <div className="flex justify-center gap-6 text-sm">
                            <button
                                type="button"
                                onClick={() => { setTeacherMode("login"); setError(""); }}
                                className={cn(
                                    "pb-1 border-b-2 transition-colors",
                                    teacherMode === "login"
                                        ? "border-blue-600 text-blue-600 font-medium"
                                        : "border-transparent text-gray-500 hover:text-gray-700"
                                )}
                            >
                                Giriş Yap
                            </button>
                            <button
                                type="button"
                                onClick={() => { setTeacherMode("register"); setError(""); }}
                                className={cn(
                                    "pb-1 border-b-2 transition-colors",
                                    teacherMode === "register"
                                        ? "border-blue-600 text-blue-600 font-medium"
                                        : "border-transparent text-gray-500 hover:text-gray-700"
                                )}
                            >
                                Kayıt Ol
                            </button>
                        </div>

                        {teacherMode === "login" ? (
                            // ========== TEACHER LOGIN FORM ==========
                            <form onSubmit={handleTeacherLogin} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">E-posta</label>
                                    <div className="relative mt-1">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                            <Mail size={18} />
                                        </div>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="block w-full rounded-lg border border-gray-300 pl-10 py-2.5 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                                            className="block w-full rounded-lg border border-gray-300 pl-10 py-2.5 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all"
                                >
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Giriş Yap
                                </button>
                            </form>
                        ) : (
                            // ========== TEACHER REGISTER FORM ==========
                            <form onSubmit={handleTeacherRegister} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Ad Soyad</label>
                                    <div className="relative mt-1">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                            <UserCircle size={18} />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            className="block w-full rounded-lg border border-gray-300 pl-10 py-2.5 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                            placeholder="Ahmet Öğretmen"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">E-posta</label>
                                    <div className="relative mt-1">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                            <Mail size={18} />
                                        </div>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="block w-full rounded-lg border border-gray-300 pl-10 py-2.5 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                            placeholder="ogretmen@okul.com"
                                            autoComplete="email"
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
                                            minLength={6}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="block w-full rounded-lg border border-gray-300 pl-10 py-2.5 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                            placeholder="En az 6 karakter"
                                            autoComplete="current-password"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-md hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition-all"
                                >
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Ücretsiz Kayıt Ol
                                </button>

                                <p className="text-center text-xs text-gray-500">
                                    Ücretsiz planda: 3 sınav, 50 öğrenci limiti
                                </p>
                            </form>
                        )}
                    </>
                ) : (
                    // ========== STUDENT LOGIN FORM ==========
                    <form onSubmit={handleStudentLogin} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Ad</label>
                                <div className="relative mt-1">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                        <UserCircle size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="block w-full rounded-lg border border-gray-300 pl-10 py-2.5 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                        placeholder="Ali"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Soyad</label>
                                <input
                                    type="text"
                                    required
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    placeholder="Yılmaz"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Okul Numarası</label>
                            <div className="relative mt-1">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                    <BookOpen size={18} />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={schoolNumber}
                                    onChange={(e) => setSchoolNumber(e.target.value)}
                                    className="block w-full rounded-lg border border-gray-300 pl-10 py-2.5 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    placeholder="1234"
                                />
                            </div>
                        </div>

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
                                    className="block w-full rounded-lg border border-gray-300 pl-10 py-2.5 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    placeholder="Cumhuriyet Lisesi"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-md hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition-all"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sınava Başla
                        </button>

                        <p className="text-center text-xs text-gray-500">
                            Bilgileriniz kaydedilerek sınava yönlendirileceksiniz.
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
}
