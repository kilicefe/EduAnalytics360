"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Exam, Submission } from "@/types/exam";
import { CheckCircle, AlertTriangle, BrainCircuit, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function StudentSubmissionPage() {
    const params = useParams();
    const [submission, setSubmission] = useState<Submission | null>(null);
    const [exam, setExam] = useState<Exam | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            if (!params.submissionId) return;

            try {
                const subDoc = await getDoc(doc(db, "submissions", params.submissionId as string));
                if (subDoc.exists()) {
                    const subData = { id: subDoc.id, ...subDoc.data() } as Submission;
                    setSubmission(subData);

                    const examDoc = await getDoc(doc(db, "exams", subData.examId));
                    if (examDoc.exists()) {
                        setExam({ id: examDoc.id, ...examDoc.data() } as Exam);
                    }
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [params]);

    if (loading) return <div className="p-8 text-center">Yükleniyor...</div>;
    if (!submission || !exam) return <div className="p-8 text-center">Kayıt bulunamadı.</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="mx-auto max-w-4xl space-y-8">
                <Link href="/student" className="flex items-center gap-2 text-gray-500 hover:text-gray-900">
                    <ArrowLeft size={20} />
                    Panele Dön
                </Link>

                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">{exam.title} - Sonuçlarım</h1>
                </div>

                {/* Overall Analysis Card */}
                {submission.analysis ? (
                    <div className="rounded-lg bg-white p-6 shadow ring-1 ring-purple-100">
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-purple-900">
                            <BrainCircuit className="text-purple-600" />
                            Yapay Zeka Analizi
                        </h2>
                        <div className="grid gap-6 md:grid-cols-3">
                            <div className="rounded-lg bg-purple-50 p-4 text-center">
                                <div className="text-sm text-purple-600">Puanınız</div>
                                <div className="text-3xl font-bold text-purple-900">
                                    {submission.analysis.overallScore.toFixed(0)}/100
                                </div>
                            </div>
                            <div className="col-span-2 space-y-2">
                                <p className="text-gray-700">{submission.analysis.feedback}</p>
                                {submission.analysis.dimensions.misconceptions.length > 0 && (
                                    <div className="mt-2 rounded-md bg-red-50 p-3 text-sm text-red-800">
                                        <strong>Gelişim Alanları:</strong>
                                        <ul className="ml-4 list-disc">
                                            {submission.analysis.dimensions.misconceptions.map((m: string, i: number) => (
                                                <li key={i}>{m}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-lg bg-yellow-50 p-6 text-yellow-800">
                        Sınavınız henüz analiz edilmedi. Lütfen daha sonra tekrar kontrol edin.
                    </div>
                )}

                {/* Questions & Answers */}
                <div className="space-y-6">
                    {exam.questions.map((question, index) => {
                        const answer = submission.answers.find(a => a.questionId === question.id);
                        const analysis = submission.analysis?.questionAnalysis[question.id];

                        return (
                            <div key={question.id} className="rounded-lg bg-white p-6 shadow">
                                <div className="mb-4 flex items-start justify-between">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        {index + 1}. {question.text}
                                    </h3>
                                    <span className="text-sm text-gray-500">{question.points} Puan</span>
                                </div>

                                <div className="mb-4 rounded-md bg-gray-50 p-4">
                                    <p className="text-sm font-medium text-gray-500">Cevabınız:</p>
                                    {answer ? (
                                        answer.type === "text" ? (
                                            <p className="mt-1 text-gray-900">{answer.content}</p>
                                        ) : (
                                            <a href={answer.content} target="_blank" className="mt-1 text-blue-600 underline">
                                                Dosyayı Görüntüle ({answer.type})
                                            </a>
                                        )
                                    ) : (
                                        <p className="mt-1 italic text-gray-400">Cevap verilmedi.</p>
                                    )}
                                </div>

                                {/* Question Analysis */}
                                {analysis && (
                                    <div className="mt-4 border-t pt-4">
                                        <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                                            <span>Puan: {analysis.score}/{question.points}</span>
                                            {analysis.score === question.points ? (
                                                <CheckCircle size={16} className="text-green-500" />
                                            ) : (
                                                <AlertTriangle size={16} className="text-yellow-500" />
                                            )}
                                        </div>
                                        <p className="mt-2 text-sm text-gray-600">{analysis.feedback}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
