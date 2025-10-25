import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, Settings, MessageCircle, Volume2, RotateCcw } from 'lucide-react';

// 教師配置 - 使用 DiceBear 生成的頭像
const teachers = {
  teacher1: {
    name: 'Emma',
    color: 'bg-pink-400',
    voice: 'female',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma_Teacher&backgroundColor=ffb6c1&scale=90&mood=happy',
    bio: '英美文化專家'
  },
  teacher2: {
    name: 'James',
    color: 'bg-blue-400',
    voice: 'male',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James_Teacher&backgroundColor=add8e6&scale=90&mood=happy',
    bio: '商務英語教師'
  },
  teacher3: {
    name: 'Sofia',
    color: 'bg-purple-400',
    voice: 'female',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia_Teacher&backgroundColor=dda0dd&scale=90&mood=happy',
    bio: '旅遊英語指導'
  },
  teacher4: {
    name: 'Alex',
    color: 'bg-green-400',
    voice: 'male',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex_Teacher&backgroundColor=90ee90&scale=90&mood=happy',
    bio: '科技英語專家'
  }
};

const topics = {
  business: { name: '商務', icon: '💼', desc: '商業溝通、會議、談判' },
  travel: { name: '旅行', icon: '✈️', desc: '旅遊、預訂、文化交流' },
  news: { name: '新聞', icon: '📰', desc: '時事討論、新聞評論' },
  technology: { name: '科技', icon: '🚀', desc: '科技趨勢、產品討論' }
};

const levels = {
  beginner: { name: '初級', level: 'Beginner' },
  intermediate: { name: '中級', level: 'Intermediate' },
  advanced: { name: '高級', level: 'Advanced' },
  fluent: { name: '流暢', level: 'Fluent' }
};

