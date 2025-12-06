"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Exam } from "@/types/exam";
import { LogOut, Link as LinkIcon, Copy, Check } from "lucide-react";
import Link from "next/link";

export default function TeacherDashboard() {
    const { user, userData, logout } = useAuth();
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState<string | null>(null);

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
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold text-gray-900">Öğretmen Paneli</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-700">
                                Merhaba, {userData?.displayName}
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
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">Sınavlarım</h2>
                    <Link href="/teacher/exams/create" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                        Yeni Sınav Oluştur
                    </Link>
                </div>

                <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {loading ? (
                        <p className="text-gray-500">Yükleniyor...</p>
                    ) : exams.length === 0 ? (
                        <div className="col-span-full rounded-lg bg-white p-12 text-center shadow">
                            <p className="text-gray-500">Henüz oluşturulmuş bir sınav yok.</p>
                        </div>
                    ) : (
                        exams.map((exam) => (
                            <div key={exam.id} className="flex flex-col justify-between rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-md">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">{exam.title}</h3>
                                    <p className="mt-2 text-sm text-gray-500 line-clamp-2">{exam.description}</p>
                                    <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                                        <span>{new Date(exam.createdAt).toLocaleDateString("tr-TR")}</span>
                                        <span>•</span>
                                        <span>{exam.questions.length} Soru</span>
                                    </div>
                                </div>

                                <div className="mt-6 flex items-center justify-between border-t pt-4">
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
                                        Detaylar
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
