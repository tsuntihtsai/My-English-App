import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, RotateCcw, Image, FileText, Upload, Brain, Check } from 'lucide-react';

// --- 環境變數 ---
// 1. Gemini API Key (來自 .env)
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
// 2. Gemini API URL (使用 1.5-flash 來支援圖片)
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
// 3. [!!! 部署關鍵 !!!] 你的後端 TTS 伺服器 URL
// 在 Zeabur 上，你需要將其設定為你後端服務的公開網址
// 例如：'https://my-tts-backend.zeabur.app/api/tts'
const TTS_API_URL = process.env.REACT_APP_TTS_API_URL || 'http://localhost:3001/api/tts'; // 本地開發時 fallback 到 localhost

// --- 資料定義 ---
const teachers = {
  teacher1: {
    name: 'Emma',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma_Teacher&backgroundColor=ffb6c1&scale=90&mood=happy',
    bio: 'English Culture Expert',
    voice: 'Female'
  },
  teacher2: {
    name: 'James',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James_Teacher&backgroundColor=add8e6&scale=90&mood=happy',
    bio: 'Business English Teacher',
    voice: 'Male'
  },
  teacher3: {
    name: 'Sofia',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia_Teacher&backgroundColor=dda0dd&scale=90&mood=happy',
    bio: 'Travel English Guide',
    voice: 'Female'
  },
  teacher4: {
    name: 'Alex',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex_Teacher&backgroundColor=90ee90&scale=90&mood=happy',
    bio: 'Technology Expert',
    voice: 'Male'
  }
};

const topics = {
  business: { name: 'Business', icon: '💼', desc: 'Business communication' },
  travel: { name: 'Travel', icon: '✈️', desc: 'Travel and tourism' },
  news: { name: 'News', icon: '📰', desc: 'News discussion' },
  technology: { name: 'Technology', icon: '🚀', desc: 'Tech trends' },
  presentation: { name: 'Presentation', icon: '📊', desc: 'English presentation practice' },
  freeTalk: { name: '自由對談 (Free Talk)', icon: '💬', desc: 'AI老師隨機圖片/文章討論' }
};

const levels = {
  beginner: { name: '初級', level: 'Beginner' },
  intermediate: { name: '中級', level: 'Intermediate' },
  advanced: { name: '高級', level: 'Advanced' },
  fluent: { name: '流暢', level: 'Fluent' }
};

// --- 樣式定義 ---
const styles = {
    homeScreen: {
        background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
        color: 'white',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: '100vh'
    },
    title: { fontSize: '48px', fontWeight: 'bold', margin: '20px 0 10px 0', textAlign: 'center' },
    subtitle: { fontSize: '18px', opacity: 0.9, textAlign: 'center', margin: '10px 0' },
    button: {
        width: '100%',
        padding: '16px',
        margin: '12px 0',
        fontSize: '16px',
        fontWeight: 'bold',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.3s ease'
    },
    primaryButton: { background: 'white', color: '#3b82f6' },
    secondaryButton: { background: 'rgba(255, 255, 255, 0.2)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.3)' },
    topicScreen: { background: '#f3f4f6', padding: '24px', minHeight: '100vh', overflowY: 'auto' },
    topicItem: {
        background: 'white',
        border: '2px solid #e5e7eb',
        borderRadius: '12px',
        padding: '16px',
        margin: '12px 0',
        cursor: 'pointer',
        transition: 'all 0.3s ease'
    },
    topicItemSelected: { background: '#3b82f6', color: 'white', border: '2px solid #3b82f6' },
    uploadScreen: {
        background: '#f3f4f6',
        padding: '24px',
        minHeight: '100vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column'
    },
    uploadOption: {
        background: 'white',
        border: '2px solid #e5e7eb',
        borderRadius: '12px',
        padding: '20px',
        margin: '12px 0',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
    },
    uploadOptionSelected: {
        background: '#e0f2fe',
        border: '2px solid #3b82f6'
    },
    uploadInputArea: {
        background: 'white',
        padding: '16px',
        borderRadius: '12px',
        border: '2px dashed #cbd5e1',
        marginTop: '10px'
    },
    chatScreen: { display: 'flex', flexDirection: 'column', height: '100vh', background: '#f3f4f6' },
    chatHeader: {
        background: 'white',
        borderBottom: '2px solid #e5e7eb',
        padding: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    chatMessages: {
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
    },
    userMessage: {
        alignSelf: 'flex-end',
        background: '#3b82f6',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '12px',
        maxWidth: '70%',
        wordWrap: 'break-word'
    },
    aiMessage: {
        alignSelf: 'flex-start',
        background: 'white',
        color: '#1f2937',
        padding: '12px 16px',
        borderRadius: '12px',
        border: '2px solid #e5e7eb',
        maxWidth: '70%',
        wordWrap: 'break-word'
    },
    imageMessage: {
      padding: '10px',
      borderRadius: '12px',
      border: '2px solid #e5e7eb',
      maxWidth: '70%',
      background: 'white'
    },
    articleMessage: {
      padding: '12px 16px',
      borderRadius: '12px',
      border: '2px solid #e5e7eb',
      maxWidth: '70%',
      fontSize: '14px',
      lineHeight: '1.6',
      maxHeight: '200px',
      overflowY: 'auto'
    },
    chatControls: {
        background: 'white',
        borderTop: '2px solid #e5e7eb',
        padding: '16px',
        textAlign: 'center'
    },
    micButton: {
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        border: 'none',
        fontSize: '32px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        marginBottom: '16px'
    }
};

// --- 輔助函式 ---
const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        try {
            const [header, data] = reader.result.split(',');
            const mimeType = header.match(/:(.*?);/)[1];
            resolve({ data, mimeType });
        } catch (error) {
            reject(new Error("Error parsing file data."));
        }
    };
    reader.onerror = (error) => reject(error);
});

