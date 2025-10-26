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
        // 這是您必須在 Zeabur "Variables" 中設定的
        const credentials = JSON.parse(process.env.GCP_CREDENTIALS_JSON);
        ttsClient = new TextToSpeechClient({ credentials });
        console.log('TTS Client 成功從 GCP_CREDENTIALS_JSON (環境變數) 初始化。');
    } catch (e) {
        console.error('解析 GCP_CREDENTIALS_JSON 失敗:', e);
        console.error('請檢查 Zeabur 上的環境變數是否為完整的 JSON 內容。');
        process.exit(1); // 啟動失敗
    }
} 
// 檢查本地開發用的 .env 檔案 (GOOGLE_APPLICATION_CREDENTIALS)
else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // 使用檔案路徑初始化 (僅供本地測試)
    ttsClient = new TextToSpeechClient();
    console.log('TTS Client 成功從 GOOGLE_APPLICATION_CREDENTIALS (本地檔案) 初始化。');
} 
// 錯誤
else {
    console.error('錯誤：未找到 Google Cloud 憑證。');
    console.error('請設定 GCP_CREDENTIALS_JSON (用於部署) 或 GOOGLE_APPLICATION_CREDENTIALS (用於本地)。');
    process.exit(1); // 啟動失敗
}
// --- [!!! 部署關鍵結束 !!!] ---


app.use(cors()); // 允許來自 React App (不同網域) 的請求
app.use(express.json()); // 解析 JSON body

/**
 * 根據情緒標籤和性別建立 SSML
 * 這就是實現「真正」情緒的關鍵！
 */
function buildSsml(text, sentiment, voiceGender) {
    let voiceName = 'en-US-Neural2-F'; // 預設: Emma (Female)
    let rate = "1.0";
    let pitch = "0.0st";

    if (voiceGender === 'Male') {
        voiceName = 'en-US-Neural2-D'; // James / Alex (Male)
    }

    switch (sentiment) {
        case 'HAPPY':
            rate = "1.1";   // 語速稍快
            pitch = "+2.0st"; // 音調稍高
            break;
        case 'SAD':
            rate = "0.85";  // 語速慢
            pitch = "-3.0st"; // 音調低
            break;
        case 'SURPRISE':
            rate = "1.2";   // 語速快
            pitch = "+4.0st"; // 音調高
            break;
        case 'SERIOUS':
            rate = "0.9";   // 語速稍慢
            pitch = "-1.0st"; // 音調稍低
            break;
        case 'STRICT':
            rate = "0.8";   // 語速慢 (一字一句)
            pitch = "-2.0st"; // 音調低 (嚴厲)
            break;
        case 'NEUTRAL':
        default:
            // 保持預設
            break;
    }

    // 清理文字中的非法 SSML 字符，避免 API 錯誤
    const escapedText = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/'/g, '&quot;')
        .replace(/'/g, '&apos;');

    return `<speak><prosody rate="${rate}" pitch="${pitch}">${escapedText}</prosody></speak>`;
}

// API 端點：/api/tts
app.post('/api/tts', async (req, res) => {
    try {
        const { text, sentiment, voiceGender } = req.body;

        if (!text || !sentiment || !voiceGender) {
            return res.status(400).send('缺少 text, sentiment 或 voiceGender');
        }

        const ssml = buildSsml(text, sentiment, voiceGender);

        const request = {
            input: { ssml: ssml },
            // 根據性別選擇高品質的 Neural2 語音
            voice: { 
                languageCode: 'en-US', 
                name: (voiceGender === 'Male') ? 'en-US-Neural2-D' : 'en-US-Neural2-F'
            },
            audioConfig: { audioEncoding: 'MP3' },
        };

        // 呼叫 Google TTS API
        const [response] = await ttsClient.synthesizeSpeech(request);
        
        // 將 MP3 音檔回傳給前端
        res.set('Content-Type', 'audio/mpeg');
        res.send(response.audioContent);

    } catch (error) {
        console.error('TTS API 錯誤:', error);
        res.status(500).send('語音合成失敗');
    }
});

// 健康檢查端點：/
// 這是您在瀏覽器中測試後端網址時會看到的
app.get('/', (req, res) => {
    res.send('English Talk TTS Backend is running.');
});

// 啟動伺服器
app.listen(port, () => {
    // 這行訊息應該會出現在您的 Zeabur "Logs" 中
    console.log(`English Talk - 後端語音伺服器正在 http://localhost:${port} 運行`);
});