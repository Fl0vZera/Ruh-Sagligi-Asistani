# Ruh Sağlığı Yardımcısı: Yapay Zeka Tabanlı Ön Değerlendirme (Triage) Prototipi

Ruh sağlığı hizmetlerine erişimde karşılaşılan en büyük yapısal problemlerden biri, bireylerin doğru uzmana (Klinik Psikolog veya Psikiyatrist) başvuru konusundaki kararsızlığı ve bilgi eksikliğidir. Bu proje, geniş dil modellerinin (LLM) ruh sağlığı alanında bir ön değerlendirme (triage) ve yönlendirme mekanizması olarak potansiyelini test etmek amacıyla geliştirilmiş bir **Konsept Kanıtı (Proof of Concept - PoC)** çalışmasıdır.

---

## Önemli Sorumluluk Reddi (Disclaimer)

* **Tıbbi Cihaz / Canlı Hizmet Değildir:** Bu proje kesinlikle ticari bir ürün, klinik hizmet aracı veya tıbbi cihaz değildir. Kesinlikle profesyonel tıbbi tanı veya tedavinin yerini tutamaz.
* **Klinik Test Eksikliği:** Uygulama, gerçek dünyada kullanılabilecek seviyede kapsamlı klinik testlerden geçirilmemiştir.
* **Güvenlik ve Mahremiyet:** Veri mahremiyeti, KVKK/GDPR uyumluluğu ve siber güvenlik protokolleri tam ölçekli kurgulanmadığı için **aktif canlı kullanıma uygun değildir**. Sadece laboratuvar/yerel test ortamları için geliştirilmiştir.

---

## Öne Çıkan Özellikler

* **Doğal Dil İşleme (NLP) ile Ön Değerlendirme:** Kullanıcı ile empati düzeyini koruyarak doğal bir dilde sohbet eder; belirtileri, süreleri ve günlük yaşama etkilerini analiz eder.
* **Klinik Dışı Gösterge Takibi:** Sohbet akışından uyku düzeni, iştah ve enerji düzeyi gibi kritik verileri arka planda otomatik olarak çıkarır.
* **Kritik Risk (Red Flag) Filtresi:** İntihar düşüncesi, kendine zarar verme veya psikotik belirtiler (sanrı/halüsinasyon) tespit edildiğinde süreci durdurarak kullanıcıyı doğrudan Acil Değerlendirme'ye yönlendirir.
* **Resmi Kurum Entegrasyonu:** Değerlendirme sonucunda kullanıcıları MHRS randevu sistemine, Alo 182/191 hatlarına veya Türk Psikologlar Derneği (TPD) uzman rehberine yönlendirir.

---

## Teknolojik Altyapı (Tech Stack)

Proje, modern ve performanslı bir mikroservis mimarisi üzerine kurulmuştur:

* **Backend:** Python, FastAPI (Asenkron API yönetimi ve LLM entegrasyonu)
* **Frontend:** Next.js (Kullanıcı dostu, hızlı ve responsive arayüz)
* **LLM:** Geniş Dil Modelleri (Prompt Engineering & Structured Output teknikleri ile)

