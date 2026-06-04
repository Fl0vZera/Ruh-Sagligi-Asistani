# Ruh-Sagligi-Asistani
# RuhSağlığı Yardımcısı — Akıllı Triyaj ve Yönlendirme Asistanı
RuhSağlığı Yardımcısı, kullanıcıların bildirdiği psikolojik veya duygusal belirtileri doğal bir sohbet akışı içerisinde etik kurallara uyarak analiz eden ve onları en doğru ilk başvuru noktasına (Klinik Psikolog, Psikiyatrist veya Acil Değerlendirme) yönlendiren yapay zeka destekli bir asistan yazılımıdır.
# ÖNEMLİ YASAL UYARI: Bu uygulama kesinlikle tıbbi bir teşhis/tanı koyma aracı değildir. Sadece ön bilgilendirme amaçlı bir triyaj (ön değerlendirme) algoritmasıdır.
# Öne Çıkan Özellikler
Doğal ve Güvenli Sohbet: Kullanıcıyı soru yağmuruna tutmadan; şikayetlerini, süresini, şiddetini ve geçmiş tedavi öyküsünü yumuşak bir dille sorgular.
Akıllı Arka Plan Takibi: Sohbet esnasında geçen anahtar kelimeleri analiz ederek Uyku Düzeni, İştah Değişimi, Enerji Seviyesi ve Tedavi Geçmişi gibi bulguları otomatik olarak arka planda işaretler.
Kırımızı Bayrak (Kritik Risk) Denetimi: İntihar düşüncesi, halüsinasyon, mani belirtileri veya kendine/başkalarına zarar verme şüphesi algıladığı an otomatik olarak Yüksek Risk uyarısı vererek kullanıcıyı Acil Değerlendirme'ye yönlendirir.
Gelişmiş Triyaj Raporu: Görüşme yeterli olgunluğa ulaştığında ya da kullanıcı talep ettiğinde; bulgu özetini, risk seviyesini, önerilen ilk başvuru noktasını ve yasal gerekçesini içeren görsel bir rapor oluşturur.
Resmi Sağlık Entegrasyonları: Rapor sonrasında kullanıcının doğrudan randevu alabilmesi için MHRS (Merkezi Hekim Randevu Sistemi), e-Nabız ve yetkin uzmanlara ulaşabilmesi için Türk Psikologlar Derneği (TPD) bağlantılarını dinamik olarak sunar.
Geometric Balance Teması: Temiz, göz yormayan, modern geometrik detaylar ve yüksek kontrastlı şık bir arayüz.
# Teknoloji Yığıtı (Tech Stack)
Uygulama, hem hızlı bir web önizlemesi hem de lokalde çalıştırılmak üzere iki yönlü bir altyapıyla geliştirilmiştir:
Geliştirme / Canlı Önizleme Ortamı:
Frontend: React 18+, Vite, Tailwind CSS, Lucide-React, Motion (Framer)
Backend: Node.js / Express (Gemini API Entegrasyonu)
Yapay Zeka: Google Gemini API
Lokal Üretim & Dağıtım Ortamı (/python-reference altında):
Frontend: Next.js (TypeScript & Tailwind CSS)
Backend: FastAPI (Python 3.9+)
Yapay Zeka: OpenAI API (GPT-4o-mini şablonu) ve alternatif Claude desteği
# Proje Klasör Yapısı
code
Text
├── python-reference/
│   ├── fastapi_backend/
│   │   ├── main.py              # FastAPI Web Sunucusu (Etik kurallar ve OpenAI entegrasyonu)
│   │   └── requirements.txt     # Python kütüphaneleri (FastAPI, Uvicorn, OpenAI)
│   ├── nextjs_frontend/
│   │   └── Chatbot.tsx          # Next.js ile tasarlanmış modern arayüz bileşeni
│   └── README.md                # Python/Next.js kurulum kılavuzu
│
├── src/                         # Canlı önizleme kaynak kodları
│   ├── App.tsx                  # Ana React arayüzü ve algoritma akış denetimi
│   ├── main.tsx
│   └── index.css                # Global Tailwind CSS ve yazı tipi ayarları
├── server.ts                    # Canlı önizleme için Express API katmanı
├── package.json
└── README.md
# Kurulum ve Lokal Çalıştırma (Python & Next.js)
Lokal bilgisayarınızda FastAPI ve Next.js tabanlı sistemi ayağa kaldırmak için aşağıdaki adımları takip edebilirsiniz:
1. Python FastAPI Backend Kurulumu:
code
Bash
cd python-reference/fastapi_backend
python -m venv venv
source venv/bin/activate       # Windows için: venv\Scripts\activate
pip install -r requirements.txt
.env dosyası oluşturup API anahtarınızı tanımlayın:
code
Env
OPENAI_API_KEY=your_openai_api_key
Sunucuyu başlatın:
code
Bash
uvicorn main:app --reload --port 8000
2. Next.js Frontend Kurulumu:
code
Bash
cd ../nextjs_frontend
npm install
npm install lucide-react
npm run dev
Uygulama http://localhost:3000 adresinde, backend ise http://localhost:8000 adresinde servis vermeye başlayacaktır.
# Etik Sınırlar ve Kurallar
Bu proje geliştirilirken yapay zekaya uygulanan katı klinik sınırlar:
Asla Tanı Koyulmaz: DSM test sonuçlarını veya belirtileri doğrudan "depresyon hastasısınız" vb. şeklinde klinik bir hastalığa indirgemez.
Tanısal Olmayan Dil Kullanımı: Şikayetleri yalnızca olasılıklar düzeyinde değerlendirir ("belirtileriniz orta düzey kaygı seviyesine işaret ediyor olabilir").
Doğrudan Yönlendirme: İntihar veya kendine zarar verme gibi durumlar tespit edildiği an önceliği derhal 112 Acil Yardım hattına yönlendirmek olarak belirler.
# Geliştirici: KUTAY SÖNMEZ
Ruh sağlığında etik yapay zeka entegrasyonları için geliştirilmiştir.
