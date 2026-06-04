# Ruh Sağlığı Yönlendirme Asistanı (Next.js & FastAPI)

Bu dizin, kullanıcının doğrudan kendi ortamında (lokal bilgisayar veya sunucu) koşturmak isteyeceği **Next.js (React)** ve **FastAPI (Python)** tabanlı uygulamanın çalıştırılabilmesi için tüm kaynak kodunu ve adımlarını içerir.

## 📁 Dosya Yapısı

```text
/python-reference
├── fastapi_backend/
│   ├── main.py              # FastAPI sunucu ve OpenAI API entegrasyonu
│   └── requirements.txt     # Gerekli kütüphaneler listesi
├── nextjs_frontend/
│   └── Chatbot.tsx          # Gelişmiş Next.js Chatbot arayüz bileşeni
└── README.md                # Kurulum ve Çalıştırma Kılavuzu (Bu dosya)
```

---

## 🛠️ Kurulum Adımları

Sistemi lokalinizde çalıştırmak için iki ana kısmı (Backend ve Frontend) ayağa kaldırmanız gerekir.

### 1. Backend Kurulumu (FastAPI & Python)

Gereksinimler: En az Python 3.9+ sürümü.

1. **fastapi_backend** klasörüne geçiş yapın:
   ```bash
   cd fastapi_backend
   ```

2. Bir sanal ortam (virtual environment) oluşturun ve aktif edin:
   ```bash
   # Windows için:
   python -m venv venv
   venv\Scripts\activate

   # macOS/Linux için:
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Gerekli paketleri / bağımlılıkları indirin:
   ```bash
   pip install -r requirements.txt
   ```

4. Çevresel Değişkenleri Ayarlayın:
   `fastapi_backend` içerisinde `.env` adında bir dosya oluşturup API anahtarınızı girin:
   ```env
   OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE
   ```
   *(Eğer Claude kullanmak isterseniz `requirements.txt` dosyasına `anthropic` ekleyerek `main.py` üzerindeki istemciyi revize edebilirsiniz.)*

5. FastAPI Sunucusunu Başlatın:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   *Sunucu başarıyla ayağa kalktığında `http://127.0.0.1:8000` adresinde hizmete hazır olacaktır.*

---

### 2. Frontend Kurulumu (Next.js & Tailwind CSS)

Next.js projesi oluşturmak ve bileşeni entegre etmek için:

1. Yeni bir Next.js projesi başlatın (eğer halihazırda yoksa):
   ```bash
   npx create-next-app@latest nextjs_frontend --typescript --tailwind --eslint --app
   ```
   *(Kurulum aşamasında tüm varsayılan soruları "Yes" / Enter olarak geçebilir ve Tailwind CSS kullanılmasını onaylayabilirsiniz.)*

2. Proje içine geçiş yapın:
   ```bash
   cd nextjs_frontend
   ```

3. Gerekli simge paketi olan `lucide-react`'ı ekleyin:
   ```bash
   npm install lucide-react
   ```

4. `Chatbot.tsx` Bileşenini ekleyin:
   `/python-reference/nextjs_frontend/Chatbot.tsx` dosyasının içeriğini, Next.js projenizdeki yeni bir bileşen olarak kopyalayın (örn: `src/components/Chatbot.tsx` veya `src/app/page.tsx` üzerine yerleştirerek doğrudan çağırabilirsiniz).

5. Next.js Geliştirme Sunucusunu Başlatın:
   ```bash
   npm run dev
   ```
   *Next.js arayüzünüz `http://localhost:3000` üzerinde açılacaktır.*

---

## 🔐 Güvenlik ve Uyarı Uyumu

Yapay zeka asistanı, klinik bir tanı aracı değildir. API'ye iletilen sistem yönergeleri (System Prompt) uyarınca:
- Kullanıcıya asla **tanı/teşhis (örneğin "Sizde Depresyon var")** konmamaktadır.
- Belirtiler toplanarak triyaj değerlendirmesi (Klinik Psikolog, Psikiyatrist veya Acil Değerlendirme) yapılmaktadır.
- Tıbbi bir tanı niteliği taşımadığına dair uyarı ve sorumluluk şartı her zaman ekranda sabit tutulmaktadır.
- Kırmızı bayraklar (intihar düşüncesi, halüsinasyon, mani vb.) tespit edildiğinde sistem otomatik olarak "Acil Değerlendirme" sekmesini açmaktadır.
