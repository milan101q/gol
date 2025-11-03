
import { GoogleGenAI, Chat, GenerateContentResponse, Part } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const model = ai.models;

const PLANT_IDENTIFICATION_PROMPT = `
شما یک دستیار متخصص باغبانی به زبان فارسی هستید. وظیفه شما شناسایی گیاه موجود در این تصویر است.
لطفاً پاسخ خود را با فرمت زیر و به زبان فارسی ارائه دهید:

**نام گیاه:** [نام رایج گیاه به فارسی] / [نام علمی به انگلیسی]

**معرفی:**
[توضیح مختصر و جالبی درباره گیاه، منشأ آن و ویژگی‌های اصلی آن.]

**دستورالعمل‌های مراقبت:**
*   **نور:** [توضیح کامل در مورد نیاز نوری گیاه. مثلا: نور غیرمستقیم و زیاد، تحمل نور کم و... ]
*   **آبیاری:** [توضیح کامل در مورد نحوه و زمان آبیاری. مثلا: خاک بین دو آبیاری خشک شود، همیشه مرطوب بماند و... ]
*   **خاک:** [نوع خاک مناسب برای گیاه. مثلا: خاک با زهکشی خوب، ترکیبی از پیت ماس و پرلیت و... ]
*   **دما و رطوبت:** [بازه دمایی و سطح رطوبت ایده‌آل برای گیاه.]
*   **کوددهی:** [زمان و نوع کود مناسب برای گیاه در فصول مختلف.]

**مشکلات رایج:**
[فهرستی از آفات و بیماری‌های شایع گیاه همراه با راه‌حل‌های ساده.]

اگر تصویر واضح نیست یا گیاهی در آن وجود ندارد، لطفاً به صورت محترمانه از کاربر بخواهید عکس بهتری ارسال کند.
`;

export const analyzePlantImage = async (base64Image: string, mimeType: string): Promise<GenerateContentResponse> => {
  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType,
    },
  };

  const textPart = {
    text: PLANT_IDENTIFICATION_PROMPT,
  };

  const response = await model.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [imagePart, textPart] },
  });
  
  return response;
};


export const createChatSession = (): Chat => {
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: "شما یک دستیار باغبانی دانا و مفید به زبان فارسی هستید. به سوالات کاربران در مورد گیاهان و باغبانی به طور دقیق و دوستانه پاسخ دهید."
        }
    });
};

export const sendMessageToChat = async (chat: Chat, message: string): Promise<GenerateContentResponse> => {
    const response = await chat.sendMessage({ message });
    return response;
};
