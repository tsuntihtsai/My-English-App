import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, RotateCcw, Image, FileText, Upload, Brain, Check } from 'lucide-react';

// --- 環境變數 ---
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
// (我們使用 1.5-flash 來避免 503 Overload 錯誤)
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const TTS_API_URL = process.env.REACT_APP_TTS_API_URL || 'http://localhost:3001/api/tts';

// --- 資料定義 (保持不變) ---
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

// --- 樣式定義 (保持不變) ---
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

// --- 輔助函式 (保持不變) ---
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
  const audioPlayer = useRef(null);

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);

  // System Prompt (保持不變，因為 '...' 的指令是對的)
  const getSystemPrompt = useCallback(() => {
    let basePrompt = `You are ${teachers[teacher].name}, an enthusiastic English teacher.
Student level: ${levels[level].name}.
Topic: ${topics[topic].name}.

IMPORTANT: Speak naturally with emotion and personality!
- Use contractions (I'm, don't, can't).
- Add emotional words (wow, amazing, oh, hmm).
- [NEW] Use ellipses (...) to create natural pauses, even in the middle of a sentence, to simulate thinking.
- Show enthusiasm with exclamation marks!
- Ask questions to engage the student.
- Be friendly and encouraging.

Instructions:
1. Speak naturally with feeling.
2. Keep responses to 1-2 sentences.

// 情感標籤指令
IMPORTANT: Based on the sentiment of your response, prefix it with an emotional tag:
- [HAPPY]: Positive, encouraging, or exciting.
- [SAD]: Empathetic, slightly sad, or regretful.
- [NEUTRAL]: Neutral, informative, or pondering.
- [SURPRISE]: Surprising or exclamatory.
- [SERIOUS]: For serious topics, factual explanations, or gentle corrections.
- [STRICT]: When making a firm, direct grammar/wording correction, especially on repeated mistakes.

Example (Natural Pause): "[HAPPY] Wow... that's a fantastic idea! I love your creativity!"
Example (Correction 1 - Kind): "[SERIOUS] Good try! Just a small fix... say 'I *saw* two cats' instead of 'I *see* two cats'. Can you say that again?"

${(level === 'beginner' || level === 'intermediate') && !isRepeatMode ? `
3. Check every sentence for grammar and wording errors.
- If it's a small mistake, be encouraging: "[SERIOUS] Almost there! Just say 'I *am* happy' instead of 'I *is* happy'. Can you try that again?"
- If it's a repeated or more significant mistake, be more firm: "[STRICT] Hmm... that's not quite right. Remember, we say 'He *goes* to the store,' not 'He *go*'. Please try the sentence again."
` : ''}
${isRepeatMode ? `
The student is repeating their sentence. Evaluate if it is now correct (80% accuracy).
If correct, praise them: "[HAPPY] Excellent! You got it right! Now, let's continue..."
If still has errors, encourage them: "[STRICT] Not quite. Listen closely... 'She *doesn't* like coffee'. Try one more time."
` : ''}

// Free Talk 模式 (保持不變)
${topic === 'freeTalk' && messages.length === 0 ? `
SPECIAL INSTRUCTION FOR FREE TALK (Initial Message):
Your behavior depends on the student's first message:

1.  **If the user message is "Initiate Free Talk Session" (AI Choice):**
    You MUST choose ONE of the following options and prefix your response with the exact tag:
    -   Generate Image Prompt: \`[IMAGE_PROMPT]\` (e.g., "[HAPPY][IMAGE_PROMPT]A cozy coffee shop with steam rising from a mug. What do you see in this picture?")
    -   Generate Article Summary: \`[ARTICLE_SUMMARY]\` (e.g., "[HAPPY][ARTICLE_SUMMARY]Did you know... What do you think about that?")

2.  **If the user message contains "image I've uploaded" or "article I've uploaded" (User Choice):**
    -   Acknowledge the content (e.g., "Wow, what a cool picture!" or "Thanks for sharing this article.")
    -   Make one brief observation about it.
    -   Ask an open-ended question to start the discussion.
    Example (Image): "[HAPPY] That's a beautiful photo! It looks like a very peaceful beach. What time of day... do you think it was taken?"
` : ''}
`;
    return basePrompt;
  }, [teacher, level, topic, isRepeatMode, messages.length]);

  // speakText (保持不變)
  const speakText = useCallback(async (text, sentiment = 'NEUTRAL') => {
    if (audioPlayer.current) {
        audioPlayer.current.pause();
        audioPlayer.current.currentTime = 0;
    }
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
                level: level
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`TTS 伺服器錯誤: ${response.status} - ${errorText}`);
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const audio = new Audio(audioUrl);
        audio.volume = 1.0; 
        audioPlayer.current = audio;

        audio.onended = () => {
            setIsListening(false);
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
        setIsListening(false);
    }
  }, [teacher, level]);

  // [!!! 關鍵修改 2 !!!]
  // 修正 generateAIResponse 中的解析 Bug
  const generateAIResponse = useCallback(async (messageContent, messageType = 'text', retryCount = 0) => {
    setIsLoading(true);

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
        if (response.status === 503) {
            throw new Error(`API Error: 503 - The model is overloaded. Please try again later.`);
        }
        throw new Error(`API Error: ${response.status} - ${errorData.error?.message || 'Unknown API error'}`);
      }

      const data = await response.json();

      if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        // 這是從 API 來的原始、"骯髒"的文字
        const rawAiResponse = data.candidates[0].content.parts[0].text;
        
        let sentiment = 'NEUTRAL';
        let speechText = rawAiResponse; // 這是我們要傳送給 TTS (後端) 的文字
        let displayText = rawAiResponse; // 這是我們要顯示在聊天室的文字

        // 1. [修改] 找出*第一個*情感標籤，無論它在哪裡
        const sentimentMatch = rawAiResponse.match(/\[(HAPPY|SAD|NEUTRAL|SURPRISE|SERIOUS|STRICT)\]/i);
        if (sentimentMatch) {
            sentiment = sentimentMatch[1].toUpperCase();
        }

        // 2. [修改] 從「顯示用」和「朗讀用」的文字中，清除*所有*情感標籤
        // 注意：我們保留 `...`，因為後端會處理它
        const cleanRegex = /\[(HAPPY|SAD|NEUTRAL|SURPRISE|SERIOUS|STRICT)\]/gi;
        speechText = speechText.replace(cleanRegex, '');
        displayText = displayText.replace(cleanRegex, '');

        // 3. [修改] 同時也要清理 [IMAGE_PROMPT] 和 [ARTICLE_SUMMARY] 標籤
        const imagePromptMatch = speechText.match(/\[IMAGE_PROMPT\]\s*([\s\S]*)/i);
        const articleSummaryMatch = speechText.match(/\[ARTICLE_SUMMARY\]\s*([\s\S]*)/i);

        if (imagePromptMatch && messages.length === 0) {
            const aiImageDescription = imagePromptMatch[1].trim();
            // 清理顯示和朗讀的文字
            displayText = aiImageDescription;
            speechText = aiImageDescription; 

            const imageUrl = `https://picsum.photos/seed/${encodeURIComponent(aiImageDescription.slice(0, 10))}/300/200`;
            
            setMessages(prev => [...prev, 
                { role: 'assistant', type: 'image', content: imageUrl },
                { role: 'assistant', type: 'text', content: displayText, sentiment: sentiment }
            ]);
            speakText(speechText, sentiment); // 傳送清理過的文字

        } else if (articleSummaryMatch && messages.length === 0) {
            const articleText = articleSummaryMatch[1].trim();
            // 清理顯示和朗讀的文字
            displayText = articleText;
            speechText = articleText;
            
            setMessages(prev => [...prev, { role: 'assistant', type: 'article', content: displayText, sentiment: sentiment }]);
            speakText(speechText, sentiment); // 傳送清理過的文字

        } else {
            // 常規文字回應
            setMessages(prev => [...prev, { role: 'assistant', type: 'text', content: displayText, sentiment: sentiment }]);
            speakText(speechText, sentiment); // 傳送清理過的文字
        }

        // 5. [修改] 儲存「原始」的 AI 回應到歷史紀錄中
        conversationHistory.current.push({
          role: 'model',
          parts: [{ text: rawAiResponse }] // 儲存原始、未清理的文字
        });

        // 檢查是否需要重複 (使用清理過的文字)
        const hasRepeatRequest = displayText.toLowerCase().includes('again') || 
                                 displayText.toLowerCase().includes('repeat') || 
                                 displayText.toLowerCase().includes('try that');
        
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
      setIsLoading(false);
    }
  }, [getSystemPrompt, speakText, level, messages.length]);

  // startChat (保持不變)
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

  // startRecording (保持不變)
  const startRecording = useCallback(async () => {
    if (isRecording || isListening || isLoading) return;
    
    if (audioPlayer.current) {
        audioPlayer.current.pause();
        audioPlayer.current.currentTime = 0;
        setIsListening(false);
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
        }
        setIsRecording(false);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          alert("Microphone access denied. Please allow microphone permissions in your browser settings.");
        } else if (event.error === 'no-speech') {
           // 不處理
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

  // --- 畫面渲染 (保持不變) ---

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

        <button
          style={{ ...styles.button, ...styles.primaryButton, marginTop: '30px', background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)', color: 'white' }}
          onClick={() => {
            if (freeTalkOption === 'ai') {
              startChat(null);
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