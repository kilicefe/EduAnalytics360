"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Exam, Question, QuestionType, AnswerType } from "@/types/exam";
import { Loader2, Plus, Trash2, Image as ImageIcon, Mic, Video, Type, Save } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CreateExamPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [questions, setQuestions] = useState<Question[]>([]);

    const addQuestion = () => {
        const newQuestion: Question = {
            id: crypto.randomUUID(),
            text: "",
            type: "text",
            points: 10,
            allowedAnswerTypes: ["text"],
        };
        setQuestions([...questions, newQuestion]);
    };

    const updateQuestion = (id: string, field: keyof Question, value: any) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
    };

    const removeQuestion = (id: string) => {
        setQuestions(questions.filter(q => q.id !== id));
    };

    const handleSaveExam = async () => {
        if (!user) return;
        if (!title) return alert("Lütfen sınav başlığı giriniz.");
        if (questions.length === 0) return alert("Lütfen en az bir soru ekleyiniz.");

        setLoading(true);
        try {
            const examData: Omit<Exam, "id"> = {
                teacherId: user.uid,
                title,
                description,
                questions,
                createdAt: Date.now(),
                isActive: true,
                settings: {
                    duration: 60 // Default 60 mins for now
                }
            };

            await addDoc(collection(db, "exams"), examData);
            router.push("/teacher");
        } catch (error) {
            console.error("Error saving exam:", error);
            alert("Sınav kaydedilirken bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="mx-auto max-w-4xl space-y-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-900">Yeni Sınav Oluştur</h1>
                    <button
                        onClick={handleSaveExam}
                        disabled={loading}
                        className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                        Kaydet
                    </button>
                </div>

                {/* Exam Details */}
                <div className="rounded-lg bg-white p-6 shadow-sm">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Sınav Başlığı</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                placeholder="Örn: 10. Sınıf Fizik 1. Dönem 1. Yazılı"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Açıklama</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                placeholder="Sınav hakkında kısa bir açıklama..."
                            />
                        </div>
                    </div>
                </div>

                {/* Questions List */}
                <div className="space-y-6">
                    {questions.map((question, index) => (
                        <div key={question.id} className="relative rounded-lg bg-white p-6 shadow-sm transition-all hover:shadow-md">
                            <div className="absolute right-4 top-4">
                                <button
                                    onClick={() => removeQuestion(question.id)}
                                    className="text-gray-400 hover:text-red-500"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>

                            <div className="mb-4 flex items-center gap-2">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                                    {index + 1}
                                </span>
                                <span className="font-medium text-gray-700">Soru</span>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Soru Metni</label>
                                    <textarea
                                        value={question.text}
                                        onChange={(e) => updateQuestion(question.id, "text", e.target.value)}
                                        rows={2}
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="Sorunuzu buraya yazın..."
                                    />
                                </div>

                                {/* Media Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Medya Ekle (Opsiyonel)</label>
                                    <div className="mt-2 flex items-center gap-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => updateQuestion(question.id, "type", "image")}
                                                className={cn("p-2 rounded hover:bg-gray-100", question.type === "image" && "bg-blue-100 text-blue-600")}
                                                title="Resim Ekle"
                                            >
                                                <ImageIcon size={20} />
                                            </button>
                                            <button
                                                onClick={() => updateQuestion(question.id, "type", "audio")}
                                                className={cn("p-2 rounded hover:bg-gray-100", question.type === "audio" && "bg-blue-100 text-blue-600")}
                                                title="Ses Ekle"
                                            >
                                                <Mic size={20} />
                                            </button>
                                            <button
                                                onClick={() => updateQuestion(question.id, "type", "video")}
                                                className={cn("p-2 rounded hover:bg-gray-100", question.type === "video" && "bg-blue-100 text-blue-600")}
                                                title="Video Ekle"
                                            >
                                                <Video size={20} />
                                            </button>
                                        </div>

                                        {question.type !== "text" && (
                                            <div className="flex-1">
                                                <input
                                                    type="file"
                                                    accept={question.type === "image" ? "image/*" : question.type === "audio" ? "audio/*" : "video/*"}
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;

                                                        // Upload logic
                                                        try {
                                                            const storageRef = ref(storage, `exams/${user?.uid}/${question.id}/${file.name}`);
                                                            await uploadBytes(storageRef, file);
                                                            const url = await getDownloadURL(storageRef);
                                                            updateQuestion(question.id, "mediaUrl", url);
                                                        } catch (error) {
                                                            console.error("Upload failed", error);
                                                            alert("Dosya yüklenemedi.");
                                                        }
                                                    }}
                                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                />
                                                {question.mediaUrl && (
                                                    <p className="mt-1 text-xs text-green-600">Dosya yüklendi!</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Puan Değeri</label>
                                        <input
                                            type="number"
                                            value={question.points}
                                            onChange={(e) => updateQuestion(question.id, "points", parseInt(e.target.value))}
                                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Cevap Türü (İzin Verilenler)</label>
                                        <div className="mt-2 flex gap-2">
                                            <label className="inline-flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={question.allowedAnswerTypes.includes("text")}
                                                    onChange={(e) => {
                                                        const types = e.target.checked
                                                            ? [...question.allowedAnswerTypes, "text"]
                                                            : question.allowedAnswerTypes.filter(t => t !== "text");
                                                        updateQuestion(question.id, "allowedAnswerTypes", types);
                                                    }}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="ml-2 text-sm text-gray-600">Metin</span>
                                            </label>

                                            <label className="inline-flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={question.allowedAnswerTypes.includes("handwriting")}
                                                    onChange={(e) => {
                                                        const types = e.target.checked
                                                            ? [...question.allowedAnswerTypes, "handwriting"]
                                                            : question.allowedAnswerTypes.filter(t => t !== "handwriting");
                                                        updateQuestion(question.id, "allowedAnswerTypes", types);
                                                    }}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="ml-2 text-sm text-gray-600">El Yazısı</span>
                                            </label>

                                            <label className="inline-flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={question.allowedAnswerTypes.includes("audio")}
                                                    onChange={(e) => {
                                                        const types = e.target.checked
                                                            ? [...question.allowedAnswerTypes, "audio"]
                                                            : question.allowedAnswerTypes.filter(t => t !== "audio");
                                                        updateQuestion(question.id, "allowedAnswerTypes", types);
                                                    }}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="ml-2 text-sm text-gray-600">Ses</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={addQuestion}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-8 text-gray-500 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600"
                    >
                        <Plus size={24} />
                        <span className="font-medium">Yeni Soru Ekle</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
