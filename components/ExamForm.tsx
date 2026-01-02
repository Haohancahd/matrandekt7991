
import React, { useState, useEffect, useMemo } from 'react';
import type { ExamFormData, QuestionTypeDistribution, CognitiveLevels } from '../types';
import { SCHOOL_LEVELS, GRADES_BY_LEVEL, SUBJECTS_BY_LEVEL, GENERAL_TEXTBOOKS, TEXTBOOKS_BY_SUBJECT } from '../constants';
import ConfigManagementModal from './ConfigManagementModal';

interface ExamFormProps {
    formData: ExamFormData;
    setFormData: React.Dispatch<React.SetStateAction<ExamFormData>>;
    onSubmit: (data: ExamFormData) => void;
    isLoading: boolean;
}

const Section: React.FC<{ 
    title: string; 
    description: string; 
    icon: React.ReactNode;
    accentColor: string;
    children: React.ReactNode;
    compact?: boolean;
}> = ({ title, description, icon, accentColor, children, compact }) => (
    <div className={`bg-white ${compact ? 'p-4' : 'p-6'} rounded-2xl shadow-lg border-l-8 ${accentColor} border-t border-r border-b border-gray-100 flex flex-col hover:shadow-xl transition-shadow duration-300`}>
        <div className={`flex items-start gap-3 ${compact ? 'mb-3' : 'mb-6'}`}>
            <div className={`p-2 rounded-xl bg-gray-50 text-indigo-600`}>
                {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: compact ? 'h-5 w-5' : 'h-6 w-6' }) : icon}
            </div>
            <div>
                <h2 className={`${compact ? 'text-lg' : 'text-xl'} font-bold text-gray-800 tracking-tight`}>{title}</h2>
                <p className="text-[11px] text-gray-500 mt-0.5">{description}</p>
            </div>
        </div>
        <div className={`${compact ? 'space-y-2' : 'space-y-4'} flex flex-col`}>
            {children}
        </div>
    </div>
);

const QuestionTypeInput: React.FC<{
    label: string;
    value: QuestionTypeDistribution;
    icon: React.ReactNode;
    onChange: (field: keyof QuestionTypeDistribution, val: number) => void;
}> = ({ label, value, icon, onChange }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center p-2.5 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-200 transition-colors group">
            <div className="flex items-center gap-2 md:col-span-1">
                <span className="text-slate-400 group-hover:text-indigo-500 transition-colors">
                    {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: 'w-4 h-4' }) : icon}
                </span>
                <label className="font-bold text-slate-700 text-sm">{label}</label>
            </div>
            <div className="relative">
                <input
                    type="number"
                    value={value.questionCount}
                    onChange={(e) => onChange('questionCount', parseInt(e.target.value, 10) || 0)}
                    className="w-full pl-2 pr-10 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs font-semibold transition-all"
                    min="0"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400 uppercase">Câu</span>
            </div>
            <div className="relative">
                <input
                    type="number"
                    value={value.percentage}
                    onChange={(e) => onChange('percentage', parseInt(e.target.value, 10) || 0)}
                    className="w-full pl-2 pr-8 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs font-semibold transition-all"
                    min="0"
                    max="100"
                    step="5"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">%</span>
            </div>
            <div className="relative">
                 <input
                    type="number"
                    value={value.score}
                    onChange={(e) => onChange('score', parseFloat(e.target.value) || 0)}
                    className="w-full pl-2 pr-10 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs font-semibold transition-all"
                    min="0"
                    max="10"
                    step="0.25"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400 uppercase">Điểm</span>
            </div>
        </div>
    );
};


