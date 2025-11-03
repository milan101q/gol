
import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import type { Chat as ChatType } from '@google/genai';

// --- START OF types.ts content ---
interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

interface Reminder {
  plantName: string;
  interval: number; // in days
  startDate: number; // timestamp
}
// --- END OF types.ts content ---


// --- START OF components/icons.tsx content ---
const UploadIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

const SendIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
  </svg>
);

const SparklesIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.293 2.293a1 1 0 010 1.414L10 12l-2 2 2.828 2.828a1 1 0 010 1.414L10 21m5-16l2.293 2.293a1 1 0 000 1.414L15 12l-2 2 2.828 2.828a1 1 0 000 1.414L15 21" />
    </svg>
);

const CalendarIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const BellIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const MicrophoneIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
);

const ShareIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
    </svg>
);
// --- END OF components/icons.tsx content ---


// --- START OF services/geminiService.ts content ---
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set. The app may not work correctly.");
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

const analyzePlantImage = async (base64Image: string, mimeType: string): Promise<GenerateContentResponse> => {
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


const createChatSession = (): Chat => {
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: "شما یک دستیار باغبانی دانا و مفید به زبان فارسی هستید. به سوالات کاربران در مورد گیاهان و باغبانی به طور دقیق و دوستانه پاسخ دهید."
        }
    });
};

const sendMessageToChat = async (chat: Chat, message: string): Promise<GenerateContentResponse> => {
    const response = await chat.sendMessage({ message });
    return response;
};
// --- END OF services/geminiService.ts content ---


// --- START OF App.tsx content ---
// Add type definitions for SpeechRecognition API as it's not a standard part of TypeScript's DOM library.
interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: any) => void;
  onend: () => void;
  onerror: (event: any) => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

// Helper function to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
};

