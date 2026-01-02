
import React, { useState, useEffect } from 'react';
import { ExamFormData, ExamResult } from './types';
import ExamForm from './components/ExamForm';
import ResultsDisplay from './components/ResultsDisplay';
import { generateExamPart } from './services/geminiService';

const Header: React.FC<{ onGuideClick: () => void }> = ({ onGuideClick }) => (
    <header className="p-8 bg-white shadow-[0_20px_70px_-15px_rgba(0,0,0,0.1)] rounded-[2.5rem] mb-12 border border-slate-100/80 overflow-hidden relative flex flex-col md:flex-row items-center justify-between gap-8 animate-in fade-in slide-in-from-top-4 duration-700">
        {/* Trang trí góc */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-red-50/30 rounded-full -mr-24 -mt-24 blur-3xl"></div>
        
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10 w-full md:w-auto">
            {/* Logo Icon */}
            <div className="flex-shrink-0 bg-red-600 p-4 rounded-[1.25rem] shadow-[0_10px_30px_-5px_rgba(220,38,38,0.4)] ring-4 ring-red-50 transition-transform hover:scale-105 duration-300">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                </svg>
            </div>

            <div className="flex flex-col items-center md:items-start text-center md:text-left">
                <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-[2.75rem] font-black text-slate-800 tracking-tighter leading-none">
                        TẠO ĐỀ THEO CV7991 <span className="text-red-600">V4.0</span>
                    </h1>
                </div>
                <p className="text-slate-400 font-black text-[12px] tracking-[0.1em] uppercase mb-4">Công cụ tạo đề kiểm tra chuẩn 100% Bộ Giáo Dục</p>
                <div className="flex items-center gap-3">
                    <span className="px-4 py-1.5 bg-red-50/80 text-red-600 text-[10px] font-black rounded-full border border-red-100 uppercase tracking-widest shadow-sm">Gemini 3 Flash</span>
                    <span className="px-4 py-1.5 bg-emerald-50/80 text-emerald-600 text-[10px] font-black rounded-full border border-emerald-100 uppercase tracking-widest shadow-sm">Reasoning Active</span>
                </div>
            </div>
        </div>
        
        <div className="flex items-center gap-6 relative z-10">
             <button 
                onClick={onGuideClick}
                className="flex items-center gap-3 px-6 py-3.5 bg-slate-50/80 text-[13px] font-black text-slate-700 rounded-[1.25rem] border border-slate-100 hover:bg-white hover:border-red-100 hover:text-red-600 transition-all group shadow-sm active:scale-95"
            >
                <div className="bg-white p-2 rounded-xl shadow-sm text-slate-400 group-hover:text-red-600 group-hover:bg-red-50 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <span className="tracking-widest uppercase">Hướng dẫn</span>
            </button>
            
            <a href="https://www.facebook.com/kientrungkrn/" target="_blank" rel="noopener noreferrer" className="relative group">
                <div className="absolute inset-0 bg-red-500 rounded-full blur-2xl opacity-30 group-hover:opacity-60 transition-opacity"></div>
                <div className="relative p-1 bg-white rounded-full shadow-lg ring-1 ring-slate-100 group-hover:ring-red-100 transition-all">
                    <img
                        src="https://lh3.googleusercontent.com/d/16mMFk_XXE9PoxpmzTwgh-bfI3fkVuHgz"
                        alt="Logo"
                        className="h-16 w-16 rounded-full object-cover transition-transform transform group-hover:scale-105"
                    />
                </div>
            </a>
        </div>
    </header>
);

const UserGuideModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const guideSteps = [
        {
            title: "Bước 1: Nhập thông tin & Cấu trúc đề",
            description: "Điền đầy đủ các thông tin cơ bản (cấp, lớp, môn), dán nội dung kiến thức cần kiểm tra, và phân bổ cấu trúc điểm, số câu cho từng dạng bài."
        },
        {
            title: "Bước 2: Bắt đầu tạo đề",
            description: "Sau khi điền xong thông tin, nhấn nút '🚀 Bắt đầu tạo đề!'. AI Gemini 3 sẽ bắt đầu quy trình lập luận để tạo Ma trận chuẩn nhất."
        },
        {
            title: "Bước 3: Duyệt qua các bước",
            description: "Sử dụng nút 'Tiếp tục' để AI lần lượt tạo ra các phần tiếp theo. Gemini 3 sẽ đảm bảo sự nhất quán 100% giữa các văn bản."
        },
        {
            title: "Bước 4: Tinh chỉnh và Tương tác",
            description: "Tại mỗi bước, bạn có thể 'Chỉnh sửa' nội dung nếu cần. AI sẽ ghi nhớ các thay đổi của bạn cho bước tiếp theo."
        },
        {
            title: "Bước 5: Hoàn tất và Sử dụng",
            description: "Xuất file Word để có ngay bộ đề chuyên nghiệp theo chuẩn Công văn 7991."
        }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md" onClick={onClose}>
            <div 
                className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-12 m-4 border border-slate-200"
                onClick={e => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <div className="text-center mb-12">
                     <span className="text-indigo-600 font-black text-[11px] uppercase tracking-[0.4em] mb-2 block">Cẩm nang người dùng</span>
                     <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Quy trình thông minh</h2>
                     <p className="mt-4 text-xl text-slate-500 font-medium">Hợp tác cùng AI Gemini 3 Flash để tạo bộ đề chuẩn mực</p>
                </div>
                <div className="space-y-6">
                    {guideSteps.map((step, index) => (
                        <div key={index} className="flex items-start gap-8 p-8 rounded-3xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-xl hover:border-indigo-100 transition-all duration-500 group">
                           <div className="flex-shrink-0 flex items-center justify-center bg-white border-2 border-slate-200 rounded-2xl h-16 w-16 text-slate-800 font-black text-2xl shadow-sm group-hover:bg-indigo-600 group-hover:border-indigo-600 group-hover:text-white transition-all duration-500">
                                {index + 1}
                           </div>
                           <div className="flex-grow">
                                <h3 className="text-2xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{step.title}</h3>
                                <p className="text-slate-500 mt-2 text-lg leading-relaxed font-medium">{step.description}</p>
                           </div>
                        </div>
                    ))}
                </div>
                <div className="mt-12 p-8 rounded-3xl bg-indigo-50 border-2 border-indigo-100">
                    <p className="text-center font-bold text-indigo-700 text-lg leading-relaxed">
                        <span className="font-black">Lưu ý chuyên môn:</span> Giáo viên luôn kiểm tra nội dung do AI tạo trước khi đưa vào sử dụng trên lớp học.
                    </p>
                </div>
            </div>
        </div>
    );
};


const Footer: React.FC = () => (
    <footer className="text-center py-12 mt-20 border-t border-slate-200 text-slate-400">
        <div className="flex flex-col items-center gap-2">
            <p className="font-bold tracking-tight uppercase">Copyright@2025</p>
            <p className="text-sm font-medium">Sáng tạo bởi: <span className="text-slate-800 font-black">Đoàn Kiên Trung</span> • Zalo: 0909629947</p>
            <div className="flex items-center gap-4 mt-4">
                <a href="https://www.facebook.com/kientrungkrn/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-black text-sm uppercase tracking-widest">Facebook Profile</a>
                <span className="text-slate-300">|</span>
                <span className="text-slate-400 font-bold text-xs">Phát triển cho cộng đồng Giáo viên Việt Nam</span>
            </div>
        </div>
    </footer>
);

const ErrorMessage: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
    <div className="p-8 bg-white border-l-8 border-red-500 rounded-3xl shadow-xl flex items-center justify-between gap-6 mb-12 animate-pulse">
        <div>
            <h4 className="font-black text-red-600 uppercase text-xs tracking-widest mb-1">Xảy ra sự cố</h4>
            <p className="text-slate-800 font-bold text-lg">{message}</p>
        </div>
        {onRetry && (
            <button onClick={onRetry} className="px-6 py-3 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-200">
                THỬ LẠI
            </button>
        )}
    </div>
);

