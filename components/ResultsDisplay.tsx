
import React, { useState, useEffect, useRef } from 'react';
import type { ExamResult } from '../types';

type GenerationStep = 'matrix' | 'specification' | 'exam' | 'answerKey' | 'answerSupplement';

interface ResultsDisplayProps {
    currentStep: GenerationStep;
    result: Partial<ExamResult>;
    isLoading: boolean;
    loadingStep: GenerationStep | null;
    error: string | null;
    onNext: () => void;
    onBack: () => void;
    onRegenerate: () => void;
    onStartOver: () => void;
    onResultChange: (step: GenerationStep, content: string) => void;
}

const stepsConfig: { id: GenerationStep; label: string; longLabel: string; icon: React.ReactNode }[] = [
    { id: 'matrix', label: 'Ma trận', longLabel: 'Bước 1: Ma trận đề', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg> },
    { id: 'specification', label: 'Đặc tả', longLabel: 'Bước 2: Bản đặc tả', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg> },
    { id: 'exam', label: 'Đề thi', longLabel: 'Bước 3: Đề kiểm tra', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg> },
    { id: 'answerKey', label: 'Đáp án', longLabel: 'Bước 4: Đáp án & Điểm', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
    { id: 'answerSupplement', label: 'Chi tiết', longLabel: 'Bước 5: Lời giải chi tiết', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg> },
];

const parseMarkdownTable = (content: string): { headers: string[]; rows: string[][] } | null => {
    if (!content) return null;
    const lines = content.split('\n').filter(line => line.trim() !== '');
    const tableLines = lines.filter(line => line.trim().startsWith('|') && line.trim().endsWith('|'));
    if (tableLines.length < 2) return null;
    const tableData = tableLines.map(line => line.split('|').slice(1, -1).map(cell => cell.trim()));
    const separatorIndex = tableData.findIndex(cells => cells.every(cell => /^-+$/.test(cell.replace(/:/g, ''))));
    let headers: string[] = [];
    let rows: string[][] = [];
    if (separatorIndex > 0) {
        headers = tableData[separatorIndex - 1];
        rows = tableData.slice(separatorIndex + 1);
    } else if (tableData.length > 0) {
        headers = tableData[0];
        rows = tableData.slice(1);
    }
    if (headers.length === 0) return null;
    rows = rows.filter(row => !row.every(cell => /^-+$/.test(cell.replace(/:/g, ''))) && row.some(cell => cell.trim() !== ''));
    return { headers, rows };
};

const cleanMarkdownForExport = (text: string, isTable: boolean = false): string => {
    if (!text) return '';
    let cleaned = text
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        .replace(/\*(.*?)\*/g, '<i>$1</i>')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/<br\s*\/?>/gi, '\n');
    if (!isTable) {
        cleaned = cleaned
            .replace(/^(PHẦN\s+[IVXLCDM]+|Phần\s+[IVXLCDM]+|I\.|II\.|III\.|IV\.|V\.)/gm, '<p style="font-size: 13pt; font-weight: bold; margin-top: 12px; margin-bottom: 4px;">$1</p>')
            .replace(/^(Câu\s+\d+[:\.])/gm, '<b>$1</b>');
    }
    return cleaned;
};

const convertContentToHtml = (content: string, step: GenerationStep): string => {
    const parsedTable = parseMarkdownTable(content);
    const baseStyle = 'font-family: "Times New Roman", Times, serif; font-size: 12pt; line-height: 1.4; color: black;';
    if (!parsedTable) {
        return `<div style="${baseStyle}">${cleanMarkdownForExport(content).split('\n').filter(l => l.trim()).map(l => `<p style="margin: 0 0 10px 0;">${l}</p>`).join('')}</div>`;
    }
    const { headers, rows } = parsedTable;
    let html = `<table border="1" style="border-collapse: collapse; width: 100%; ${baseStyle} margin-bottom: 20px;">`;
    if (headers.length > 0) {
        html += '<thead><tr style="background-color: #f3f4f6; font-weight: bold;">';
        headers.forEach(cell => { 
            const cleanHeader = cell.replace(/\*\*/g, '');
            html += `<th style="padding: 8px; text-align: center; vertical-align: middle; border: 1px solid black;">${cleanHeader}</th>`; 
        });
        html += '</tr></thead>';
    }
    if (rows.length > 0) {
        html += '<tbody>';
        rows.forEach(row => {
            html += '<tr>';
            row.forEach((cell, idx) => { 
                let textAlign = 'left';
                if (step === 'matrix') {
                    if (idx === 0 || idx >= 4) textAlign = 'center';
                } else if (step === 'specification') {
                    if (idx === 0 || idx >= 3) textAlign = 'center';
                } else if (step === 'answerKey') {
                    if (idx === 0 || idx === 2) textAlign = 'center';
                }
                html += `<td style="padding: 8px; text-align: ${textAlign}; vertical-align: top; border: 1px solid black;">${cleanMarkdownForExport(cell, true).replace(/\n/g, '<br>')}</td>`; 
            });
            html += '</tr>';
        });
        html += '</tbody>';
    }
    html += '</table>';
    return html;
};