// --- 主應用程式組件 ---
function App() {
  const [screen, setScreen] = useState('home');
  const [topic, setTopic] = useState('business');
  const [level, setLevel] = useState('intermediate');
  const [teacher, setTeacher] = useState('teacher1');
  const [messages, setMessages] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [isRepeatMode, setIsRepeatMode] = useState(false);
  
  const [freeTalkOption, setFreeTalkOption] = useState('ai');
  const [userFile, setUserFile] = useState(null);
  const [userText, setUserText] = useState('');

  const conversationHistory = useRef([]);
  const correctAttempts = useRef(0);
  const chatMessagesRef = useRef(null);
  const audioPlayer = useRef(null); // 用於控制 TTS 音訊

  // 自動捲動
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);

  // 系統提示 (System Prompt)
  const getSystemPrompt = useCallback(() => {
    let basePrompt = `You are ${teachers[teacher].name}, an enthusiastic English teacher.
Student level: ${levels[level].name}.
Topic: ${topics[topic].name}.

IMPORTANT: Speak naturally with emotion and personality!
- Use contractions (I'm, don't, can't).
- Add emotional words (wow, amazing, oh, hmm).
- Show enthusiasm with exclamation marks!
- Ask questions to engage the student.
- Be friendly and encouraging.

Instructions:
1. Speak naturally with feeling.
2. Keep responses to 1-2 sentences.

// 情感標籤指令 (已更新)
IMPORTANT: Based on the sentiment of your response, prefix it with an emotional tag:
- [HAPPY]: Positive, encouraging, or exciting.
- [SAD]: Empathetic, slightly sad, or regretful.
- [NEUTRAL]: Neutral, informative, or pondering.
- [SURPRISE]: Surprising or exclamatory.
- [SERIOUS]: For serious topics, factual explanations, or gentle corrections.
- [STRICT]: When making a firm, direct grammar/wording correction, especially on repeated mistakes.

Example (Encouraging): "[HAPPY] Wow, that's a fantastic idea! I love your creativity!"
Example (Correction 1 - Kind): "[SERIOUS] Good try! Just a small fix: say 'I *saw* two cats' instead of 'I *see* two cats'. Can you say that again?"

${(level === 'beginner' || level === 'intermediate') && !isRepeatMode ? `
3. Check every sentence for grammar and wording errors.
- If it's a small mistake, be encouraging: "[SERIOUS] Almost there! Just say 'I *am* happy' instead of 'I *is* happy'. Can you try that again?"
- If it's a repeated or more significant mistake, be more firm: "[STRICT] Hmm, that's not quite right. Remember, we say 'He *goes* to the store,' not 'He *go*'. Please try the sentence again."
` : ''}
${isRepeatMode ? `
The student is repeating their sentence. Evaluate if it is now correct (80% accuracy).
If correct, praise them: "[HAPPY] Excellent! You got it right! Now, let's continue..."
If still has errors, encourage them: "[STRICT] Not quite. Listen closely: 'She *doesn't* like coffee'. Try one more time."
` : ''}

// [修改] Free Talk 模式的特殊指令 - 包含 AI 主導和使用者上傳
${topic === 'freeTalk' && messages.length === 0 ? `
SPECIAL INSTRUCTION FOR FREE TALK (Initial Message):
Your behavior depends on the student's first message:

1.  **If the user message is "Initiate Free Talk Session" (AI Choice):**
    This means the user wants YOU to provide a topic.
    You MUST choose ONE of the following options and prefix your response with the exact tag:
    -   Generate Image Prompt: \`[IMAGE_PROMPT]\` (e.g., "[HAPPY][IMAGE_PROMPT]A cozy coffee shop with steam rising from a mug. What do you see in this picture?")
    -   Generate Article Summary: \`[ARTICLE_SUMMARY]\` (e.g., "[HAPPY][ARTICLE_SUMMARY]Did you know... What do you think about that?")

2.  **If the user message contains "image I've uploaded" or "article I've uploaded" (User Choice):**
    This means the user has provided their own content (the image/text is included in their message).
    Your job is to:
    -   Acknowledge the content (e.g., "Wow, what a cool picture!" or "Thanks for sharing this article.")
    -   Make one brief observation about it.
    -   Ask an open-ended question to start the discussion.
    -   Use an enthusiastic [HAPPY] or [NEUTRAL] tag.
    Example (Image): "[HAPPY] That's a beautiful photo! It looks like a very peaceful beach. What time of day do you think it was taken?"
    Example (Article): "[NEUTRAL] Hmm, that's an interesting topic about... [mention topic]. What's the main point you found most surprising?"
` : ''}
`;
    return basePrompt;
  }, [teacher, level, topic, isRepeatMode, messages.length]);

  // [!!! 關鍵修改 !!!]
  // speakText 現在呼叫你的後端伺服器來取得高品質 MP3
  const speakText = useCallback(async (text, sentiment = 'NEUTRAL') => {
    // 如果目前有音訊正在播放，先停止它
    if (audioPlayer.current) {
        audioPlayer.current.pause();
        audioPlayer.current.currentTime = 0;
    }

    // 設置為「正在聆聽 (AI 說話中)」
    setIsListening(true); 

    try {
        const voiceGender = teachers[teacher].voice;

        const response = await fetch(TTS_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text,
                sentiment: sentiment,
                voiceGender: voiceGender,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`TTS 伺服器錯誤: ${response.status} - ${errorText}`);
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const audio = new Audio(audioUrl);
        audioPlayer.current = audio; // 存儲參照

        audio.onended = () => {
            setIsListening(false); // 播放結束
            URL.revokeObjectURL(audioUrl);
            audioPlayer.current = null;
        };

        audio.onerror = () => {
            console.error("音訊播放錯誤");
            setIsListening(false);
            URL.revokeObjectURL(audioUrl);
        };

        await audio.play();

    } catch (error) {
        console.error('speakText 失敗:', error);
        alert(`無法播放語音: ${error.message}. 請檢查後端伺服器 (TTS_API_URL) 是否正在運行且設定正確。`);
        setIsListening(false); // 發生錯誤時重置
    }
  }, [teacher]); // 依賴項是 teacher (為了 voiceGender)

  // AI 回應邏輯
  const generateAIResponse = useCallback(async (messageContent, messageType = 'text', retryCount = 0) => {
    setIsLoading(true); // AI 正在思考

    // 1. 將使用者訊息加入歷史
    if (retryCount === 0) {
        if (messageType === 'image') {
            conversationHistory.current.push({
                role: 'user',
                parts: [
                    { text: "Please start a conversation about this image I've uploaded." },
                    { inline_data: { mime_type: messageContent.mimeType, data: messageContent.data } }
                ]
            });
        } else if (messageType === 'user_article') {
            conversationHistory.current.push({
                role: 'user',
                parts: [{ text: `I've uploaded this article. Please start a discussion about it: "${messageContent}"` }]
            });
        } else {
            conversationHistory.current.push({
                role: 'user',
                parts: [{ text: messageContent }]
            });
        }
    }

    try {
      // 2. 呼叫 Gemini API
      if (!GEMINI_API_KEY) {
          throw new Error("Gemini API Key is not configured. Please set REACT_APP_GEMINI_API_KEY.");
      }

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: getSystemPrompt() }] },
          contents: conversationHistory.current,
          generationConfig: { maxOutputTokens: 200, temperature: 0.9 }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429 && retryCount < 2) {
            console.warn(`Rate limit exceeded, retrying... (${retryCount + 1}/2)`);
            await new Promise(res => setTimeout(res, 2000));
            return generateAIResponse(messageContent, messageType, retryCount + 1);
        }
        throw new Error(`API Error: ${response.status} - ${errorData.error?.message || 'Unknown API error'}`);
      }

      const data = await response.json();

      // 3. 解析 Gemini 回應
      if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        let aiResponse = data.candidates[0].content.parts[0].text;
        let sentiment = 'NEUTRAL';

        const sentimentMatch = aiResponse.match(/^\[(HAPPY|SAD|NEUTRAL|SURPRISE|SERIOUS|STRICT)\]\s*/i);
        if (sentimentMatch) {
          sentiment = sentimentMatch[1].toUpperCase();
          aiResponse = aiResponse.replace(sentimentMatch[0], ''); // 移除標籤
        }

        const imagePromptMatch = aiResponse.match(/\[IMAGE_PROMPT\]\s*([\s\S]*)/i);
        const articleSummaryMatch = aiResponse.match(/\[ARTICLE_SUMMARY\]\s*([\s\S]*)/i);
        let speechText = aiResponse;

        // 4. 根據回應類型顯示 UI 並播放語音
        if (imagePromptMatch && messages.length === 0) {
            const aiImageDescription = imagePromptMatch[1].trim();
            speechText = aiImageDescription;
            const imageUrl = `https://picsum.photos/seed/${encodeURIComponent(aiImageDescription.slice(0, 10))}/300/200`;
            
            setMessages(prev => [...prev, 
                { role: 'assistant', type: 'image', content: imageUrl },
                { role: 'assistant', type: 'text', content: aiImageDescription, sentiment: sentiment }
            ]);
            speakText(speechText, sentiment);

        } else if (articleSummaryMatch && messages.length === 0) {
            const articleText = articleSummaryMatch[1].trim();
            speechText = articleText;
            setMessages(prev => [...prev, { role: 'assistant', type: 'article', content: articleText, sentiment: sentiment }]);
            speakText(speechText, sentiment);

        } else {
            setMessages(prev => [...prev, { role: 'assistant', type: 'text', content: aiResponse, sentiment: sentiment }]);
            speakText(aiResponse, sentiment);
        }

        // 5. 更新對話歷史和狀態
        conversationHistory.current.push({
          role: 'model',
          parts: [{ text: data.candidates[0].content.parts[0].text }]
        });

        const hasRepeatRequest = aiResponse.toLowerCase().includes('again') || 
                                 aiResponse.toLowerCase().includes('repeat') || 
                                 aiResponse.toLowerCase().includes('try that');
        
        if (hasRepeatRequest && (level === 'beginner' || level === 'intermediate')) {
          setIsRepeatMode(true);
          correctAttempts.current = 0;
        } else {
            setIsRepeatMode(false);
            setMessageCount(prev => prev + 1);
        }

      } else if (data?.promptFeedback?.blockReason) {
        const errorMessage = `Teacher couldn't respond: Content was filtered due to "${data.promptFeedback.blockReason}". Please try rephrasing your sentence.`;
        setMessages(prev => [...prev, { role: 'assistant', type: 'text', content: errorMessage }]);
        speakText(errorMessage, 'SAD');
        conversationHistory.current.pop();
      } else if (retryCount < 2) {
        console.warn(`Invalid response format or empty content, retrying... (${retryCount + 1}/2)`, data);
        await new Promise(res => setTimeout(res, 1500));
        return generateAIResponse(messageContent, messageType, retryCount + 1);
      } else {
        console.error("Invalid response format after retries:", data);
        throw new Error('Invalid response format or no text content in response after multiple retries.');
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      alert(`Error: ${error.message || 'Cannot connect to Gemini API'}. Please check your API key and network connection.`);
      conversationHistory.current.pop();
    } finally {
      setIsLoading(false); // AI 思考結束
      // setIsListening(false) 由 speakText 的 audio.onended 控制
    }
  }, [getSystemPrompt, speakText, level, messages.length]);

  // 開始聊天
  const startChat = useCallback(async (uploadData) => {
    if (audioPlayer.current) {
        audioPlayer.current.pause();
        audioPlayer.current = null;
    }
    setMessages([]);
    conversationHistory.current = [];
    setMessageCount(0);
    setIsRepeatMode(false);
    correctAttempts.current = 0;
    setIsListening(false);
    setScreen('chat');

    try {
      if (uploadData === null) {
        let initialPrompt = (topic === 'freeTalk') 
          ? "Initiate Free Talk Session" 
          : `Hello! I'm ready to start our ${topics[topic].name} conversation.`;
        setTimeout(() => generateAIResponse(initialPrompt, 'text'), 100);

      } else if (uploadData.type === 'image') {
        if (!uploadData.file) throw new Error("No file selected.");
        setIsLoading(true);
        const { data, mimeType } = await fileToBase64(uploadData.file);
        const imageUrl = `data:${mimeType};base64,${data}`;
        setMessages([{ role: 'user', type: 'image', content: imageUrl }]);
        generateAIResponse({ data, mimeType }, 'image');

      } else if (uploadData.type === 'text') {
        if (!uploadData.content) throw new Error("No text provided.");
        setMessages([{ role: 'user', type: 'article', content: uploadData.content }]);
        generateAIResponse(uploadData.content, 'user_article');
      }

    } catch (error) {
      alert(`Error starting chat: ${error.message}`);
      setScreen('upload');
      setIsLoading(false);
    }
  }, [topic, generateAIResponse]);

  // 開始錄音
  const startRecording = useCallback(async () => {
    if (isRecording || isListening || isLoading) return;
    
    if (audioPlayer.current) {
        audioPlayer.current.pause();
        audioPlayer.current.currentTime = 0;
        setIsListening(false); // 手動重置
    }
    
    setIsRecording(true);
    
    try {
      if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
        alert("Your browser does not support Speech Recognition. Please try Chrome browser.");
        setIsRecording(false);
        return;
      }

      const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        console.log("Speech recognition started.");
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log("User transcript:", transcript);
        if (transcript.trim()) {
          setMessages(prev => [...prev, { role: 'user', type: 'text', content: transcript }]);
          generateAIResponse(transcript, 'text');
        } else {
           // 不處理空錄音
        }
        setIsRecording(false);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          alert("Microphone access denied. Please allow microphone permissions in your browser settings.");
        } else if (event.error === 'no-speech') {
           // 不處理 'no-speech'
        } else {
          alert(`Speech recognition error: ${event.error}.`);
        }
        setIsRecording(false);
      };
      
      recognition.onend = () => {
        console.log("Speech recognition ended.");
        setIsRecording(false);
      };

      recognition.start();
    } catch (error) {
      alert('Cannot access microphone. Please ensure microphone permissions are granted and try again.');
      setIsRecording(false);
      console.error('Error starting speech recognition:', error);
    }
  }, [isRecording, isListening, isLoading, generateAIResponse]);

  // --- 畫面渲染 ---

  if (screen === 'home') {
    return (
      <div style={styles.homeScreen}>
        <div style={{ textAlign: 'center', marginTop: '80px' }}>
          <h1 style={styles.title}>English Talk</h1>
          <p style={styles.subtitle}>Learn English with AI Teachers</p>
        </div>
        <div style={{ width: '100%', marginBottom: '40px' }}>
          <button style={{ ...styles.button, ...styles.primaryButton }} onClick={() => setScreen('topic')}>Start Conversation</button>
          <button style={{ ...styles.button, ...styles.secondaryButton }} onClick={() => setScreen('settings')}>Choose Teacher ({teachers[teacher].name})</button>
        </div>
      </div>
    );
  }

  if (screen === 'topic') {
    return (
      <div style={styles.topicScreen}>
        <button style={{ ...styles.button, background: '#3b82f6', color: 'white', marginBottom: '20px' }} onClick={() => setScreen('home')}>Back</button>
        <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '10px' }}>Choose Topic</h2>
        {Object.entries(topics).map(([key, value]) => (
          <div key={key} style={{ ...styles.topicItem, ...(topic === key ? styles.topicItemSelected : {}) }} onClick={() => setTopic(key)}>
            <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{value.name} {value.icon}</div>
            <div style={{ fontSize: '14px', opacity: 0.7 }}>{value.desc}</div>
          </div>
        ))}
        <h2 style={{ fontSize: '28px', fontWeight: 'bold', margin: '30px 0 10px 0' }}>Choose Level</h2>
        {Object.entries(levels).map(([key, value]) => (
          <button key={key} style={{ ...styles.topicItem, ...(level === key ? { background: '#9333ea', color: 'white', border: '2px solid #9333ea' } : {}), width: '100%', textAlign: 'left' }} onClick={() => setLevel(key)}>
            {value.name} ({value.level})
          </button>
        ))}
        <button
          style={{ ...styles.button, ...styles.primaryButton, marginTop: '30px', background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)', color: 'white' }}
          onClick={() => {
            if (topic === 'freeTalk') {
              setFreeTalkOption('ai');
              setUserFile(null);
              setUserText('');
              setScreen('upload');
            } else {
              startChat(null);
            }
          }}
        >
          Start Chat
        </button>
      </div>
    );
  }

  if (screen === 'upload') {
    return (
      <div style={styles.uploadScreen}>
        <button style={{ ...styles.button, background: '#3b82f6', color: 'white', marginBottom: '20px' }} onClick={() => setScreen('topic')}>Back to Topics</button>
        <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '10px' }}>Free Talk Options</h2>
        <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '20px' }}>How would you like to start?</p>

        {/* 選項 1: AI 選擇 */}
        <div 
          style={{ ...styles.uploadOption, ...(freeTalkOption === 'ai' ? styles.uploadOptionSelected : {}) }}
          onClick={() => setFreeTalkOption('ai')}
        >
          <Brain size={24} color={freeTalkOption === 'ai' ? '#3b82f6' : '#6b7280'} />
          <div>
            <h3 style={{ fontWeight: 'bold', fontSize: '18px' }}>Let the teacher choose</h3>
            <p style={{ fontSize: '14px', opacity: 0.7 }}>AI will provide a random image or article.</p>
          </div>
        </div>

        {/* 選項 2: 上傳圖片 */}
        <div 
          style={{ ...styles.uploadOption, ...(freeTalkOption === 'image' ? styles.uploadOptionSelected : {}) }}
          onClick={() => setFreeTalkOption('image')}
        >
          <Image size={24} color={freeTalkOption === 'image' ? '#3b82f6' : '#6b7280'} />
          <div>
            <h3 style={{ fontWeight: 'bold', fontSize: '18px' }}>Upload an image</h3>
            <p style={{ fontSize: '14px', opacity: 0.7 }}>Discuss a picture from your device.</p>
          </div>
        </div>
        {freeTalkOption === 'image' && (
          <div style={styles.uploadInputArea}>
            <input 
              type="file" 
              accept="image/png, image/jpeg, image/webp"
              onChange={(e) => setUserFile(e.target.files[0])}
            />
            {userFile && <p style={{ marginTop: '10px', color: '#16a34a' }}><Check size={16} /> {userFile.name}</p>}
          </div>
        )}

        {/* 選項 3: 貼上文章 */}
        <div 
          style={{ ...styles.uploadOption, ...(freeTalkOption === 'text' ? styles.uploadOptionSelected : {}) }}
          onClick={() => setFreeTalkOption('text')}
        >
          <FileText size={24} color={freeTalkOption === 'text' ? '#3b82f6' : '#6b7280'} />
          <div>
            <h3 style={{ fontWeight: 'bold', fontSize: '18px' }}>Paste an article</h3>
            <p style={{ fontSize: '14px', opacity: 0.7 }}>Discuss a text you provide.</p>
          </div>
        </div>
        {freeTalkOption === 'text' && (
          <div style={styles.uploadInputArea}>
            <textarea
              style={{ width: '100%', minHeight: '100px', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px' }}
              placeholder="Paste your article or text here..."
              value={userText}
              onChange={(e) => setUserText(e.target.value)}
            />
          </div>
        )}

        {/* 確認按鈕 */}
        <button
          style={{ ...styles.button, ...styles.primaryButton, marginTop: '30px', background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)', color: 'white' }}
          onClick={() => {
            if (freeTalkOption === 'ai') {
              startChat(null); // AI 選擇
            } else if (freeTalkOption === 'image') {
              if (userFile) startChat({ type: 'image', file: userFile });
              else alert("Please select an image file.");
            } else if (freeTalkOption === 'text') {
              if (userText) startChat({ type: 'text', content: userText });
              else alert("Please paste some text.");
            }
          }}
          disabled={isLoading}
        >
          {isLoading ? "Starting..." : "Confirm and Start Chat"}
        </button>

      </div>
    );
  }

  if (screen === 'chat') {
    return (
      <div style={styles.chatScreen}>
        <div style={styles.chatHeader}>
          <button style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }} onClick={() => {
            // 停止語音並返回
            if (audioPlayer.current) {
                audioPlayer.current.pause();
                audioPlayer.current = null;
            }
            setIsListening(false);
            setScreen(topic === 'freeTalk' ? 'upload' : 'topic');
          }}>Back</button>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontWeight: 'bold' }}>{topics[topic].name}</h3>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>{levels[level].name}</p>
          </div>
          <img src={teachers[teacher].avatar} alt="teacher" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
        </div>
        
        <div style={styles.chatMessages} ref={chatMessagesRef}>
          {messages.map((msg, idx) => {
            let style, content;
            
            if (msg.role === 'user') {
                if (msg.type === 'image') {
                    style = { ...styles.imageMessage, alignSelf: 'flex-end', borderColor: '#3b82f6' };
                    content = <img src={msg.content} alt="Uploaded by user" style={{ width: '100%', maxWidth: '250px', borderRadius: '8px' }} />;
                } else if (msg.type === 'article') {
                    style = { ...styles.articleMessage, alignSelf: 'flex-end', background: '#3b82f6', color: 'white' };
                    content = msg.content;
                } else {
                    style = styles.userMessage;
                    content = msg.content;
                }
            } else { // assistant
                if (msg.type === 'image') {
                    style = { ...styles.imageMessage, alignSelf: 'flex-start' };
                    content = <img src={msg.content} alt="Provided by AI" style={{ width: '100%', maxWidth: '250px', borderRadius: '8px' }} />;
                } else if (msg.type === 'article') {
                    style = { ...styles.articleMessage, alignSelf: 'flex-start', background: '#fef3c7', color: '#92400e' };
                    content = msg.content;
                } else {
                    style = styles.aiMessage;
                    content = msg.content;
                }
            }
            
            return <div key={idx} style={style}>{content}</div>;
          })}
          {isLoading && <p style={{ textAlign: 'center', color: '#3b82f6', fontWeight: 'bold' }}>Thinking...</p>}
          {isRepeatMode && <p style={{ textAlign: 'center', color: '#ef4444', fontWeight: 'bold' }}>Please try again...</p>}
        </div>

        <div style={styles.chatControls}>
          <button style={{ ...styles.micButton, background: isRecording ? '#ef4444' : '#3b82f6' }} onClick={startRecording} disabled={isRecording || isListening || isLoading}>
            {isRecording ? <MicOff size={40} color="white" /> : <Mic size={40} color="white" />}
          </button>
          <p>{isRecording ? 'Recording...' : isListening ? 'Teacher speaking...' : 'Press microphone to speak'}</p>
          <button style={{ ...styles.button, background: '#e5e7eb', color: '#1f2937', marginTop: '12px' }} onClick={() => {
            if (audioPlayer.current) {
                audioPlayer.current.pause();
                audioPlayer.current = null;
            }
            setMessages([]);
            conversationHistory.current = [];
            setMessageCount(0);
            setIsRepeatMode(false);
            correctAttempts.current = 0;
            setIsListening(false);
            
            if (topic === 'freeTalk') {
              setScreen('upload');
            }
          }}>
            <RotateCcw size={16} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Reset Chat
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'settings') {
    return (
      <div style={styles.topicScreen}>
        <button style={{ ...styles.button, background: '#3b82f6', color: 'white', marginBottom: '20px' }} onClick={() => setScreen('home')}>Back</button>
        <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '10px' }}>Choose Your Teacher</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          {Object.entries(teachers).map(([key, value]) => (
            <button key={key} style={{ ...styles.topicItem, textAlign: 'center', padding: '24px', ...(teacher === key ? { background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)', color: 'white', border: 'none' } : {}) }} onClick={() => setTeacher(key)}>
              <img src={value.avatar} alt={value.name} style={{ width: '80px', height: '80px', borderRadius: '50%', marginBottom: '12px' }} />
              <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{value.name}</div>
              <div style={{ fontSize: '12px', opacity: 0.7 }}>{value.bio}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }
}

export default App;