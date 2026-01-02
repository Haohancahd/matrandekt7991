
import { GoogleGenAI } from "@google/genai";
import type { ExamFormData, ExamResult } from '../types';

type GenerationStep = 'matrix' | 'specification' | 'exam' | 'answerKey' | 'answerSupplement';

const getExamInfo = (data: ExamFormData) => `
THÔNG TIN ĐỀ THI:
- Cấp học: ${data.schoolLevel}
- Lớp: ${data.grade}
- Môn học: ${data.subject}
- Bộ sách: ${data.textbook}
- Thời gian: ${data.duration} phút
- Nội dung: ${data.knowledgeContent}
`;

const getQuestionDistribution = (data: ExamFormData) => `
CẤU TRÚC ĐIỂM & MỨC ĐỘ:
- Trắc nghiệm: ${data.multipleChoice.questionCount} câu, ${data.multipleChoice.score} điểm
- Đúng/Sai: ${data.trueFalse.questionCount} câu, ${data.trueFalse.score} điểm
- Trả lời ngắn: ${data.shortAnswer.questionCount} câu, ${data.shortAnswer.score} điểm
- Tự luận: ${data.essay.questionCount} câu, ${data.essay.score} điểm
- TỈ LỆ NHẬN THỨC: NB: ${data.cognitiveLevels.nb}%, TH: ${data.cognitiveLevels.th}%, VD: ${data.cognitiveLevels.vd}%, VDC: ${data.cognitiveLevels.vdc}%
- Tổng điểm: 10
`;