const markdownToHtml = (text: string) => {
    if (!text) return '';
    let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
    html = html.replace(/^(PHẦN\s+[IVXLCDM]+|Phần\s+[IVXLCDM]+|I\.|II\.|III\.|IV\.|V\.)/gm, '<div class="text-lg font-black text-slate-900 mt-6 mb-2 pb-1 border-b border-slate-200">$1</div>');
    html = html.replace(/^(Câu\s+\d+[:\.])/gm, '<span class="font-bold text-indigo-700">$1</span>');
    html = html.replace(/`([^`]+)`/g, `<code class="bg-slate-100 text-indigo-600 px-1 rounded">$1</code>`);
    return html;
};

const ContentRenderer: React.FC<{ content: string; currentStep: GenerationStep }> = ({ content, currentStep }) => {
    const parsedTable = parseMarkdownTable(content);
    const containerStyle = { fontFamily: '"Times New Roman", Times, serif' };
    if (parsedTable) {
        const { headers, rows } = parsedTable;
        return (
            <div style={containerStyle} className="overflow-x-auto my-4 rounded-xl border border-slate-200 shadow-sm">
                <table className="min-w-full border-collapse bg-white">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            {headers.map((cell, idx) => (
                                <th key={idx} className="p-3 text-center font-bold text-slate-700 text-sm border-x border-slate-200 align-middle">
                                    {cell.replace(/\*\*/g, '')}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                                {row.map((cell, cIdx) => {
                                    let textAlignClass = 'text-left';
                                    if (currentStep === 'matrix') {
                                        if (cIdx === 0 || cIdx >= 4) textAlignClass = 'text-center font-medium';
                                    } else if (currentStep === 'specification') {
                                        if (cIdx === 0 || cIdx >= 3) textAlignClass = 'text-center font-medium';
                                    } else if (currentStep === 'answerKey') {
                                        if (cIdx === 0 || cIdx === 2) textAlignClass = 'text-center font-bold';
                                    }
                                    return (
                                        <td key={cIdx} className={`p-3 text-[1rem] text-slate-800 border-x border-slate-100 align-top ${textAlignClass}`}>
                                            <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: markdownToHtml(cell) }} />
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }
    return (
        <div style={containerStyle} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 min-h-[400px]">
            <div className="whitespace-pre-wrap text-[1.15rem] leading-relaxed text-slate-800 space-y-4" dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }} />
        </div>
    );
};

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ currentStep, result, isLoading, loadingStep, error, onNext, onBack, onRegenerate, onStartOver, onResultChange }) => {
    const [copySuccess, setCopySuccess] = useState<string>('');
    const [isEditing, setIsEditing] = useState(false);
    const contentContainerRef = useRef<HTMLDivElement>(null);
    const contentToDisplay = result[currentStep] || '';

    useEffect(() => {
        let timeoutId: number;
        const renderMath = () => {
            const container = contentContainerRef.current;
            // @ts-ignore
            if (container && window.katex && window.renderMathInElement) {
                try {
                    // @ts-ignore
                    window.renderMathInElement(container, {
                        delimiters: [
                            {left: "$$", right: "$$", display: true},
                            {left: "$", right: "$", display: false},
                        ],
                        throwOnError: false
                    });
                } catch (e) {
                    console.error("KaTeX Render Error:", e);
                }
            } else if (container && !isLoading && !isEditing) {
                timeoutId = window.setTimeout(renderMath, 200);
            }
        };
        if (contentToDisplay && !isLoading && !isEditing) {
            renderMath();
        }
        return () => {
            if (timeoutId) window.clearTimeout(timeoutId);
        };
    }, [contentToDisplay, isLoading, isEditing, currentStep]);

    const currentStepIndex = stepsConfig.findIndex(s => s.id === currentStep);

    const getLoadingLabel = (step: GenerationStep) => {
        switch (step) {
            case 'matrix': return 'Đang tạo Ma trận đề...';
            case 'specification': return 'Đang tạo Bản đặc tả...';
            case 'exam': return 'Đang tạo Đề kiểm tra...';
            case 'answerKey': return 'Đang tạo Đáp án & Điểm...';
            case 'answerSupplement': return 'Đang tạo Lời giải chi tiết...';
            default: return 'Đang xử lý...';
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(contentToDisplay).then(() => {
            setCopySuccess('Đã sao chép!');
            setTimeout(() => setCopySuccess(''), 2000);
        });
    };

    const handleExportDocx = () => {
        const tabLabel = stepsConfig.find(t => t.id === currentStep)?.label || 'Bao-cao';
        const filename = `${tabLabel.replace(/ /g, '-')}.doc`;
        const header = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset='utf-8'>
                <title>${tabLabel}</title>
                <style>
                    body { font-family: 'Times New Roman', serif; font-size: 12pt; }
                    table { border-collapse: collapse; width: 100%; margin: 15px 0; }
                    th, td { border: 1px solid black; padding: 6px; vertical-align: top; }
                    p { margin: 0 0 10px 0; }
                    b { font-weight: bold; }
                </style>
            </head>
            <body>`;
        const footer = "</body></html>";
        const sourceHTML = header + convertContentToHtml(contentToDisplay, currentStep) + footer;
        const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
        const fileDownload = document.createElement("a");
        document.body.appendChild(fileDownload);
        fileDownload.href = source;
        fileDownload.download = filename;
        fileDownload.click();
        document.body.removeChild(fileDownload);
    };

    return (
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden mb-12">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
                <nav className="flex items-center justify-between max-w-4xl mx-auto overflow-x-auto py-2 no-scrollbar">
                    {stepsConfig.map((step, index) => {
                        const isCompleted = index < currentStepIndex && !!result[step.id];
                        const isActive = index === currentStepIndex;
                        return (
                            <React.Fragment key={step.id}>
                                <div className={`flex flex-col items-center min-w-[60px] ${isActive ? 'scale-105' : 'opacity-50'}`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                        isActive ? 'bg-indigo-600 text-white shadow-lg' : 
                                        isCompleted ? 'bg-emerald-500 text-white' : 'bg-white border border-slate-200 text-slate-400'
                                    }`}>
                                        {isCompleted ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg> : step.icon}
                                    </div>
                                    <span className={`text-[10px] font-bold mt-1 uppercase ${isActive ? 'text-indigo-600' : 'text-slate-500'}`}>{step.label}</span>
                                </div>
                                {index < stepsConfig.length - 1 && <div className={`h-[2px] w-8 mx-2 rounded-full ${index < currentStepIndex ? 'bg-emerald-400' : 'bg-slate-200'}`}></div>}
                            </React.Fragment>
                        );
                    })}
                </nav>
            </div>

            <div className="p-6 md:p-10">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">{stepsConfig[currentStepIndex].longLabel}</h2>
                        <p className="text-slate-500 text-sm mt-1">Nội dung cốt lõi của Bước {currentStepIndex + 1}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <button 
                            onClick={() => setIsEditing(!isEditing)} 
                            disabled={isLoading} 
                            className="px-6 py-2.5 text-xs font-black text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 shadow-lg shadow-slate-100 transition-all active:scale-95 disabled:opacity-30"
                        >
                            {isEditing ? 'XEM TRƯỚC' : 'SỬA THỦ CÔNG'}
                        </button>
                        <button 
                            onClick={handleCopy} 
                            disabled={isLoading || !contentToDisplay} 
                            className="px-6 py-2.5 text-xs font-black text-indigo-700 bg-indigo-50 rounded-xl hover:bg-indigo-100 shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-30"
                        >
                            {copySuccess ? copySuccess.toUpperCase() : 'COPY'}
                        </button>
                        <button 
                            onClick={handleExportDocx} 
                            disabled={isLoading || !contentToDisplay} 
                            className="px-8 py-2.5 text-xs font-black text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all active:scale-95 disabled:opacity-30"
                        >
                            XUẤT WORD
                        </button>
                    </div>
                 </div>

                 <div ref={contentContainerRef}>
                     {isLoading ? (
                         <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-100 min-h-[400px]">
                            <div className="relative w-20 h-20 mb-6">
                                <div className="absolute inset-0 border-4 border-indigo-50 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">{getLoadingLabel(loadingStep || currentStep)}</h3>
                         </div>
                     ) : error && !contentToDisplay ? (
                         <div className="p-10 bg-red-50 text-red-700 rounded-2xl text-center border border-red-100">
                             <p className="font-bold mb-4">{error}</p>
                             <button onClick={onRegenerate} className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg">Thử lại</button>
                         </div>
                     ) : isEditing ? (
                         <textarea
                            className="w-full min-h-[500px] p-6 font-mono text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            value={contentToDisplay}
                            onChange={(e) => onResultChange(currentStep, e.target.value)}
                         />
                     ) : (
                         <ContentRenderer content={contentToDisplay} currentStep={currentStep} />
                     )}
                 </div>
            </div>

            <div className="px-6 md:px-10 py-8 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <button 
                    onClick={onBack} 
                    disabled={currentStepIndex === 0 || isLoading} 
                    className="px-8 py-2.5 text-sm font-black text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 shadow-sm transition-all active:scale-95 disabled:opacity-30"
                >
                    QUAY LẠI
                </button>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onRegenerate} 
                        disabled={isLoading} 
                        className="px-8 py-2.5 text-sm font-black text-amber-700 bg-amber-50 border border-amber-100 rounded-xl hover:bg-amber-100 shadow-lg shadow-amber-50 transition-all active:scale-95 disabled:opacity-30"
                    >
                        TẠO LẠI BƯỚC NÀY
                    </button>
                    {currentStepIndex < stepsConfig.length - 1 ? (
                        <button 
                            onClick={onNext} 
                            disabled={isLoading || !contentToDisplay} 
                            className="px-12 py-2.5 text-sm font-black text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-30"
                        >
                            TIẾP TỤC
                        </button>
                    ) : (
                        <button 
                            onClick={onStartOver} 
                            className="px-12 py-2.5 text-sm font-black text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all active:scale-95"
                        >
                            LÀM ĐỀ MỚI
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResultsDisplay;
