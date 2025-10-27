require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { TextToSpeechClient } = require('@google-cloud/text-to-speech');

const app = express();
const port = process.env.PORT || 3001;

// --- [部署關鍵] ---
let ttsClient;

if (process.env.GCP_CREDENTIALS_JSON) {
    try {
        const credentials = JSON.parse(process.env.GCP_CREDENTIALS_JSON);
        ttsClient = new TextToSpeechClient({ credentials });
        console.log('TTS Client 成功從 GCP_CREDENTIALS_JSON (環境變數) 初始化。');
    } catch (e) {
        console.error('解析 GCP_CREDENTIALS_JSON 失敗:', e);
        console.error('請檢查 Zeabur 上的環境變數是否為完整的 JSON 內容。');
        process.exit(1);
    }
} 
else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    ttsClient = new TextToSpeechClient();
    console.log('TTS Client 成功從 GOOGLE_APPLICATION_CREDENTIALS (本地檔案) 初始化。');
} 
else {
    console.error('錯誤：未找到 Google Cloud 憑證。');
    console.error('請設定 GCP_CREDENTIALS_JSON (用於部署) 或 GOOGLE_APPLICATION_CREDENTIALS (用於本地)。');
    process.exit(1);
}
// --- [部署關鍵結束] ---


app.use(cors());
app.use(express.json());

/**
 * [!!! 關鍵修改 2 !!!]
 * 使用相對停頓 (strength) 來取代固定時間 (time)
 */
function buildSsml(text, sentiment, voiceGender, level = 'intermediate') {
    let voiceName = (voiceGender === 'Male') ? 'en-US-Neural2-D' : 'en-US-Neural2-F';

    // 1. 設定基礎語速 (根據 Level)
    let baseRate = 1.0;
    if (level === 'beginner') {
        baseRate = 0.85; // 初級: 速度 0.85x
    } else if (level === 'intermediate') {
        baseRate = 0.95; // 中級: 速度 0.95x
    }

    // 2. 設定情緒調節
    let rateModifier = 1.0;
    let pitch = "0.0st";

    switch (sentiment) {
        case 'HAPPY':
            rateModifier = 1.1;
            pitch = "+2.0st";
            break;
        case 'SAD':
            rateModifier = 0.9;
            pitch = "-3.0st";
            break;
        case 'SURPRISE':
            rateModifier = 1.15;
            pitch = "+4.0st";
            break;
        case 'SERIOUS':
            rateModifier = 0.95;
            pitch = "-1.0st";
            break;
        case 'STRICT':
            rateModifier = 0.9;
            pitch = "-2.0st";
            break;
        case 'NEUTRAL':
        default:
            break;
    }
    
    const finalRate = (baseRate * rateModifier).toFixed(2);

    // 4. [修改] 處理文字並插入停頓 (斷句)
    let ssmlText = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

    // 5. [修改] 使用 strength 標籤 (更自然)
    // 順序很重要：先處理最長的 '...'，再處理單個標點
    ssmlText = ssmlText
        // 刪節號 (AI 老師的思考停頓): 中等停頓
        .replace(/\.\.\./g, ' <break strength="medium"/>')
        // 句號、問號、驚嘆號: 中等停頓 (換氣)
        .replace(/\./g, ' <break strength="medium"/>')
        .replace(/\?/g, ' <break strength="medium"/>')
        .replace(/!/g, ' <break strength="medium"/>')
        // 逗號: 弱停頓 (短暫換氣)
        .replace(/,/g, ' <break strength="weak"/>');

    // 6. 返回最終的 SSML
    return `<speak><prosody rate="${finalRate}" pitch="${pitch}">${ssmlText}</prosody></speak>`;
}


// API 端點：/api/tts (保持不變)
app.post('/api/tts', async (req, res) => {
    try {
        const { text, sentiment, voiceGender, level } = req.body;

        if (!text || !sentiment || !voiceGender) {
            return res.status(400).send('缺少 text, sentiment 或 voiceGender');
        }

        const ssml = buildSsml(text, sentiment, voiceGender, level);

        const request = {
            input: { ssml: ssml },
            voice: { 
                languageCode: 'en-US', 
                name: (voiceGender === 'Male') ? 'en-US-Neural2-D' : 'en-US-Neural2-F'
            },
            audioConfig: { audioEncoding: 'MP3' },
        };

        const [response] = await ttsClient.synthesizeSpeech(request);
        
        res.set('Content-Type', 'audio/mpeg');
        res.send(response.audioContent);

    } catch (error) {
        console.error('TTS API 錯誤:', error);
        res.status(500).send('語音合成失敗');
    }
});

// 健康檢查端點：/ (保持不變)
app.get('/', (req, res) => {
    res.send('English Talk TTS Backend is running.');
});

// 啟動伺服器 (保持不變)
app.listen(port, () => {
    console.log(`English Talk - 後端語音伺服器正在 http://localhost:${port} 運行`);
});