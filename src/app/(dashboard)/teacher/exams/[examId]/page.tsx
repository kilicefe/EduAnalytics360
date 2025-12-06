"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Exam, Submission } from "@/types/exam";
import { Loader2, User, Clock, FileText, BarChart2 } from "lucide-react";
import Link from "next/link";

export default function ExamDetailsPage() {
    const params = useParams();
    const { user } = useAuth();
    const [exam, setExam] = useState<Exam | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            if (!user || !params.examId) return;
            try {
                // Fetch Exam
                const examDoc = await getDoc(doc(db, "exams", params.examId as string));
                if (examDoc.exists()) {
                    setExam({ id: examDoc.id, ...examDoc.data() } as Exam);
                }

                // Fetch Submissions
                const q = query(
                    collection(db, "submissions"),
                    where("examId", "==", params.examId),
                    orderBy("submittedAt", "desc")
                );
                const snapshot = await getDocs(q);
                const subs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission));
                setSubmissions(subs);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [user, params.examId]);

    if (loading) return <div className="p-8 text-center">Yükleniyor...</div>;
    if (!exam) return <div className="p-8 text-center">Sınav bulunamadı.</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="mx-auto max-w-7xl space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{exam.title}</h1>
                        <p className="mt-1 text-gray-500">{exam.description}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-gray-500">Toplam Gönderim</div>
                        <div className="text-2xl font-bold text-blue-600">{submissions.length}</div>
                    </div>
                </div>

                {/* Submissions List */}
                <div className="rounded-lg bg-white shadow overflow-hidden">
                    <div className="border-b border-gray-200 bg-gray-50 px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Öğrenci Gönderimleri
                    </div>
                    <ul className="divide-y divide-gray-200">
                        {submissions.length === 0 ? (
                            <li className="p-6 text-center text-gray-500">Henüz gönderim yapılmamış.</li>
                        ) : (
                            submissions.map((sub) => (
                                <li key={sub.id} className="hover:bg-gray-50">
                                    <Link href={`/teacher/exams/${exam.id}/submissions/${sub.id}`} className="block px-6 py-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                                    <User size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">Öğrenci ID: {sub.studentId.slice(0, 8)}...</p>
                                                    <p className="text-sm text-gray-500">
                                                        {new Date(sub.submittedAt).toLocaleString("tr-TR")}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                {sub.analysis ? (
                                                    <div className="flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                                                        <BarChart2 size={16} />
                                                        Skor: {sub.analysis.overallScore.toFixed(1)}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
                                                        <Clock size={16} />
                                                        Analiz Bekleniyor
                                                    </div>
                                                )}
                                                <span className="text-gray-400">&rarr;</span>
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
}