const ReminderModal: React.FC<{ plantName: string, onSave: (interval: number) => void, onClose: () => void }> = ({ plantName, onSave, onClose }) => {
    const [interval, setInterval] = useState(7);

    const handleSave = () => {
        if (interval > 0) {
            onSave(interval);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm text-right">
                <h3 className="text-lg font-bold text-gray-800 mb-2">تنظیم یادآور آبیاری</h3>
                <p className="text-sm text-gray-600 mb-4">هر چند روز یکبار برای آبیاری <span className="font-semibold text-green-700">{plantName}</span> به شما یادآوری کنیم؟</p>
                <div className="flex items-center justify-center space-x-2 space-x-reverse mb-6">
                    <input
                        type="number"
                        value={interval}
                        onChange={(e) => setInterval(parseInt(e.target.value, 10) || 1)}
                        className="w-24 text-center p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        min="1"
                    />
                    <span className="font-medium text-gray-700">روز</span>
                </div>
                <div className="flex justify-between">
                    <button onClick={handleSave} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700">ذخیره یادآور</button>
                    <button onClick={onClose} className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">لغو</button>
                </div>
            </div>
        </div>
    );
};


const App: React.FC = () => {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plantName, setPlantName] = useState<string | null>(null);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [reminders, setReminders] = useState<(Reminder & { nextWateringDate: Date })[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'reminders'>('chat');

  const chatSession = useRef<ChatType | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  // Initialize chat session on component mount
  useEffect(() => {
    chatSession.current = createChatSession();

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'fa-IR';
      recognition.continuous = false;
      recognition.interimResults = true;
      
      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setUserInput(finalTranscript + interimTranscript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setError("خطایی در تشخیص گفتار رخ داد.");
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      console.warn("Speech recognition not supported in this browser.");
    }
  }, []);

  // Load reminders from localStorage on component mount
  useEffect(() => {
    const storedReminders = localStorage.getItem('wateringReminders');
    if (storedReminders) {
        try {
            const parsedReminders: Reminder[] = JSON.parse(storedReminders);
            const remindersWithDates = parsedReminders.map(reminder => {
                const msInDay = 24 * 60 * 60 * 1000;
                const intervalMs = reminder.interval * msInDay;
                const timeSinceStart = Date.now() - reminder.startDate;
                
                const intervalsPassed = Math.floor(timeSinceStart / intervalMs);
                const nextWateringTimestamp = reminder.startDate + (intervalsPassed + 1) * intervalMs;
                const nextWateringDate = new Date(nextWateringTimestamp);

                // Alert if due today or past due
                if (Date.now() >= nextWateringDate.getTime() - msInDay && Date.now() < nextWateringDate.getTime() + msInDay) {
                  setTimeout(() => alert(`🌿 یادت نره! امروز نوبت آبیاری "${reminder.plantName}" است.`), 500);
                }

                return { ...reminder, nextWateringDate };
            });
            remindersWithDates.sort((a, b) => a.nextWateringDate.getTime() - b.nextWateringDate.getTime());
            setReminders(remindersWithDates);
        } catch (e) {
            console.error("Failed to parse reminders from localStorage", e);
            localStorage.removeItem('wateringReminders'); // Clear corrupted data
        }
    }
  }, []);


  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setMessages([]); // Clear messages for new plant analysis
      setError(null);
      setPlantName(null);
      setActiveTab('chat');
    }
  };

  const handleAnalyzeClick = async () => {
    if (!image) {
      setError('لطفاً ابتدا یک عکس انتخاب کنید.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setMessages([]);
    setPlantName(null);

    try {
      const base64Image = await fileToBase64(image);
      const response = await analyzePlantImage(base64Image, image.type);
      const modelResponse = response.text;
      
      setMessages([{ role: 'model', text: modelResponse }]);

      const nameMatch = modelResponse.match(/\*\*نام گیاه:\*\*\s*(.*?)\s*(\/|\n)/);
      if (nameMatch && nameMatch[1]) {
        setPlantName(nameMatch[1].trim());
      }
      
      chatSession.current = createChatSession();

    } catch (err) {
      console.error(err);
      setError('خطایی در تحلیل تصویر رخ داد. لطفاً دوباره تلاش کنید.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    const userMessage: ChatMessage = { role: 'user', text: userInput };
    setMessages((prev) => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);
    setError(null);

    try {
        if (!chatSession.current) {
            chatSession.current = createChatSession();
        }
        const response = await sendMessageToChat(chatSession.current, userInput);
        const modelResponse = response.text;
        setMessages((prev) => [...prev, { role: 'model', text: modelResponse }]);
    } catch (err) {
      console.error(err);
      setError('خطایی در ارتباط با سرور رخ داد. لطفاً دوباره تلاش کنید.');
      setMessages((prev) => prev.slice(0, -1)); // Remove user message on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveReminder = (interval: number) => {
    if (!plantName) return;
    
    const newReminder: Reminder = {
        plantName,
        interval,
        startDate: Date.now()
    };

    const updatedReminders = [...reminders.filter(r => r.plantName !== plantName), newReminder];
    
    localStorage.setItem('wateringReminders', JSON.stringify(updatedReminders));

    const msInDay = 24 * 60 * 60 * 1000;
    const nextWateringDate = new Date(newReminder.startDate + newReminder.interval * msInDay);
    
    setReminders(prev => {
        const newList = [...prev.filter(r => r.plantName !== plantName), { ...newReminder, nextWateringDate}];
        newList.sort((a, b) => a.nextWateringDate.getTime() - b.nextWateringDate.getTime());
        return newList;
    });
    setIsReminderModalOpen(false);
  };

  const handleDeleteReminder = (plantNameToDelete: string) => {
    const updatedReminders = reminders.filter(r => r.plantName !== plantNameToDelete);
    localStorage.setItem('wateringReminders', JSON.stringify(updatedReminders));
    setReminders(updatedReminders);
  };
  
  const handleToggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setUserInput('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const getPlantDescription = (modelResponse: string): string => {
    const match = modelResponse.match(/\*\*معرفی:\*\*\n([\s\S]*?)\n\*\*/);
    return match ? match[1].trim() : "اطلاعاتی یافت نشد.";
  };
  
  const handleShare = async () => {
    if (!plantName || messages.length === 0 || !navigator.share) {
      return;
    }

    const description = getPlantDescription(messages[0].text);
    const shareData = {
      title: `🌿 گیاه شناسایی شده: ${plantName}`,
      text: `من همین الان با دستیار باغبانی، گیاه "${plantName}" را شناسایی کردم!\n\nمعرفی کوتاه:\n${description}`,
    };

    try {
      await navigator.share(shareData);
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };


  const formattedText = (text: string) => {
    const sections = text.split('\n');
    return sections.map((section, index) => {
        if (section.startsWith('**') && section.endsWith('**')) {
            return <h2 key={index} className="text-xl font-bold mt-4 mb-2 text-green-800">{section.replace(/\*\*/g, '')}</h2>;
        }
        if (section.startsWith('*   **')) {
            const parts = section.replace('*   **', '').split(':**');
            return <p key={index} className="mb-2"><strong className="font-semibold text-green-700">{parts[0]}:</strong> {parts[1]}</p>;
        }
        if (section.startsWith('*   ')) {
           return <li key={index} className="mb-1 list-disc mr-5">{section.replace('*   ', '')}</li>
        }
        return <p key={index} className="mb-2">{section}</p>;
    });
  };

  const hasReminderForCurrentPlant = plantName ? reminders.some(r => r.plantName === plantName) : false;

  return (
    <div className="flex flex-col h-screen bg-green-50">
      {isReminderModalOpen && plantName && <ReminderModal plantName={plantName} onSave={handleSaveReminder} onClose={() => setIsReminderModalOpen(false)} />}
      <header className="bg-white shadow-md p-4 flex items-center justify-center border-b-2 border-green-200">
        <h1 className="text-2xl font-bold text-green-800">🌿 دستیار هوشمند باغبانی</h1>
      </header>

      <nav className="flex bg-white border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-3 text-center font-semibold transition-colors ${activeTab === 'chat' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          شناسایی و گفتگو
        </button>
        <button 
          onClick={() => setActiveTab('reminders')}
          className={`flex-1 py-3 text-center font-semibold transition-colors ${activeTab === 'reminders' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          یادآورهای من {reminders.length > 0 && `(${reminders.length})`}
        </button>
      </nav>
      
      {activeTab === 'chat' && (
        <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <div className="w-full md:w-1/3 lg:w-2/5 p-6 bg-white border-l-2 border-green-100 flex flex-col items-center justify-center">
              <div className="w-full max-w-sm">
                  <h2 className="text-xl font-semibold text-center text-gray-700 mb-4">گیاه خود را شناسایی کنید</h2>
                  <div 
                      className="relative border-2 border-dashed border-green-300 rounded-lg p-6 text-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                  >
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                      {imagePreview ? (
                          <img src={imagePreview} alt="پیش‌نمایش گیاه" className="mx-auto rounded-lg max-h-60 object-contain" />
                      ) : (
                          <div className="flex flex-col items-center text-green-700">
                              <UploadIcon className="w-12 h-12 mb-2"/>
                              <p className="font-semibold">برای انتخاب عکس کلیک کنید</p>
                              <p className="text-sm text-gray-500">یا عکس را به اینجا بکشید</p>
                          </div>
                      )}
                  </div>
                  
                  {image && (
                      <button
                          onClick={handleAnalyzeClick}
                          disabled={isLoading}
                          className="w-full mt-4 bg-green-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                      >
                          {isLoading && messages.length === 0 ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> : <SparklesIcon className="w-6 h-6 mr-2" />}
                          <span>{isLoading && messages.length === 0 ? 'در حال تحلیل...' : 'تحلیل عکس گیاه'}</span>
                      </button>
                  )}
                  {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
                  
                  {plantName && messages.length > 0 && (
                      <div className="w-full mt-4 flex space-x-2 space-x-reverse">
                          {!hasReminderForCurrentPlant && (
                              <button
                                  onClick={() => setIsReminderModalOpen(true)}
                                  className="flex-1 bg-blue-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-all"
                              >
                                  <CalendarIcon className="w-6 h-6 ml-2" />
                                  <span>یادآور</span>
                              </button>
                          )}
                          {typeof navigator.share === 'function' && (
                            <button
                                  onClick={handleShare}
                                  className="flex-1 bg-gray-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center hover:bg-gray-600 transition-all"
                              >
                                  <ShareIcon className="w-6 h-6 ml-2" />
                                  <span>اشتراک</span>
                              </button>
                          )}
                      </div>
                  )}

                  {hasReminderForCurrentPlant && (
                    <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg text-center text-green-800">
                      <p className="text-sm">یادآور آبیاری برای این گیاه فعال است. می‌توانید آن را در تب "یادآورهای من" مدیریت کنید.</p>
                    </div>
                  )}
              </div>
          </div>

          <div className="flex-1 flex flex-col bg-gray-50 p-4">
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto pr-2">
              {messages.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                  <p className="text-lg">برای شروع، عکسی از گیاه خود آپلود و تحلیل کنید.</p>
                  <p>سپس می‌توانید سوالات بیشتری بپرسید!</p>
                </div>
              )}

              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
                  <div className={`max-w-xl p-4 rounded-2xl ${msg.role === 'user' ? 'bg-green-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none shadow-sm'}`}>
                    {msg.role === 'model' ? formattedText(msg.text) : <p>{msg.text}</p>}
                  </div>
                </div>
              ))}
              {isLoading && messages.length > 0 && (
                  <div className="flex justify-start mb-4">
                      <div className="max-w-xl p-4 rounded-2xl bg-white text-gray-800 rounded-bl-none shadow-sm flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-75 mr-2"></div>
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-150"></div>
                      </div>
                  </div>
              )}
            </div>
            
            <div className="mt-4 border-t pt-4">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-2 space-x-reverse">
                <input 
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder={isListening ? "در حال شنیدن..." : (messages.length > 0 ? "سوال دیگری بپرسید..." : "ابتدا یک گیاه را تحلیل کنید...")}
                  className="flex-1 p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={messages.length === 0 || isLoading}
                />
                {recognitionRef.current && (
                  <button
                      type="button"
                      onClick={handleToggleListening}
                      disabled={messages.length === 0 || isLoading}
                      className={`p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors ${
                          isListening ? 'text-red-500 animate-pulse' : 'text-gray-500 hover:text-green-600'
                      }`}
                      aria-label={isListening ? "توقف ضبط" : "شروع ضبط"}
                  >
                      <MicrophoneIcon className="w-6 h-6"/>
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!userInput.trim() || isLoading || messages.length === 0}
                  className="bg-green-600 text-white p-3 rounded-full hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  aria-label="ارسال پیام"
                >
                  <SendIcon className="w-6 h-6"/>
                </button>
              </form>
            </div>
          </div>
        </main>
      )}
      {activeTab === 'reminders' && (
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">یادآورهای آبیاری من</h2>
            {reminders.length === 0 ? (
              <div className="text-center text-gray-500 mt-12">
                <BellIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg">هنوز یادآوری ثبت نکرده‌اید.</p>
                <p>گیاهی را در تب "شناسایی و گفتگو" تحلیل کنید تا بتوانید یادآور آبیاری برای آن تنظیم کنید.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reminders.map(reminder => (
                  <div key={reminder.plantName} className="bg-white p-4 rounded-lg shadow-md flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-green-700">{reminder.plantName}</h3>
                      <p className="text-sm text-gray-600">
                        هر <span className="font-semibold">{reminder.interval}</span> روز یکبار
                      </p>
                      <p className="text-sm text-gray-800 mt-1">
                        آبیاری بعدی: <span className="font-bold">{reminder.nextWateringDate.toLocaleDateString('fa-IR')}</span>
                      </p>
                    </div>
                    <button 
                      onClick={() => handleDeleteReminder(reminder.plantName)}
                      className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                      aria-label={`حذف یادآور برای ${reminder.plantName}`}
                    >
                      <TrashIcon className="w-6 h-6" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
// --- END OF App.tsx content ---


// --- START OF original index.tsx content ---
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
// --- END OF original index.tsx content ---
