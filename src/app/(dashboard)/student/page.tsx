"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, doc, getDoc } from "firebase/firestore";
import { Submission, Exam } from "@/types/exam";
import { LogOut, FileText, BarChart2, Clock } from "lucide-react";
import Link from "next/link";

export default function StudentDashboard() {
    const { userData, user, logout } = useAuth();
    const [submissions, setSubmissions] = useState<(Submission & { examTitle: string })[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchSubmissions() {
            if (!user) return;
            try {
                const q = query(
                    collection(db, "submissions"),
                    where("studentId", "==", user.uid),
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
        fetchSubmissions();
    }, [user]);

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold text-gray-900">Öğrenci Paneli</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-700">
                                {userData?.displayName}
                            </span>
                            <button
                                onClick={logout}
                                className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="mx-auto max-w-7xl py-10 px-4 sm:px-6 lg:px-8">
                <div className="rounded-lg bg-white p-6 shadow">
                    <h2 className="text-lg font-medium text-gray-900">Sınav Geçmişim</h2>

                    <div className="mt-6">
                        {loading ? (
                            <p className="text-gray-500">Yükleniyor...</p>
                        ) : submissions.length === 0 ? (
                            <p className="text-gray-500">Henüz bir sınava girmediniz.</p>
                        ) : (
                            <ul className="divide-y divide-gray-200">
                                {submissions.map((sub) => (
                                    <li key={sub.id} className="py-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-medium text-gray-900">{sub.examTitle}</h3>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(sub.submittedAt).toLocaleDateString("tr-TR")}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                {sub.analysis ? (
                                                    <div className="flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                                                        <BarChart2 size={16} />
                                                        Skor: {sub.analysis.overallScore.toFixed(0)}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
                                                        <Clock size={16} />
                                                        Analiz Bekleniyor
                                                    </div>
                                                )}

                                                <Link
                                                    href={`/student/submissions/${sub.id}`}
                                                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
                </div>
            </main>
        </div>
    );
}
