"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { ArrowLeft, User, Lock, CreditCard, CheckCircle, AlertCircle, Crown } from "lucide-react";
import Link from "next/link";

export default function TeacherSettings() {
    const { user, userData } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Profile form
    const [displayName, setDisplayName] = useState(userData?.displayName || "");

    // Password form
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !displayName.trim()) return;

        setLoading(true);
        setMessage(null);

        try {
            await updateProfile(user, { displayName: displayName.trim() });
            await updateDoc(doc(db, "users", user.uid), {
                displayName: displayName.trim(),
            });
            setMessage({ type: "success", text: "Profil başarıyla güncellendi." });
        } catch (error: any) {
            console.error(error);
            setMessage({ type: "error", text: error.message || "Profil güncellenirken hata oluştu." });
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !user.email) return;

        if (newPassword !== confirmPassword) {
            setMessage({ type: "error", text: "Yeni şifreler eşleşmiyor." });
            return;
        }

        if (newPassword.length < 6) {
            setMessage({ type: "error", text: "Şifre en az 6 karakter olmalıdır." });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            // Re-authenticate user
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);

            // Update password
            await updatePassword(user, newPassword);

            setMessage({ type: "success", text: "Şifre başarıyla değiştirildi." });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            console.error(error);
            if (error.code === "auth/wrong-password") {
                setMessage({ type: "error", text: "Mevcut şifre hatalı." });
            } else {
                setMessage({ type: "error", text: error.message || "Şifre değiştirilirken hata oluştu." });
            }
        } finally {
            setLoading(false);
        }
    };

    const examCount = userData?.usage?.examCount || 0;
    const studentCount = userData?.usage?.studentCount || 0;
    const maxExams = userData?.quota?.maxExams || 3;
    const maxStudents = userData?.quota?.maxStudents || 50;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
            <nav className="bg-white shadow-sm">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center gap-4">
                        <Link
                            href="/teacher"
                            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <h1 className="text-xl font-bold text-gray-900">Hesap Ayarları</h1>
                    </div>
                </div>
            </nav>

            <main className="mx-auto max-w-3xl py-8 px-4 sm:px-6 lg:px-8 space-y-8">
                {/* Message */}
                {message && (
                    <div className={`rounded-lg p-4 flex items-center gap-3 ${message.type === "success"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}>
                        {message.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        {message.text}
                    </div>
                )}

                {/* Plan & Usage */}
                <div className="rounded-2xl bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <CreditCard className="text-blue-600" size={24} />
                        <h2 className="text-lg font-semibold text-gray-900">Plan ve Kullanım</h2>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 mb-6">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-gray-900">
                                    {userData?.plan === "premium" ? "Premium Plan" : "Ücretsiz Plan"}
                                </span>
                                {userData?.plan === "premium" && <Crown className="text-amber-500" size={20} />}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                                {userData?.plan === "premium"
                                    ? "Sınırsız sınav ve öğrenci"
                                    : `${maxExams} sınav, ${maxStudents} öğrenci limiti`}
                            </p>
                        </div>
                        {userData?.plan === "free" && (
                            <button
                                disabled
                                className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-sm font-medium text-white opacity-50 cursor-not-allowed"
                                title="Yakında"
                            >
                                <div className="flex items-center gap-2">
                                    <Crown size={16} />
                                    Yakında
                                </div>
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-gray-50">
                            <p className="text-sm text-gray-500">Kullanılan Sınav</p>
                            <p className="text-2xl font-bold text-gray-900">{examCount} <span className="text-sm font-normal text-gray-500">/ {maxExams}</span></p>
                        </div>
                        <div className="p-4 rounded-xl bg-gray-50">
                            <p className="text-sm text-gray-500">Kayıtlı Öğrenci</p>
                            <p className="text-2xl font-bold text-gray-900">{studentCount} <span className="text-sm font-normal text-gray-500">/ {maxStudents}</span></p>
                        </div>
                    </div>
                </div>

                {/* Profile Settings */}
                <div className="rounded-2xl bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <User className="text-blue-600" size={24} />
                        <h2 className="text-lg font-semibold text-gray-900">Profil Bilgileri</h2>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                            <input
                                type="email"
                                disabled
                                value={user?.email || ""}
                                className="block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-500 sm:text-sm"
                            />
                            <p className="mt-1 text-xs text-gray-500">E-posta adresi değiştirilemez</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
                            <input
                                type="text"
                                required
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            {loading ? "Kaydediliyor..." : "Profili Kaydet"}
                        </button>
                    </form>
                </div>

                {/* Password Settings */}
                <div className="rounded-2xl bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <Lock className="text-blue-600" size={24} />
                        <h2 className="text-lg font-semibold text-gray-900">Şifre Değiştir</h2>
                    </div>

                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mevcut Şifre</label>
                            <input
                                type="password"
                                required
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Yeni Şifre</label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                placeholder="En az 6 karakter"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Yeni Şifre (Tekrar)</label>
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-50 transition-colors"
                        >
                            {loading ? "Değiştiriliyor..." : "Şifreyi Değiştir"}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