const ExamForm: React.FC<ExamFormProps> = ({ formData, setFormData, onSubmit, isLoading }) => {
    const [grades, setGrades] = useState<string[]>(GRADES_BY_LEVEL[formData.schoolLevel]);
    const [subjects, setSubjects] = useState<string[]>(SUBJECTS_BY_LEVEL[formData.schoolLevel]);
    const [textbooks, setTextbooks] = useState<string[]>(GENERAL_TEXTBOOKS);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [configurations, setConfigurations] = useState<Record<string, ExamFormData>>(() => {
        try {
            const saved = localStorage.getItem('examConfigurations');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.error("Failed to parse configurations from localStorage", error);
            return {};
        }
    });

    useEffect(() => {
        setGrades(GRADES_BY_LEVEL[formData.schoolLevel]);
        setSubjects(SUBJECTS_BY_LEVEL[formData.schoolLevel]);
        if (!GRADES_BY_LEVEL[formData.schoolLevel].includes(formData.grade)) {
            handleChange('grade', GRADES_BY_LEVEL[formData.schoolLevel][0]);
        }
        if (!SUBJECTS_BY_LEVEL[formData.schoolLevel].includes(formData.subject)) {
            handleChange('subject', SUBJECTS_BY_LEVEL[formData.schoolLevel][0]);
        }
    }, [formData.schoolLevel]);

    useEffect(() => {
        const specificTextbooks = TEXTBOOKS_BY_SUBJECT[formData.subject];
        const newTextbooks = specificTextbooks || GENERAL_TEXTBOOKS;
        setTextbooks(newTextbooks);

        if (!newTextbooks.includes(formData.textbook) && newTextbooks.length > 0) {
            handleChange('textbook', newTextbooks[0]);
        }
    }, [formData.subject]);

    const handleChange = (field: keyof ExamFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleCognitiveChange = (level: keyof CognitiveLevels, value: number) => {
        setFormData(prev => ({
            ...prev,
            cognitiveLevels: {
                ...prev.cognitiveLevels,
                [level]: value
            }
        }));
    };

    const handleQuestionTypeChange = (
        type: 'multipleChoice' | 'trueFalse' | 'shortAnswer' | 'essay',
        field: keyof QuestionTypeDistribution,
        value: number
    ) => {
        setFormData(prev => ({
            ...prev,
            [type]: {
                ...prev[type],
                [field]: value
            }
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const isSpecialSubject = ['Ngoại ngữ 1 (Tiếng Anh)', 'Ngữ văn'].includes(formData.subject);

    const { totalPercentage, totalScore, totalCognitive } = useMemo(() => {
        const questionTypes = [formData.multipleChoice, formData.trueFalse, formData.shortAnswer, formData.essay];
        const totalP = isSpecialSubject ? 100 : questionTypes.reduce((sum, item) => sum + item.percentage, 0);
        const totalS = isSpecialSubject ? 10.0 : questionTypes.reduce((sum, item) => sum + item.score, 0);
        
        const cognitive = formData.cognitiveLevels;
        const totalC = cognitive.nb + cognitive.th + cognitive.vd + cognitive.vdc;
        
        return { 
            totalPercentage: totalP, 
            totalScore: parseFloat(totalS.toFixed(2)),
            totalCognitive: totalC
        };
    }, [formData, isSpecialSubject]);

    const totalPercentageError = totalPercentage !== 100;
    const totalScoreError = totalScore !== 10.0;
    const totalCognitiveError = totalCognitive !== 100;
    
    useEffect(() => {
        localStorage.setItem('examConfigurations', JSON.stringify(configurations));
    }, [configurations]);

    const handleSaveConfig = (name: string) => {
        if (configurations[name]) {
            if (!window.confirm(`Cấu hình '${name}' đã tồn tại. Bạn có muốn ghi đè không?`)) {
                return;
            }
        }
        setConfigurations(prev => ({ ...prev, [name]: formData }));
        setIsConfigModalOpen(false);
    };

    const handleLoadConfig = (name: string) => {
        setFormData(configurations[name]);
        setIsConfigModalOpen(false);
    };

    const handleDeleteConfig = (name: string) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa cấu hình '${name}' không?`)) {
            setConfigurations(prev => {
                const newConfigs = { ...prev };
                delete newConfigs[name];
                return newConfigs;
            });
        }
    };


    return (
        <form onSubmit={handleSubmit} className="space-y-6 pb-20">
            {/* Section 1 - Compacted and non-stretching */}
            <Section 
                title="1. Thiết lập chung" 
                description="Thông tin Môn học & Mức độ nhận thức."
                accentColor="border-l-indigo-600"
                compact={true}
                icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2-2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
            >
                {/* Row 1: General Info - Updated to Floating Label style */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6 mt-2">
                    <div className="relative group">
                        <label className="absolute -top-2.5 left-2 px-1 bg-white text-[9px] font-bold text-slate-400 z-10 uppercase tracking-wider">Cấp học</label>
                        <select value={formData.schoolLevel} onChange={e => handleChange('schoolLevel', e.target.value)} className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-indigo-600 text-sm outline-none">
                            {SCHOOL_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                        </select>
                    </div>
                    <div className="relative group">
                        <label className="absolute -top-2.5 left-2 px-1 bg-white text-[9px] font-bold text-slate-400 z-10 uppercase tracking-wider">Lớp</label>
                        <select value={formData.grade} onChange={e => handleChange('grade', e.target.value)} className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-indigo-600 text-sm outline-none">
                            {grades.map(grade => <option key={grade} value={grade}>{grade}</option>)}
                        </select>
                    </div>
                    <div className="relative group">
                        <label className="absolute -top-2.5 left-2 px-1 bg-white text-[9px] font-bold text-slate-400 z-10 uppercase tracking-wider">Môn học</label>
                        <select value={formData.subject} onChange={e => handleChange('subject', e.target.value)} className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-indigo-600 text-sm outline-none">
                            {subjects.map(subject => <option key={subject} value={subject}>{subject}</option>)}
                        </select>
                    </div>
                    <div className="relative group">
                        <label className="absolute -top-2.5 left-2 px-1 bg-white text-[9px] font-bold text-slate-400 z-10 uppercase tracking-wider">Bộ sách</label>
                        <select value={formData.textbook} onChange={e => handleChange('textbook', e.target.value)} className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-indigo-600 text-sm outline-none">
                            {textbooks.map(book => <option key={book} value={book}>{book}</option>)}
                        </select>
                    </div>
                    <div className="relative group">
                        <label className="absolute -top-2.5 left-2 px-1 bg-white text-[9px] font-bold text-slate-400 z-10 uppercase tracking-wider">Thời gian</label>
                        <div className="relative">
                            <input type="number" value={formData.duration} onChange={e => handleChange('duration', parseInt(e.target.value, 10))} className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-indigo-600 text-sm outline-none" />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-300 uppercase">Phút</span>
                        </div>
                    </div>
                </div>

                {/* Row 2: Cognitive Levels */}
                <div className="pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2 mb-3">
                        <label className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Mức độ nhận thức (%)</label>
                        <div className={`px-2 py-0.5 rounded text-[9px] font-bold ${totalCognitiveError ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            Tổng: {totalCognitive}%
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="relative group">
                            <label className="absolute -top-2.5 left-2 px-1 bg-white text-[9px] font-bold text-slate-400 z-10 uppercase tracking-wider">Nhận biết (NB)</label>
                            <input 
                                type="number" 
                                value={formData.cognitiveLevels.nb} 
                                onChange={e => handleCognitiveChange('nb', parseInt(e.target.value, 10) || 0)}
                                className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-indigo-600 text-sm"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300">%</span>
                        </div>
                        <div className="relative group">
                            <label className="absolute -top-2.5 left-2 px-1 bg-white text-[9px] font-bold text-slate-400 z-10 uppercase tracking-wider">Thông hiểu (TH)</label>
                            <input 
                                type="number" 
                                value={formData.cognitiveLevels.th} 
                                onChange={e => handleCognitiveChange('th', parseInt(e.target.value, 10) || 0)}
                                className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-indigo-600 text-sm"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300">%</span>
                        </div>
                        <div className="relative group">
                            <label className="absolute -top-2.5 left-2 px-1 bg-white text-[9px] font-bold text-slate-400 z-10 uppercase tracking-wider">Vận dụng (VD)</label>
                            <input 
                                type="number" 
                                value={formData.cognitiveLevels.vd} 
                                onChange={e => handleCognitiveChange('vd', parseInt(e.target.value, 10) || 0)}
                                className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-indigo-600 text-sm"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300">%</span>
                        </div>
                        <div className="relative group">
                            <label className="absolute -top-2.5 left-2 px-1 bg-white text-[9px] font-bold text-slate-400 z-10 uppercase tracking-wider">Vận dụng cao (VDC)</label>
                            <input 
                                type="number" 
                                value={formData.cognitiveLevels.vdc} 
                                onChange={e => handleCognitiveChange('vdc', parseInt(e.target.value, 10) || 0)}
                                className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-indigo-600 text-sm"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300">%</span>
                        </div>
                    </div>
                </div>
            </Section>

            {/* Sections 2 & 3 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Section 
                    title="2. Nội dung kiến thức" 
                    description="Liệt kê tên các bài học/chủ đề."
                    accentColor="border-l-blue-500"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                >
                     <textarea
                        value={formData.knowledgeContent}
                        onChange={e => handleChange('knowledgeContent', e.target.value)}
                        placeholder="VD: - Bài 6: Liên kết hóa học"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all flex-grow min-h-[140px] text-sm leading-relaxed"
                    />
                </Section>
                <Section 
                    title="3. Yêu cầu bổ sung" 
                    description="Chỉ dẫn riêng cho AI."
                    accentColor="border-l-purple-500"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                >
                     <textarea
                        value={formData.additionalRequirements}
                        onChange={e => handleChange('additionalRequirements', e.target.value)}
                        placeholder="VD: Cần 1 câu Tự luận liên hệ thực tế, hoặc yêu cầu đặc thù môn Tiếng Anh, môn Ngữ Văn..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all flex-grow min-h-[140px] text-sm leading-relaxed"
                    />
                </Section>
            </div>
            
            {/* Section 4 - Compacted and non-stretching */}
            {!isSpecialSubject && (
                <Section 
                    title="4. Cấu trúc câu hỏi & Điểm" 
                    description="Thiết lập tỉ lệ câu."
                    accentColor="border-l-emerald-500"
                    compact={true}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                >
                    <div className="grid grid-cols-1 gap-2">
                        <QuestionTypeInput 
                            label="Trắc nghiệm" 
                            value={formData.multipleChoice} 
                            icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
                            onChange={(f, v) => handleQuestionTypeChange('multipleChoice', f, v)} 
                        />
                        <QuestionTypeInput 
                            label="Đúng/Sai" 
                            value={formData.trueFalse} 
                            icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>}
                            onChange={(f, v) => handleQuestionTypeChange('trueFalse', f, v)} 
                        />
                        <QuestionTypeInput 
                            label="Trả lời ngắn" 
                            value={formData.shortAnswer} 
                            icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h10M4 18h7"/></svg>}
                            onChange={(f, v) => handleQuestionTypeChange('shortAnswer', f, v)} 
                        />
                        <QuestionTypeInput 
                            label="Tự luận" 
                            value={formData.essay} 
                            icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>}
                            onChange={(f, v) => handleQuestionTypeChange('essay', f, v)} 
                        />
                    </div>
                    
                    <div className="mt-2 flex flex-wrap items-center justify-end gap-3">
                        <div className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-2 shadow-sm transition-all ${totalPercentageError ? 'bg-red-50 text-red-600 border border-red-100 ring-4 ring-red-50' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                            {totalPercentageError ? '⚠️' : '✅'} {totalPercentage}%
                        </div>
                        <div className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-2 shadow-sm transition-all ${totalScoreError ? 'bg-red-50 text-red-600 border border-red-100 ring-4 ring-red-50' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                            {totalScoreError ? '⚠️' : '✅'} {totalScore} Điểm
                        </div>
                    </div>
                </Section>
            )}

            {/* Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 p-3 z-40 flex items-center justify-center gap-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                 <button
                    type="button"
                    onClick={() => setIsConfigModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all active:scale-95 text-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                    <span>Quản lý</span>
                </button>
                <button
                    type="submit"
                    disabled={isLoading || totalPercentageError || totalScoreError || totalCognitiveError}
                    className="relative group flex items-center gap-2 px-10 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-base font-bold rounded-xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:grayscale disabled:pointer-events-none"
                >
                    {isLoading ? (
                        <>
                           <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            <span>Đang chuẩn bị...</span>
                        </>
                    ) : (
                        <>
                            <span>🚀 Bắt đầu tạo đề!</span>
                        </>
                    )}
                </button>
            </div>
            
            <ConfigManagementModal
                isOpen={isConfigModalOpen}
                onClose={() => setIsConfigModalOpen(false)}
                configurations={configurations}
                onSave={handleSaveConfig}
                onLoad={handleLoadConfig}
                onDelete={handleDeleteConfig}
            />
        </form>
    );
};

export default ExamForm;