const EnglishTutorApp = () => {
  const [screen, setScreen] = useState('home');
  const [topic, setTopic] = useState('business');
  const [level, setLevel] = useState('intermediate');
  const [teacher, setTeacher] = useState('teacher1');
  const [messages, setMessages] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [correction, setCorrection] = useState(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // 開始錄音
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        await handleAudioInput();
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('無法訪問麥克風:', error);
      alert('請允許應用訪問麥克風');
    }
  };

  // 停止錄音
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // 處理音頻輸入（語音轉文字）
  const handleAudioInput = async () => {
    setIsListening(true);
    try {
      const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.lang = 'en-US';

      recognition.onresult = async (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');

        if (transcript.trim()) {
          const userMessage = { 
            role: 'user', 
            content: transcript,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, userMessage]);
          await getAIResponse(transcript);
        }
      };

      recognition.onerror = (event) => {
        console.error('語音識別錯誤:', event.error);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (error) {
      console.error('語音處理錯誤:', error);
      setIsListening(false);
    }
  };

  // 獲取AI回應
  const getAIResponse = async (userMessage) => {
    try {
      const mockResponse = await generateResponse(userMessage);
      
      const assistantMessage = {
        role: 'assistant',
        content: mockResponse.reply,
        correction: mockResponse.correction,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setCorrection(mockResponse.correction);
      await speakResponse(mockResponse.reply);
    } catch (error) {
      console.error('獲取回應錯誤:', error);
    }
  };

  // 生成回應（模擬AI）
  const generateResponse = async (userMessage) => {
    const responses = {
      business: [
        { 
          reply: "That's an excellent point! How would you approach this challenge in your organization?",
          correction: null 
        },
        { 
          reply: "I completely agree with you. What strategies do you think would work best?",
          correction: { original: "would work best", suggested: "would be most effective", type: "vocabulary" }
        }
      ],
      travel: [
        { 
          reply: "That sounds amazing! Which destination would you recommend the most?",
          correction: null 
        },
        { 
          reply: "Really? Tell me more about the culture and local attractions there!",
          correction: null 
        }
      ],
      news: [
        { 
          reply: "That's very interesting perspective! What do you think about the future impact?",
          correction: null 
        },
        { 
          reply: "I see your point. How do you think this will affect our society?",
          correction: null 
        }
      ],
      technology: [
        { 
          reply: "Great observation! What's your view on the future of this technology?",
          correction: null 
        },
        { 
          reply: "Absolutely! Do you think this innovation will change our daily lives?",
          correction: null 
        }
      ]
    };

    const topicResponses = responses[topic] || responses.business;
    return topicResponses[Math.floor(Math.random() * topicResponses.length)];
  };

  // 文字轉語音
  const speakResponse = (text) => {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.95;
      utterance.pitch = teachers[teacher].voice === 'female' ? 1.2 : 0.8;
      
      utterance.onend = resolve;
      window.speechSynthesis.speak(utterance);
    });
  };

  // 播放消息的語音
  const playMessageAudio = (message) => {
    setCurrentlyPlaying(message);
    speakResponse(message).then(() => {
      setCurrentlyPlaying(null);
    });
  };

  // Home Screen
  if (screen === 'home') {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex flex-col justify-between p-6">
        <div className="text-center text-white pt-20">
          <div className="text-6xl mb-4">🗣️</div>
          <h1 className="text-4xl font-bold mb-2">English Talk</h1>
          <p className="text-lg opacity-90">用語音自然地練習英文</p>
          <p className="text-sm opacity-75 mt-2">與AI老師進行真實對話</p>
        </div>

        <div className="space-y-4 mb-8">
          <button
            onClick={() => setScreen('topic')}
            className="w-full bg-white text-blue-600 font-bold py-4 rounded-xl hover:bg-gray-100 transition transform hover:scale-105 text-lg"
          >
            🎯 開始對話
          </button>
          <button
            onClick={() => setScreen('settings')}
            className="w-full bg-white/20 text-white font-bold py-4 rounded-xl hover:bg-white/30 transition text-lg"
          >
            ⚙️ 選擇老師
          </button>
        </div>
      </div>
    );
  }

  // Topic & Level Selection Screen
  if (screen === 'topic') {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 pt-12 overflow-y-auto">
        <button
          onClick={() => setScreen('home')}
          className="mb-6 text-blue-600 font-semibold flex items-center"
        >
          ← 返回
        </button>
        
        <h2 className="text-3xl font-bold mb-2">選擇對話主題</h2>
        <p className="text-gray-600 mb-6">選擇一個你想練習的主題</p>

        <div className="space-y-3 mb-8">
          {Object.entries(topics).map(([key, value]) => (
            <button
              key={key}
              onClick={() => setTopic(key)}
              className={`w-full p-4 rounded-xl text-left transition transform hover:scale-105 ${
                topic === key
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white text-gray-800 border-2 border-gray-200'
              }`}
            >
              <div className="text-3xl mb-1">{value.icon}</div>
              <div className="font-bold text-lg">{value.name}</div>
              <div className="text-sm opacity-75">{value.desc}</div>
            </button>
          ))}
        </div>

        <h2 className="text-3xl font-bold mb-4">選擇難度等級</h2>
        <div className="space-y-2 mb-8">
          {Object.entries(levels).map(([key, value]) => (
            <button
              key={key}
              onClick={() => setLevel(key)}
              className={`w-full p-3 rounded-xl text-left transition transform hover:scale-105 font-semibold ${
                level === key
                  ? 'bg-purple-500 text-white shadow-lg'
                  : 'bg-white text-gray-800 border-2 border-gray-200'
              }`}
            >
              {value.name} ({value.level})
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            setMessages([]);
            setScreen('chat');
          }}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-4 rounded-xl hover:opacity-90 transition text-lg"
        >
          開始對話 →
        </button>
      </div>
    );
  }

  // Chat Screen
  if (screen === 'chat') {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b-2 border-gray-200 p-4 flex items-center justify-between sticky top-0">
          <button onClick={() => setScreen('topic')} className="text-blue-600 font-semibold">
            ← 返回
          </button>
          <div className="text-center flex-1">
            <h3 className="font-bold text-lg">{topics[topic].name}</h3>
            <p className="text-xs text-gray-500">{levels[level].name}</p>
          </div>
          <div className="flex items-center gap-2">
            <img 
              src={teachers[teacher].avatar}
              alt={teachers[teacher].name}
              className="w-10 h-10 rounded-full shadow-md border-2 border-white"
            />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 pt-12">
              <div className="text-6xl mb-4">👋</div>
              <p className="text-xl font-semibold mb-2">讓我們開始對話吧！</p>
              <p className="text-sm">按下麥克風按鈕開始說話</p>
              <p className="text-xs opacity-75 mt-2">向 {teachers[teacher].name} 打招呼</p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-xs lg:max-w-md p-4 rounded-2xl shadow-md relative group ${
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-800 border-2 border-gray-200'
                }`}
              >
                <p className="text-sm md:text-base leading-relaxed">{msg.content}</p>
                
                {/* 播放按鈕 */}
                <button
                  onClick={() => playMessageAudio(msg.content)}
                  className={`mt-2 flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    currentlyPlaying === msg.content
                      ? msg.role === 'user'
                        ? 'bg-blue-600'
                        : 'bg-blue-100 text-blue-600'
                      : msg.role === 'user'
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <Volume2 size={14} />
                  {currentlyPlaying === msg.content ? '播放中...' : '🔊'}
                </button>
              </div>
            </div>
          ))}

          {/* 修正建議 */}
          {correction && (
            <div className="bg-yellow-50 border-2 border-yellow-300 p-4 rounded-2xl mx-2 shadow-md">
              <p className="text-sm font-semibold text-yellow-900 mb-2">✏️ 老師的建議</p>
              <p className="text-sm text-yellow-800">
                <span className="line-through opacity-75">{correction.original}</span>
                <span className="ml-2 text-green-700 font-semibold">→ {correction.suggested}</span>
              </p>
            </div>
          )}
        </div>

        {/* 錄音控制 */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 p-6">
          <div className="flex gap-4 justify-center items-center mb-4">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transform transition hover:scale-110 ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {isRecording ? (
                <MicOff size={40} className="text-white" />
              ) : (
                <Mic size={40} className="text-white" />
              )}
            </button>

            {isRecording && (
              <div className="text-red-500 font-semibold animate-pulse">
                🔴 錄音中...
              </div>
            )}

            {isListening && (
              <div className="text-blue-500 font-semibold animate-pulse">
                ✨ 聆聽中...
              </div>
            )}
          </div>

          <div className="text-center text-sm text-gray-600">
            {isRecording ? '按下按鈕停止錄音' : '按下麥克風開始說話'}
          </div>

          <button
            onClick={() => {
              setMessages([]);
              setCorrection(null);
            }}
            className="w-full mt-4 flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg font-semibold transition"
          >
            <RotateCcw size={18} />
            重新開始
          </button>
        </div>
      </div>
    );
  }

  // Settings Screen
  if (screen === 'settings') {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 pt-12 overflow-y-auto">
        <button
          onClick={() => setScreen('home')}
          className="mb-6 text-blue-600 font-semibold flex items-center"
        >
          ← 返回
        </button>

        <h2 className="text-3xl font-bold mb-2">選擇你的老師</h2>
        <p className="text-gray-600 mb-8">每位老師都有獨特的教學風格</p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {Object.entries(teachers).map(([key, value]) => (
            <button
              key={key}
              onClick={() => setTeacher(key)}
              className={`p-6 rounded-2xl text-center transition transform hover:scale-105 ${
                teacher === key
                  ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-800 border-2 border-gray-200 hover:border-blue-300'
              }`}
            >
              <img 
                src={value.avatar}
                alt={value.name}
                className={`w-20 h-20 rounded-full mx-auto mb-3 shadow-md border-2 ${
                  teacher === key ? 'border-white' : 'border-gray-300'
                }`}
              />
              <div className="font-bold text-lg">{value.name}</div>
              <div className="text-xs opacity-75 mt-1">{value.bio}</div>
            </button>
          ))}
        </div>

        <div className="bg-blue-50 border-2 border-blue-300 p-4 rounded-2xl">
          <p className="text-sm text-blue-900 font-semibold">✨ 小提示</p>
          <p className="text-sm text-blue-800 mt-2">不同的老師會根據主題提供不同的對話風格和語調。試試看你最喜歡哪一位！</p>
        </div>
      </div>
    );
  }
};

export default EnglishTutorApp;