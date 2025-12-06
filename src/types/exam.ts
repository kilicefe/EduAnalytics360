export type QuestionType = 'text' | 'image' | 'audio' | 'video';
export type AnswerType = 'text' | 'handwriting' | 'audio';

export interface Question {
    id: string;
    text: string;
    type: QuestionType;
    mediaUrl?: string; // For image/audio/video content provided by teacher
    points: number;
    correctAnswer?: string; // Optional, for AI reference
    allowedAnswerTypes: AnswerType[]; // What kind of answers are allowed for this question
}

export interface Exam {
    id: string;
    teacherId: string;
    title: string;
    description: string;
    questions: Question[];
    createdAt: number;
    isActive: boolean;
    settings: {
        duration?: number; // in minutes
        startTime?: number;
        endTime?: number;
    };
}

export interface Answer {
    questionId: string;
    type: AnswerType;
    content: string; // Text or URL
}

export interface Submission {
    id: string;
    examId: string;
    studentId: string;
    answers: Answer[];
    startedAt: number;
    submittedAt: number;
    analysis?: AnalysisResult; // For AI result later
}

export interface AnalysisResult {
    overallScore: number;
    feedback: string;
    questionAnalysis: Record<string, QuestionAnalysis>;
    dimensions: {
        structural: number;
        misconceptions: string[];
        knowledgeGaps: string[];
        criticalThinking: number;
    };
}

export interface QuestionAnalysis {
    score: number;
    feedback: string;
    misconceptions?: string[];
    correction?: string;
}
