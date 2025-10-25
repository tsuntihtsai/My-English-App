require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { TextToSpeechClient } = require('@google-cloud/text-to-speech');

const app = express();
const port = process.env.PORT || 3001; // Zeabur 會自動設定 PORT

// --- [!!! 部署關鍵 !!!] ---
// 初始化 Google TTS Client
let ttsClient;

// 檢查 Zeabur 上的環境變數 (GCP_CREDENTIALS_JSON)
if (process.env.GCP_CREDENTIALS_JSON) {
    try {
        // 從環境變數中解析 JSON 字串
        const credentials = JSON.parse(process.env.GCP_CREDENTIALS_JSON);
        ttsClient = new TextToSpeechClient({ credentials });
        console.log('TTS Client 成功從 GCP_CREDENTIALS_JSON (環境變數) 初始化。');
    } catch (e) {
        console.error('解析 GCP_CREDENTIALS_JSON 失敗:', e);
        process.exit(1);
    }
} 
// 檢查本地開發用的 .env 檔案 (GOOGLE_APPLICATION_CREDENTIALS)
else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // 使用檔案路徑初始化
    ttsClient = new TextToSpeechClient();
    console.log('TTS Client 成功從 GOOGLE_APPLICATION_CREDENTIALS (本地檔案) 初始化。');
} 
// 錯誤
else {
    console.error('錯誤：未找到 Google Cloud 憑證。');
    console.error('請設定 GCP_CREDENTIALS_JSON (用於部署) 或 GOOGLE_APPLICATION_CREDENTIALS (用於本地)。');
    process.exit(1);
}
// --- [!!! 部署關鍵結束 !!!] ---


app.use(cors()); // 允許來自 React App (不同網域) 的請求
app.use(express.json());

// 根據情緒標籤和性別建立 SSML
function buildSsml(text, sentiment, voiceGender) {
    let voiceName = 'en-US-Neural2-F'; // 預設: Emma (Female)
    let rate = "1.0";
    let pitch = "0.0st";

    if (voiceGender === 'Male') {
        voiceName = 'en-US-Neural2-D'; // James / Alex (Male)
    }

    switch (sentiment) {
        case 'HAPPY':
            rate = "1.1";
            pitch = "+2.0st";
            break;
        case 'SAD':
            rate = "0.85";
            pitch = "-3.0st";
            break;
        case 'SURPRISE':
            rate = "1.2";
            pitch = "+4.0st";
            break;
        case 'SERIOUS':
            rate = "0.9";
            pitch = "-1.0st";
            break;
        case 'STRICT':
            rate = "0.8";
            pitch = "-2.0st";
            break;
        case 'NEUTRAL':
        default:
            break;
    }

    // 清理文字中的非法 SSML 字符
    const escapedText = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

    return `<speak><prosody rate="${rate}" pitch="${pitch}">${escapedText}</prosody></speak>`;
}

// API 端點
app.post('/api/tts', async (req, res) => {
    try {
        const { text, sentiment, voiceGender } = req.body;

        if (!text || !sentiment || !voiceGender) {
            return res.status(400).send('缺少 text, sentiment 或 voiceGender');
        }

        const ssml = buildSsml(text, sentiment, voiceGender);

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

// 健康檢查端點 (Zeabur 可能需要)
app.get('/', (req, res) => {
    res.send('English Talk TTS Backend is running.');
});

app.listen(port, () => {
    console.log(`English Talk - 後端語音伺服器正在 http://localhost:${port} 運行`);
});