"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStudent } from "@/contexts/StudentContext";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc, addDoc, collection } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Exam, Question, Answer, Submission } from "@/types/exam";
import { Loader2, Clock, Upload, Mic, Image as ImageIcon, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function ExamPage() {
    const params = useParams();
    const router = useRouter();
    const { student, loading: studentLoading } = useStudent();
    const [exam, setExam] = useState<Exam | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [answers, setAnswers] = useState<Record<string, Answer>>({});
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [startedAt] = useState(Date.now());
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

    // Check if student is logged in
    useEffect(() => {
        if (!studentLoading && !student) {
            setShowLoginPrompt(true);
        } else {
            setShowLoginPrompt(false);
        }
    }, [student, studentLoading]);

    // Fetch Exam
    useEffect(() => {
        async function fetchExam() {
            if (!params.examId) return;
            try {
                const docRef = doc(db, "exams", params.examId as string);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const examData = { id: docSnap.id, ...docSnap.data() } as Exam;
                    setExam(examData);
                    if (examData.settings.duration) {
                        setTimeLeft(examData.settings.duration * 60);
                    }
                } else {
                    alert("Sınav bulunamadı.");
                    router.push("/login");
                }
            } catch (error) {
                console.error("Error fetching exam:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchExam();
    }, [params.examId, router]);

    // Timer
    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0 || showLoginPrompt) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev === null || prev <= 0) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft, showLoginPrompt]);

    // Auto-submit on timeout
    useEffect(() => {
        if (timeLeft === 0 && student) {
            handleSubmit();
        }
    }, [timeLeft, student]);

    const handleAnswerChange = (questionId: string, content: string, type: "text" | "handwriting" | "audio" = "text") => {
        setAnswers((prev) => ({
            ...prev,
            [questionId]: {
                questionId,
                type,
                content,
            },
        }));
    };

    const handleFileUpload = async (questionId: string, file: File) => {
        if (!student) return;
        try {
            const storageRef = ref(storage, `submissions/${params.examId}/${student.id}/${questionId}/${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            handleAnswerChange(questionId, url, "handwriting");
        } catch (error) {
            console.error("Upload failed", error);
            alert("Dosya yüklenemedi.");
        }
    };

    const handleSubmit = async () => {
        if (!student || !exam || submitting) return;

        setSubmitting(true);
        try {
            const submissionData: Omit<Submission, "id"> = {
                examId: exam.id,
                studentId: student.id, // Using StudentContext ID
                answers: Object.values(answers),
                startedAt,
                submittedAt: Date.now(),
            };

            await addDoc(collection(db, "submissions"), submissionData);
            router.push("/student?success=true");
        } catch (error) {
            console.error("Error submitting exam:", error);
            alert("Sınav gönderilirken bir hata oluştu.");
            setSubmitting(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    if (loading || studentLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    // Login prompt for students without session
    if (showLoginPrompt && exam) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
                <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl text-center">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
                        <AlertCircle className="h-8 w-8 text-yellow-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Giriş Yapmanız Gerekiyor</h2>
                    <p className="text-gray-600 mb-6">
                        <strong>"{exam.title}"</strong> sınavına katılmak için önce giriş yapmalısınız.
                    </p>
                    <Link
                        href={`/login?redirect=/exam/${params.examId}`}
                        className="inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all"
                    >
                        Giriş Yap
                    </Link>
                </div>
            </div>
        );
    }

    if (!exam) return null;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Sticky Header */}
            <header className="sticky top-0 z-10 bg-white shadow-sm">
                <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">{exam.title}</h1>
                        <p className="text-sm text-gray-500">
                            {student?.firstName} {student?.lastName}
                        </p>
                    </div>
                    {timeLeft !== null && (
                        <div className={cn(
                            "flex items-center gap-2 rounded-full px-4 py-2 font-mono font-bold",
                            timeLeft < 300 ? "bg-red-100 text-red-600" : "bg-blue-50 text-blue-600"
                        )}>
                            <Clock size={20} />
                            {formatTime(timeLeft)}
                        </div>
                    )}
                </div>
            </header>

            <main className="mx-auto max-w-4xl space-y-8 p-4 pt-8">
                {/* Description */}
                <div className="rounded-lg bg-white p-6 shadow-sm">
                    <p className="text-gray-700">{exam.description}</p>
                </div>

                {/* Questions */}
                {exam.questions.map((question, index) => (
                    <div key={question.id} className="rounded-lg bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-start justify-between">
                            <div className="flex gap-3">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                                    {index + 1}
                                </span>
                                <div>
                                    <p className="text-lg font-medium text-gray-900">{question.text}</p>
                                    {question.mediaUrl && (
                                        <div className="mt-4">
                                            {question.type === "image" && (
                                                <img src={question.mediaUrl} alt="Soru görseli" className="max-h-96 rounded-lg object-contain" />
                                            )}
                                            {question.type === "audio" && (
                                                <audio controls src={question.mediaUrl} className="w-full" />
                                            )}
                                            {question.type === "video" && (
                                                <video controls src={question.mediaUrl} className="max-h-96 w-full rounded-lg" />
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                                {question.points} Puan
                            </span>
                        </div>

                        <div className="ml-11 space-y-4">
                            {/* Answer Input Area */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Cevabınız</label>

                                {/* Text Input */}
                                {question.allowedAnswerTypes.includes("text") && (
                                    <textarea
                                        value={answers[question.id]?.type === "text" ? answers[question.id]?.content : ""}
                                        onChange={(e) => handleAnswerChange(question.id, e.target.value, "text")}
                                        rows={4}
                                        className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="Cevabınızı buraya yazın..."
                                    />
                                )}

                                {/* File Upload (Handwriting/Image) */}
                                {(question.allowedAnswerTypes.includes("handwriting") || question.allowedAnswerTypes.includes("audio")) && (
                                    <div className="mt-2">
                                        <p className="mb-2 text-xs text-gray-500">veya dosya yükleyin (Resim/Ses):</p>
                                        <div className="flex items-center gap-4">
                                            <label className="flex cursor-pointer items-center gap-2 rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
                                                <Upload size={16} />
                                                Dosya Seç
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*,audio/*,application/pdf"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) handleFileUpload(question.id, file);
                                                    }}
                                                />
                                            </label>
                                            {answers[question.id]?.type === "handwriting" && (
                                                <span className="flex items-center gap-1 text-sm text-green-600">
                                                    <CheckCircle size={16} />
                                                    Dosya Yüklendi
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex items-center gap-2 rounded-lg bg-green-600 px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-green-700 hover:shadow-xl disabled:opacity-50"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="animate-spin" />
                                Gönderiliyor...
                            </>
                        ) : (
                            <>
                                <CheckCircle />
                                Sınavı Tamamla
                            </>
                        )}
                    </button>
                </div>
            </main>
        </div>
    );
}
