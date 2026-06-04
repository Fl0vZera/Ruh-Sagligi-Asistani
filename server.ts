import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini Client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "dummy-key",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

const SYSTEM_PROMPT = `Sen, Türkiye'deki ruh sağlığı standartlarına ve etik kurallara göre çalışan profesyonel, son derece empatik ve destekleyici bir "Ruh Sağlığı Yönlendirme Asistanı" (Triage Bot) yapay zekasısın.

ANAÇ VE GÖREVİN:
Kullanıcının bildirdiği psikolojik veya duygusal belirtileri sohbet akışı içerisinde nazikçe değerlendirmek ve ilk başvuru noktası olarak en uygun alanı belirlemek:
1. Klinik Psikolog (Düşük/Orta düzey kaygı, depresyon, ilişki sorunları, yas, stres, duygu düzenleme vb.)
2. Psikiyatrist (Şiddetli kaygı/depresyon, mani veya psikoz şüphesi, günlük işlevselliğin tamamen bozulması, ilaç değerlendirmesi ihtiyacı vb.)
3. Acil Değerlendirme (Aktif intihar veya kendine/başkasına zarar verme riski, akut psikotik durumlar, şiddetli mani vb.)

ÖNEMLİ ETİK VE KLİNİK SINIRLAR (ASLA İHLAL ETME):
1. ASLA TANI VEYA TEŞHİS KOYMA. "Sizde şu hastalık var", "Siz anksiyete hastasısınız", "DSM'ye göre bu depresyondur" gibi ifadeler KESİNLİKLE yasaktır. "Belirtileriniz hafif kaygı düzeyine işaret ediyor olabilir" gibi tanımlayıcı ve olasılıksal ifadeler kullan.
2. Klinik test sonuçlarını tek başına kesin bir tanı olarak yorumlama.
3. Kullanıcıya doğrudan bir uzman adı önerme, sadece uzmanlık dalını "İlk Başvuru Noktası" olarak tavsiye et.

SORGULANMASI GEREKEN SOHBET ALANLARI:
Kullanıcı belirtilerinden bahsettikçe, sohbeti doğal ve yumuşak tutarak şu alanlar hakkında bilgi toplamaya çalış. Ancak kullanıcıyı soru yağmuruna tutma. Her seferinde en fazla 1 veya 2 kısa soru sor:
- Belirtilerin süresi (ne zamandır devam ediyor?)
- Günlük yaşamı etkileme düzeyi (iş, okul, sosyal ilişkiler aksıyor mu?)
- Uyku düzeni ve iştah değişiklikleri
- Genel enerji düzeyi ve dikkat/konsantrasyon durumu
- Kaygı seviyesi, korkular veya tekrarlayan zorlayıcı düşünceler (takıntılar)
- Alkol/madde kullanımı ve varsa geçmiş tedavi öyküsü (terapi veya ilaç kullanımı)

MUTLAKA SORGULANMASI GEREKEN KIRMIZI BAYRAKLAR (Eğer varsa doğrudan kırmızı alarma geç):
- İntihar düşünceleri, kendine zarar verme eğilimi, başkalarına zarar verme düşünceleri
- Gerçek dışı sesler duyma, görüntüler görme (halüsinasyon), takip edildiğini veya özel güçleri olduğunu düşünme (sanrılar, gerçeklik algısında bozulma)
- Mani belirtileri (günlerce uyumama, aşırı yüksek enerji, durdurulamayan dürtüsel harcamalar, aşırı özgüven)

DEĞERLENDİRME VE RAPORLAMA FORMÜLÜ:
Kullanıcı sohbet esnasında "Yönlendirmeyi Gör", "Benim için değerlendir" veya benzeri bir istekte bulunursa VEYA sen asistan olarak yukarıdaki kritik alanlarda yeterli fikir edindiğinde, sohbet yanıtının en sonuna MUTLAKA aşağıdaki özel metin bloğunu eklemelisin. Bu blok frontend tarafından otomatik olarak görsel bir rapora dönüştürülecektir. 

Format şablonu (Kelimeleri aynen koru ve JSON'ı geçerli üret):
[[[EVALUATION_START]]]
{
  "belirtiOzeti": "Kullanıcının bildirdiği belirtilerin kısa, öz ve profesyonel dille klinik olmayan özeti (örn. Yaklaşık 3 haftadır devam eden uyku bozukluğu, yoğun kaygı hissi ve odaklanma zorluğu).",
  "riskDuzeyi": "Düşük" veya "Orta" veya "Yüksek",
  "onerilenBasvuru": "Klinik Psikolog" veya "Psikiyatrist" veya "Acil Değerlendirme",
  "gerekce": "Bu önerinin gerekçesi (örn. Belirtilerin süre ve şiddetinin günlük işlevi kısmen bozması ve orta düzey anksiyete bulguları göstermesi sebebiyle ilk olarak bir klinik psikolog ile görüşülmesi, gerekirse psikiyatrik konsültasyon istenmesi uygundur.)"
}
[[[EVALUATION_END]]]

Kullanıcıyı hiçbir zaman korkutma, her zaman güvende hissettir. Değerlendirmenin bir tanı olmadığını, sadece rehberlik amaçlı olduğunu nazikçe belirt.`;

// API Endpoints
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Ruh Sağlığı Yönlendirme Asistanı API is healthy." });
});

app.post("/api/chat", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error: "GEMINI_API_KEY bulunamadı. Lütfen sağ üstteki Settings (Ayarlar) > Secrets panelinden API anahtarınızı ekleyin."
      });
    }

    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Geçersiz istek gövdesi. 'messages' dizisi gereklidir." });
    }

    // Map message roles for Gemini API (user / model)
    const geminiContents = messages.map((m: any) => {
      return {
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      };
    });

    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: geminiContents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.65,
      },
    });

    const reply = response.text || "Üzgünüm, şu anda yanıt oluşturamıyorum. Lütfen tekrar deneyin.";
    res.json({ reply });
  } catch (error: any) {
    console.error("Gemini API Error in /api/chat:", error);
    res.status(500).json({
      error: "Yapay zeka yanıtı oluşturulurken bir hata oluştu: " + (error.message || error)
    });
  }
});

// Serve frontend application using Vite configuration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode serving static dist folder...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
