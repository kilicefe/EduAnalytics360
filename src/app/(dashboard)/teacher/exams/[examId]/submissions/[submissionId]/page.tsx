"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Exam, Submission } from "@/types/exam";
import { Loader2, CheckCircle, AlertTriangle, BrainCircuit } from "lucide-react";

export default function SubmissionDetailPage() {
    const params = useParams();
    const [submission, setSubmission] = useState<Submission | null>(null);
    const [exam, setExam] = useState<Exam | null>(null);
    const [analyzing, setAnalyzing] = useState(false);

    useEffect(() => {
        async function fetchData() {
            if (!params.submissionId || !params.examId) return;

            const subDoc = await getDoc(doc(db, "submissions", params.submissionId as string));
            if (subDoc.exists()) {
                setSubmission({ id: subDoc.id, ...subDoc.data() } as Submission);
            }

            const examDoc = await getDoc(doc(db, "exams", params.examId as string));
            if (examDoc.exists()) {
                setExam({ id: examDoc.id, ...examDoc.data() } as Exam);
            }
        }
        fetchData();
    }, [params]);

    const handleAnalyze = async () => {
        if (!submission) return;
        setAnalyzing(true);
        try {
            const res = await fetch("/api/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ submissionId: submission.id }),
            });
            const data = await res.json();
            if (data.success) {
                // Refresh submission
                const subDoc = await getDoc(doc(db, "submissions", submission.id));
                setSubmission({ id: subDoc.id, ...subDoc.data() } as Submission);
            } else {
                alert("Analiz hatası: " + data.error);
            }
        } catch (error) {
            console.error("Analysis failed", error);
            alert("Analiz başlatılamadı.");
        } finally {
            setAnalyzing(false);
        }
    };

    if (!submission || !exam) return <div className="p-8 text-center">Yükleniyor...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="mx-auto max-w-5xl space-y-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">Öğrenci Cevapları ve Analiz</h1>
                    {!submission.analysis && (
                        <button
                            onClick={handleAnalyze}
                            disabled={analyzing}
                            className="flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:opacity-50"
                        >
                            {analyzing ? <Loader2 className="animate-spin" /> : <BrainCircuit size={20} />}
                            Yapay Zeka ile Analiz Et
                        </button>
                    )}
                </div>

                {/* Overall Analysis Card */}
                {submission.analysis && (
                    <div className="rounded-lg bg-white p-6 shadow ring-1 ring-purple-100">
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-purple-900">
                            <BrainCircuit className="text-purple-600" />
                            Genel AI Analizi
                        </h2>
                        <div className="grid gap-6 md:grid-cols-3">
                            <div className="rounded-lg bg-purple-50 p-4 text-center">
                                <div className="text-sm text-purple-600">Genel Skor</div>
                                <div className="text-3xl font-bold text-purple-900">
                                    {submission.analysis.overallScore.toFixed(0)}/100
                                </div>
                            </div>
                            <div className="col-span-2 space-y-2">
                                <p className="text-gray-700">{submission.analysis.feedback}</p>
                                {submission.analysis.dimensions.misconceptions.length > 0 && (
                                    <div className="mt-2 rounded-md bg-red-50 p-3 text-sm text-red-800">
                                        <strong>Tespit Edilen Kavram Yanılgıları:</strong>
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
                                    <p className="text-sm font-medium text-gray-500">Öğrenci Cevabı:</p>
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
                                        {analysis.correction && (
                                            <p className="mt-2 text-sm text-green-700">
                                                <strong>Doğru Yaklaşım:</strong> {analysis.correction}
                                            </p>
                                        )}
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
