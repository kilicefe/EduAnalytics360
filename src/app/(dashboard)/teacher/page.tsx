"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Exam } from "@/types/exam";
import { LogOut, Link as LinkIcon, Copy, Check, Settings, AlertTriangle, BookOpen, Users } from "lucide-react";
import Link from "next/link";

export default function TeacherDashboard() {
    const { user, userData, logout } = useAuth();
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Calculate quota usage
    const examCount = exams.length;
    const maxExams = userData?.quota?.maxExams || 3;
    const maxStudents = userData?.quota?.maxStudents || 50;
    const studentCount = userData?.usage?.studentCount || 0;
    const isAtExamLimit = examCount >= maxExams;
    const isNearExamLimit = examCount >= maxExams - 1;

    useEffect(() => {
        async function fetchExams() {
            if (!user) return;
            try {
                const q = query(
                    collection(db, "exams"),
                    where("teacherId", "==", user.uid),
                    orderBy("createdAt", "desc")
                );
                const querySnapshot = await getDocs(q);
                const examsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));
                setExams(examsData);
            } catch (error) {
                console.error("Error fetching exams:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchExams();
    }, [user]);

    const copyLink = (examId: string) => {
        const link = `${window.location.origin}/exam/${examId}`;
        navigator.clipboard.writeText(link);
        setCopiedId(examId);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
            <nav className="bg-white shadow-sm">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold text-gray-900">Öğretmen Paneli</h1>
                            {userData?.plan === "free" && (
                                <span className="ml-3 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                                    Ücretsiz Plan
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-700">
                                Merhaba, {userData?.displayName || user?.displayName || "Öğretmen"}
                            </span>
                            <Link
                                href="/teacher/settings"
                                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                                title="Hesap Ayarları"
                            >
                                <Settings size={20} />
                            </Link>
                            <button
                                onClick={logout}
                                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                                title="Çıkış Yap"
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8">
                {/* Quota Display */}
                <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500 mb-4">Kullanım Durumu</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Exam Quota */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <BookOpen size={18} className="text-blue-600" />
                                    <span className="text-sm font-medium text-gray-700">Sınavlar</span>
                                </div>
                                <span className={`text-sm font-bold ${isAtExamLimit ? 'text-red-600' : 'text-gray-900'}`}>
                                    {examCount} / {maxExams}
                                </span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all ${isAtExamLimit ? 'bg-red-500' : isNearExamLimit ? 'bg-amber-500' : 'bg-blue-600'
                                        }`}
                                    style={{ width: `${Math.min((examCount / maxExams) * 100, 100)}%` }}
                                />
                            </div>
                            {isAtExamLimit && (
                                <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                                    <AlertTriangle size={12} />
                                    Sınav limitine ulaştınız
                                </p>
                            )}
                        </div>

                        {/* Student Quota */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Users size={18} className="text-green-600" />
                                    <span className="text-sm font-medium text-gray-700">Öğrenciler</span>
                                </div>
                                <span className="text-sm font-bold text-gray-900">
                                    {studentCount} / {maxStudents}
                                </span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-green-600 transition-all"
                                    style={{ width: `${Math.min((studentCount / maxStudents) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Exams Section */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Sınavlarım</h2>
                    {isAtExamLimit ? (
                        <button
                            disabled
                            className="rounded-lg bg-gray-300 px-4 py-2 text-sm font-medium text-gray-500 cursor-not-allowed"
                            title="Sınav limitine ulaştınız"
                        >
                            Limit Doldu
                        </button>
                    ) : (
                        <Link
                            href="/teacher/exams/create"
                            className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md"
                        >
                            + Yeni Sınav Oluştur
                        </Link>
                    )}
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {loading ? (
                        <div className="col-span-full flex justify-center py-12">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                        </div>
                    ) : exams.length === 0 ? (
                        <div className="col-span-full rounded-2xl bg-white p-12 text-center shadow-sm">
                            <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                            <p className="text-gray-500">Henüz bir sınav oluşturmadınız.</p>
                            {!isAtExamLimit && (
                                <Link
                                    href="/teacher/exams/create"
                                    className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    İlk sınavınızı oluşturun →
                                </Link>
                            )}
                        </div>
                    ) : (
                        exams.map((exam) => (
                            <div key={exam.id} className="flex flex-col justify-between rounded-2xl bg-white p-6 shadow-sm transition-all hover:shadow-md">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">{exam.title}</h3>
                                    <p className="mt-2 text-sm text-gray-500 line-clamp-2">{exam.description}</p>
                                    <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                                        <span>{new Date(exam.createdAt).toLocaleDateString("tr-TR")}</span>
                                        <span>•</span>
                                        <span>{exam.questions.length} Soru</span>
                                    </div>
                                </div>

                                <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
                                    <button
                                        onClick={() => copyLink(exam.id)}
                                        className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                                    >
                                        {copiedId === exam.id ? (
                                            <>
                                                <Check size={16} />
                                                Kopyalandı
                                            </>
                                        ) : (
                                            <>
                                                <LinkIcon size={16} />
                                                Link Kopyala
                                            </>
                                        )}
                                    </button>
                                    <Link href={`/teacher/exams/${exam.id}`} className="text-sm font-medium text-gray-600 hover:text-gray-900">
                                        Detaylar →
                                    </Link>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}