type GenerationStep = 'matrix' | 'specification' | 'exam' | 'answerKey' | 'answerSupplement';
const WIZARD_STEPS: GenerationStep[] = ['matrix', 'specification', 'exam', 'answerKey', 'answerSupplement'];

const App: React.FC = () => {
    const [formData, setFormData] = useState<ExamFormData>({
        schoolLevel: 'Cấp 2',
        subject: 'Khoa học tự nhiên',
        grade: 'Lớp 7',
        textbook: 'Kết nối tri thức',
        knowledgeContent: `Bài 6: Giới thiệu về liên kết hóa học
Bài 7: Hóa trị và công thức hóa học
Bài 15: Năng lượng ánh sáng. Tia sáng, vùng tối
Bài 16: Sự phản xạ ánh sáng
Bài 22: Quang hợp ở thực vật
Bài 23: Một số yếu tố ảnh hưởng đến quang hợp`,
        duration: 60,
        multipleChoice: { percentage: 30, score: 3.0, questionCount: 6 },
        trueFalse: { percentage: 20, score: 2.0, questionCount: 2 },
        shortAnswer: { percentage: 20, score: 2.0, questionCount: 4 },
        essay: { percentage: 30, score: 3.0, questionCount: 1 },
        cognitiveLevels: { nb: 40, th: 30, vd: 20, vdc: 10 },
        additionalRequirements: '',
    });
    const [examResult, setExamResult] = useState<Partial<ExamResult>>({});
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState<'form' | GenerationStep>('form');
    const [loadingStep, setLoadingStep] = useState<GenerationStep | null>(null);

    const executeGeneration = async (step: GenerationStep, context: Partial<ExamResult>) => {
        setIsLoading(true);
        setLoadingStep(step);
        setError(null);
        try {
            const resultText = await generateExamPart(step, formData, context);
            setExamResult(prev => ({...prev, [step]: resultText}));
            return resultText;
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(errMsg);
            throw err;
        } finally {
            setIsLoading(false);
            setLoadingStep(null);
        }
    };
    
    const handleStartGeneration = async (data: ExamFormData) => {
        setFormData(data);
        setExamResult({});
        setCurrentStep('matrix');
        try {
            await executeGeneration('matrix', {});
        } catch (e) {}
    };
    
    const handleNextStep = async () => {
        const currentIndex = WIZARD_STEPS.indexOf(currentStep as GenerationStep);
        if (currentIndex < WIZARD_STEPS.length - 1) {
            const nextStep = WIZARD_STEPS[currentIndex + 1];
            try {
                if (!examResult[nextStep]) {
                    await executeGeneration(nextStep, examResult);
                }
                setCurrentStep(nextStep);
            } catch (e) {}
        }
    };
    
    const handlePreviousStep = () => {
        const currentIndex = WIZARD_STEPS.indexOf(currentStep as GenerationStep);
        if (currentIndex > 0) {
            setCurrentStep(WIZARD_STEPS[currentIndex - 1]);
        }
    };

    const handleRegenerateStep = async () => {
         const stepToRegen = currentStep as GenerationStep;
        const newResult: Partial<ExamResult> = { ...examResult };
        const currentIndex = WIZARD_STEPS.indexOf(stepToRegen);
        for (let i = currentIndex; i < WIZARD_STEPS.length; i++) {
            delete newResult[WIZARD_STEPS[i]];
        }
        setExamResult(newResult);

        const context: Partial<ExamResult> = {};
        for (let i = 0; i < currentIndex; i++) {
            const step = WIZARD_STEPS[i];
            context[step] = examResult[step];
        }

        try {
            await executeGeneration(stepToRegen, context);
        } catch(e) {}
    };
    
    const handleResultChange = (step: GenerationStep, content: string) => {
        setExamResult(prev => ({ ...prev, [step]: content }));
    };

    const handleStartOver = () => {
        setCurrentStep('form');
        setExamResult({});
        setError(null);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-indigo-100 selection:text-indigo-900">
            {/* Subtle background texture */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[-1]">
                <svg width="100%" height="100%"><pattern id="pattern" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M0 40L40 0M0 0l40 40" stroke="currentColor" fill="none"/></pattern><rect width="100%" height="100%" fill="url(#pattern)"/></svg>
            </div>

            <div className="container mx-auto px-4 py-8 sm:py-12 max-w-7xl">
                <Header onGuideClick={() => setIsGuideOpen(true)} />
                <main className="relative z-10">
                    {currentStep === 'form' ? (
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <ExamForm 
                                formData={formData} 
                                setFormData={setFormData}
                                onSubmit={handleStartGeneration}
                                isLoading={isLoading}
                            />
                            {error && (
                                <div className="mt-8">
                                    <ErrorMessage message={error} onRetry={() => handleStartGeneration(formData)} />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="animate-in fade-in zoom-in-95 duration-500">
                            <ResultsDisplay
                                currentStep={currentStep}
                                result={examResult}
                                isLoading={isLoading}
                                loadingStep={loadingStep}
                                error={error}
                                onNext={handleNextStep}
                                onBack={handlePreviousStep}
                                onRegenerate={handleRegenerateStep}
                                onStartOver={handleStartOver}
                                onResultChange={handleResultChange}
                            />
                        </div>
                    )}
                </main>
                <Footer />
            </div>
            <UserGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
        </div>
    );
};

export default App;
