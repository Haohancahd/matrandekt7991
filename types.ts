
export interface QuestionTypeDistribution {
    percentage: number;
    score: number;
    questionCount: number;
}

export interface CognitiveLevels {
    nb: number;
    th: number;
    vd: number;
    vdc: number;
}

export interface ExamFormData {
    schoolLevel: string;
    subject: string;
    grade: string;
    textbook: string;
    knowledgeContent: string;
    duration: number;
    multipleChoice: QuestionTypeDistribution;
    trueFalse: QuestionTypeDistribution;
    shortAnswer: QuestionTypeDistribution;
    essay: QuestionTypeDistribution;
    cognitiveLevels: CognitiveLevels;
    additionalRequirements: string;
}

export interface ExamResult {
    matrix: string;
    specification: string;
    exam: string;
    answerKey: string;
    answerSupplement: string;
}
