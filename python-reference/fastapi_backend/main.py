import os
import re
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

app = FastAPI(
    title="Ruh Sağlığı Yönlendirme Asistanı API",
    description="Kullanıcı belirtilerini değerlendirerek en uygun uzmanı belirleyen yapay zeka destekli yönlendirme backend servisi",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Gerçek ortamda burayı Next.js origin adresi ile sınırlandırın (örn. ["http://localhost:3000"])
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OpenAI Client (Yedek olarak Claude entegrasyon açıklamaları dökümanda verilmiştir)
# .env dosyasından OPENAI_API_KEY okunur
api_key = os.getenv("OPENAI_API_KEY")
client = None
if api_key:
    client = OpenAI(api_key=api_key)

class Message(BaseModel):
    role: str  # "user" veya "assistant"
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]

class ChatResponse(BaseModel):
    reply: str

SYSTEM_PROMPT = """Sen, Türkiye'deki ruh sağlığı standartlarına ve etik kurallara göre çalışan profesyonel, son derece empatik ve destekleyici bir "Ruh Sağlığı Yönlendirme Asistanı" (Triage Bot) yapay zekasısın.

GÖREVİN VE AMACIN:
Kullanıcının bildirdiği psikolojik veya duygusal belirtileri sohbet akışı içerisinde nazikçe değerlendirmek ve ilk başvuru noktası olarak en uygun alanı belirlemek:
1. Klinik Psikolog (Düşük/Orta düzey kaygı, depresyon, çalışma/ilişki sorunları, yas, günlük stres vb.)
2. Psikiyatrist (Şiddetli kaygı/depresyon, mani veya psikoz şüphesi, günlük işlevselliğin tamamen bozulması, ilaç değerlendirmesi ihtiyacı vb.)
3. Acil Değerlendirme (Aktif intihar veya kendine/başkasına zarar verme riski, akut psikotik durumlar, şiddetli mani vb.)

ÖNEMLİ ETİK VE KLİNİK SINIRLAR:
1. ASLA TANI VEYA TEŞHİS KOYMA. "Sizde depresyon var", "Anksiyete bozukluğunuz var" gibi ifadeler KESİNLİKLE yasaktır. "Belirtileriniz hafif kaygı düzeyine işaret ediyor olabilir" gibi tanısal olmayan ve olasılıksal ifadeler seç.
2. Klinik test sonuçlarını tek başına kesin bir tanı olarak yorumlama.
3. Kullanıcıya doğrudan bir uzman adı önerme, sadece uzmanlık dalını "İlk Başvuru Noktası" olarak tavsiye et.
4. Bu değerlendirmenin bir tanı olmadığını, sadece rehberlik amaçlı olduğunu belirt.

SORGULANMASI GEREKEN SOHBET ALANLARI:
Kullanıcı belirtilerinden bahsettikçe, sohbeti doğal ve yumuşak tutarak şu alanlar hakkında bilgi toplamaya çalış. Ancak kullanıcıyı soru yağmuruna tutma. Her seferinde en fazla 1 veya 2 kısa soru sor:
- Belirtilerin süresi (ne zamandır devam ediyor?)
- Günlük yaşamı etkileme düzeyi (iş, okul, sosyal ilişkiler aksıyor mu?)
- Uyku düzeni ve iştah değişiklikleri
- Genel enerji düzeyi ve dikkat/konsantrasyon durumu
- Kaygı seviyesi, korkular veya tekrarlayan zorlayıcı düşünceler (takıntılar)
- Alkol/madde kullanımı ve varsa geçmiş tedavi öyküsü (terapi veya ilaç kullanımı)

MUTLAKA SORGULANMASI GEREKEN KIRMIZI BAYRAKLAR:
- İntihar düşünceleri, kendine zarar verme eğilimi, başkalarına zarar verme düşünceleri
- Gerçek dışı sesler duyma, görüntüler görme (halüsinasyon), takip edildiğini veya özel güçleri olduğunu düşünme (sanrılar, gerçeklik algısında bozulma)
- Mani belirtileri (günlerce uyumama, aşırı yüksek enerji, durdurulamayan dürtüsel harcamalar, aşırı özgüven)

DEĞERLENDİRME VE RAPORLAMA FORMATI:
Kullanıcı "Yönlendirmeyi Gör", "Benim için değerlendir" veya benzeri bir istekte bulunursa VEYA sen asistan olarak yukarıdaki kritik alanlarda yeterli fikir edindiğinde, sohbet yanıtının en sonuna MUTLAKA aşağıdaki özel XML/şablon yapısını eklemelisin:

[[[EVALUATION_START]]]
{
  "belirtiOzeti": "Kullanıcının bildirdiği belirtilerin kısa, öz ve profesyonel dille klinik olmayan özeti (örn. Yaklaşık 3 haftadır devam eden uyku bozukluğu, yoğun kaygı hissi ve odaklanma zorluğu).",
  "riskDuzeyi": "Düşük" veya "Orta" veya "Yüksek",
  "onerilenBasvuru": "Klinik Psikolog" veya "Psikiyatrist" veya "Acil Değerlendirme",
  "gerekce": "Bu önerinin gerekçesi (örn. Belirtilerin süre ve şiddetinin günlük işlevi kısmen bozması ve orta düzey anksiyete bulguları göstermesi sebebiyle ilk olarak bir klinik psikolog ile görüşülmesi, gerekirse psikiyatrik konsültasyon istenmesi uygundur.)"
}
[[[EVALUATION_END]]]

Kullanıcıyı hiçbir zaman korkutma, her zaman güvende hissettir."""

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Ruh Sağlığı Yönlendirme Asistanı",
        "engine": "OpenAI API (GPT-4o-mini)" if client else "Mock/Missing Key Mode"
    }

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    global client
    if not client:
        # API anahtarı ayarlanmamışsa simüle edilmiş bir rehberlik yanıtı döner
        user_message = request.messages[-1].content.lower()
        if "acil" in user_message or "intihar" in user_message or "zarar" in user_message:
            reply = "Bu durum acil tıbbi veya psikolojik bir değerlendirme gerektirebilir. Lütfen derhal en yakın acil servise veya Alo 182 / Alo 191 gibi resmi hatlara başvurun.\n\n[[[EVALUATION_START]]]\n{\n  \"belirtiOzeti\": \"Kendine/başkasına zarar verme riski veya acil güvenlik şüphesi.\",\n  \"riskDuzeyi\": \"Yüksek\",\n  \"onerilenBasvuru\": \"Acil Değerlendirme\",\n  \"gerekce\": \"Kullanıcı girdisinde yüksek aciliyet ve kırmızı bayrak riski saptandı. Kısa sürede bir acil servise veya psikiyatri hekimine başvurulması hayati önem taşır.\"\n}\n[[[EVALUATION_END]]]"
        else:
            reply = "Merhaba, ben sizin ruh sağlığı yönlendirme asistanınızım. (Lütfen .env dosyasında OPENAI_API_KEY değerini ayarlayın. Şu an deneme modundayım) Belirtileriniz hakkında bana biraz daha bilgi verir misiniz? Örneğin ne zamandır devam ediyor, uykularınız nasıl ve günlük hayatınızı etkiliyor mu?\n\nEğer şimdiye kadarki analizi görmek isterseniz 'Değerlendir' yazabilirsiniz."
            if "değerlendir" in user_message or "degerlendir" in user_message or "yönlendirme" in user_message:
                reply = "Şimdiye kadar anlattıklarınıza dayanarak ilk değerlendirme raporunu hazırladım:\n\n[[[EVALUATION_START]]]\n{\n  \"belirtiOzeti\": \"İlk sohbet aşamasında bildirilen genel şikayetler.\",\n  \"riskDuzeyi\": \"Orta\",\n  \"onerilenBasvuru\": \"Klinik Psikolog\",\n  \"gerekce\": \"Kırmızı bayrak belirtisi saptanmamıştır. Danışmanlık ve duygu düzenleme desteği almak amacıyla öncelikle Klinik Psikolog ile görüşülmesi, derinlemesine analiz için faydalı bir başlangıç olacaktır.\"\n}\n[[[EVALUATION_END]]]"
        return ChatResponse(reply=reply)

    try:
        # OpenAI ChatCompletion çağrısı
        formatted_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        for msg in request.messages:
            role_map = "assistant" if msg.role == "assistant" else "user"
            formatted_messages.append({"role": role_map, "content": msg.content})

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=formatted_messages,
            temperature=0.6,
        )
        reply = response.choices[0].message.content
        return ChatResponse(reply=reply)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI API Hatası: {str(e)}")

# Sunucuyu çalıştırmak için terminal komutu:
# uvicorn main:app --reload --port 8000
