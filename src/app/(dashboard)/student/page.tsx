"use client";

import { useEffect, useState } from "react";
import { useStudent } from "@/contexts/StudentContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, doc, getDoc } from "firebase/firestore";
import { Submission, Exam } from "@/types/exam";
import { LogOut, FileText, BarChart2, Clock, History, BookOpen } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function StudentDashboard() {
    const { student, loading: studentLoading, logoutStudent } = useStudent();
    const router = useRouter();
    const [submissions, setSubmissions] = useState<(Submission & { examTitle: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"home" | "history">("home");

    // Redirect if not logged in
    useEffect(() => {
        if (!studentLoading && !student) {
            router.push("/login");
        }
    }, [student, studentLoading, router]);

    useEffect(() => {
        async function fetchSubmissions() {
            if (!student) return;
            try {
                const q = query(
                    collection(db, "submissions"),
                    where("studentId", "==", student.id),
                    orderBy("submittedAt", "desc")
                );
                const snapshot = await getDocs(q);

                const subs = await Promise.all(snapshot.docs.map(async (d) => {
                    const subData = { id: d.id, ...d.data() } as Submission;
                    // Fetch exam title
                    const examDoc = await getDoc(doc(db, "exams", subData.examId));
                    const examTitle = examDoc.exists() ? examDoc.data().title : "Bilinmeyen Sınav";
                    return { ...subData, examTitle };
                }));

                setSubmissions(subs);
            } catch (error) {
                console.error("Error fetching submissions:", error);
            } finally {
                setLoading(false);
            }
        }

        if (student) {
            fetchSubmissions();
        }
    }, [student]);

    if (studentLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            </div>
        );
    }

    if (!student) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
            <nav className="bg-white shadow-sm">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between">
                        <div className="flex items-center">
                            <BookOpen className="h-6 w-6 text-blue-600 mr-2" />
                            <h1 className="text-xl font-bold text-gray-900">Öğrenci Paneli</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <span className="text-sm font-medium text-gray-900">
                                    {student.firstName} {student.lastName}
                                </span>
                                <p className="text-xs text-gray-500">
                                    {student.schoolName} • No: {student.schoolNumber}
                                </p>
                            </div>
                            <button
                                onClick={logoutStudent}
                                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                                title="Çıkış Yap"
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Tabs */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6">
                <div className="flex gap-4 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab("home")}
                        className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === "home"
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <FileText size={18} />
                            Ana Sayfa
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab("history")}
                        className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === "history"
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <History size={18} />
                            Geçmişim
                        </div>
                    </button>
                </div>
            </div>

            <main className="mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8">
                {activeTab === "home" ? (
                    // Home Tab - Welcome message
                    <div className="rounded-2xl bg-white p-8 shadow-sm">
                        <div className="text-center py-12">
                            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600">
                                <BookOpen className="h-10 w-10 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Hoş Geldin, {student.firstName}!
                            </h2>
                            <p className="text-gray-600 mb-8">
                                Sınava katılmak için öğretmeninden aldığın sınav linkini kullan.
                            </p>
                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={() => setActiveTab("history")}
                                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <History size={18} />
                                    Geçmiş Sınavlarım
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    // History Tab - Submissions list
                    <div className="rounded-2xl bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">Sınav Geçmişim</h2>

                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                            </div>
                        ) : submissions.length === 0 ? (
                            <div className="text-center py-12">
                                <History className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                                <p className="text-gray-500">Henüz bir sınava girmediniz.</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {submissions.map((sub) => (
                                    <li key={sub.id} className="py-5">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-base font-medium text-gray-900">{sub.examTitle}</h3>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {new Date(sub.submittedAt).toLocaleDateString("tr-TR", {
                                                        day: "numeric",
                                                        month: "long",
                                                        year: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit"
                                                    })}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                {sub.analysis ? (
                                                    <div className="flex items-center gap-2 rounded-full bg-green-100 px-4 py-1.5 text-sm font-medium text-green-800">
                                                        <BarChart2 size={16} />
                                                        Skor: {sub.analysis.overallScore.toFixed(0)}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-1.5 text-sm font-medium text-yellow-800">
                                                        <Clock size={16} />
                                                        Analiz Bekleniyor
                                                    </div>
                                                )}

                                                <Link
                                                    href={`/student/submissions/${sub.id}`}
                                                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                                >
                                                    Sonuçları Gör
                                                </Link>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