const getGeneralPrompt = (part: GenerationStep, data: ExamFormData, context: Partial<ExamResult>) => {
    const commonInstructions = `
BẠN LÀ CHUYÊN GIA KHẢO THÍ. PHẢI TUÂN THỦ NGHIÊM NGẶT CÁC QUY TẮC SAU:
1. CHỈ TRẢ VỀ NỘI DUNG YÊU CẦU. KHÔNG chào hỏi, KHÔNG giải thích, KHÔNG "Dưới đây là...", KHÔNG ghi chú cuối bài.
2. QUY TẮC ĐỊNH DẠNG CÔNG THỨC & KÝ HIỆU:
   - CHỈ SỐ ĐƠN GIẢN: Với công thức Hóa học (H₂O, CO₂, H₂SO₄...), lũy thừa đơn giản (x², y³, cm³, m/s²), sử dụng ký tự Unicode chỉ số dưới/trên chuẩn trực tiếp trong văn bản. TUYỆT ĐỐI KHÔNG dùng khối công thức toán ($) cho các trường hợp này.
   - CÔNG THỨC PHỨC TẠP: Chỉ dùng ký hiệu $ cho phân số, căn thức, hệ phương trình hoặc các biểu thức toán học phức tạp cần trình bày đẹp.
   - KÝ HIỆU GÓC: Sử dụng LaTeX trong khối $. 
     + Góc có 1 chữ cái: Dùng \\hat{A} (ví dụ: $\\hat{A}$).
     + Góc có 3 chữ cái: Dùng \\widehat{ABC} (ví dụ: $\\widehat{ABC}$).
3. TIÊU ĐỀ: Sử dụng CHỮ IN HOA ĐẬM cho các phần lớn.
`;

    switch (part) {
        case 'matrix':
            return `
${commonInstructions}
NHIỆM VỤ: Lập MA TRẬN ĐỀ KIỂM TRA.
${getExamInfo(data)}
${getQuestionDistribution(data)}
YÊU CẦU: 
- Chỉ trả về duy nhất 1 bảng Markdown có đúng 7 cột: | STT | Nội dung / Đơn vị kiến thức | Mức độ nhận thức | Hình thức | Số câu | Số điểm | Tỉ lệ % |
- Đảm bảo tổng tỉ lệ các mức độ (NB, TH, VD, VDC) khớp với yêu cầu: NB: ${data.cognitiveLevels.nb}%, TH: ${data.cognitiveLevels.th}%, VD: ${data.cognitiveLevels.vd}%, VDC: ${data.cognitiveLevels.vdc}%
`;
        case 'specification':
            return `
${commonInstructions}
NHIỆM VỤ: Lập BẢN ĐẶC TẢ ĐỀ KIỂM TRA dựa trên Ma trận sau:
${context.matrix}

YÊU CẦU: Chỉ trả về duy nhất 1 bảng Markdown có đúng 6 cột:
| Câu số | Nội dung / Đơn vị kiến thức | Yêu cầu cần đạt | Mức độ | Thời gian (phút) | Điểm |
`;
        case 'exam':
            return `
${commonInstructions}
NHIỆM VỤ: Thiết kế ĐỀ KIỂM TRA chuẩn theo Công văn 7991.
Dựa trên Ma trận: ${context.matrix}
Dựa trên Đặc tả: ${context.specification}

YÊU CẦU: 
- Nội dung phải chính xác, khoa học, thẩm mỹ.
- Cấu trúc gồm: Tiêu đề đề thi (Trường, Lớp, Mã đề, Thời gian), sau đó là các PHẦN câu hỏi.
- KHÔNG TRẢ VỀ BẢNG MA TRẬN HAY ĐẶC TẢ TRONG BƯỚC NÀY. CHỈ TRẢ VỀ NỘI DUNG ĐỀ THI.
`;
        case 'answerKey':
            return `
${commonInstructions}
NHIỆM VỤ: Lập ĐÁP ÁN & ĐIỂM dựa trên đề thi sau:
${context.exam}

YÊU CẦU: Chỉ trả về duy nhất 1 bảng Markdown có đúng 3 cột:
| Câu số | Lời giải/Đáp án | Điểm |
`;
        case 'answerSupplement':
            return `
${commonInstructions}
NHIỆM VỤ: Viết LỜI GIẢI CHI TIẾT (HỌC THUẬT) cho từng câu hỏi trong đề thi sau:
${context.exam}

YÊU CẦU:
- Trình bày theo thứ tự từng câu hỏi.
- Phong cách học thuật, giải thích logic, sư phạm.
- TUYỆT ĐỐI KHÔNG ghi điểm số.
- KHÔNG chia bảng (trừ khi cần minh họa nội dung đặc thù).
- CHỈ TRẢ VỀ NỘI DUNG LỜI GIẢI.
`;
    }
};

export const generateExamPart = async (
    part: GenerationStep,
    data: ExamFormData,
    context: Partial<ExamResult>
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const prompt = getGeneralPrompt(part, data, context);
        const systemInstruction = `Bạn là một AI chuyên nghiệp về giáo dục Việt Nam. 
        Nhiệm vụ của bạn là tạo ra các văn bản khảo thí chuẩn xác theo Công văn 7991. 
        PHẢI dùng Unicode cho chỉ số Hóa học và lũy thừa đơn giản (₂ , ² , ³ ...). 
        PHẢI dùng \\hat{A} cho góc 1 chữ và \\widehat{ABC} cho góc 3 chữ trong khối $.
        Trả về nội dung thuần túy, không lời dẫn thừa.
        Đảm bảo tỉ lệ phân bổ mức độ kiến thức trong Ma trận khớp chính xác: NB: ${data.cognitiveLevels.nb}%, TH: ${data.cognitiveLevels.th}%, VD: ${data.cognitiveLevels.vd}%, VDC: ${data.cognitiveLevels.vdc}%`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.1, 
                thinkingConfig: { thinkingBudget: 16384 }, 
            },
        });
        
        let text = response.text || '';
        text = text.replace(/^```(markdown|text|html)?\s*|```\s*$/g, '').trim();
        
        return text;

    } catch (error) {
        console.error(`Gemini Error [${part}]:`, error);
        throw new Error(error instanceof Error ? error.message : 'Lỗi kết nối AI.');
    }
};
