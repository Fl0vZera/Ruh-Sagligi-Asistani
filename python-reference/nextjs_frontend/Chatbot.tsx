"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, ShieldAlert, Heart, RefreshCw, Send, AlertTriangle, AlertCircle, Sparkles, User, Brain } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface EvaluationResult {
  belirtiOzeti: string;
  riskDuzeyi: "Düşük" | "Orta" | "Yüksek";
  onerilenBasvuru: "Klinik Psikolog" | "Psikiyatrist" | "Acil Değerlendirme";
  gerekce: string;
}

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Merhaba, ben Ruh Sağlığı Yönlendirme Asistanınızım. Size doğru uzmana yönlendirilebilmeniz için rehberlik edeceğim. Kesinlikle tanı koymadığımı, sadece ilk başvuru noktanızı belirlemenize yardımcı olduğumu hatırlatmak isterim.\n\nŞu anda nasıl hissediyorsunuz ve sizi bana getiren belirtiler nelerdir? (Örneğin; kaygılar, uyku düzeniniz, ne zamandır böyle hissettiğiniz gibi bilgilerden kısaca bahsedebilirsiniz.)",
    },
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Yardımcı fonksiyon: Gelen chatbot cevabının içinde [[[EVALUATION_START]]] ... [[[EVALUATION_END]]] bloğu var mı diye bakar ve parse eder
  const parseEvaluation = (text: string) => {
    const regex = /\[\[\[EVALUATION_START\]\]\]([\s\S]*?)\[\[\[EVALUATION_END\]\]\]/;
    const match = text.match(regex);
    if (match && match[1]) {
      try {
        const parsed: EvaluationResult = JSON.parse(match[1].trim());
        setEvaluation(parsed);
        // Değerlendirme bloğunu sohbet ekranındaki ham metinden temizleyelim ki ham JSON kullanıcıya görünmesin
        return text.replace(regex, "").trim();
      } catch (e) {
        console.error("Evaluation Parse Hatası:", e);
      }
    }
    return text;
  };

  const handleSendMessage = async (customMessage?: string) => {
    const textToSend = customMessage || inputVal;
    if (!textToSend.trim()) return;

    if (!customMessage) setInputVal("");
    const newMessages: Message[] = [...messages, { role: "user", content: textToSend }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // FastAPI backendine istek yapılıyor (varsayılan localhost:8000)
      const res = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) throw new Error("Ağ hatası oluştu.");

      const data = await res.json();
      
      // Temizlenmiş cevabı al
      const cleanedReply = parseEvaluation(data.reply);

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: cleanedReply },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Bir bağlantı hatası oluştu. Lütfen FastAPI sunucunuzun (localhost:8000) çalıştığından emin olun." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerEvaluationNow = () => {
    handleSendMessage("Şu ana kadarki sohbetimizi analiz et ve lütfen kesin bir yönlendirme raporu çıkar.");
  };

  const resetChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Sohbet sıfırlandı. Yeni bir değerlendirme için belirtilerinizi veya hislerinizi anlatarak başlayabilirsiniz. Size yardımcı olmaktan memnuniyet duyarım.",
      },
    ]);
    setEvaluation(null);
  };

  return (
    <div className="max-w-4xl mx-auto my-10 p-4 font-sans bg-slate-50 min-h-[700px] flex flex-col rounded-xl shadow-lg border border-slate-200">
      {/* Header */}
      <header className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-100 text-rose-600 rounded-lg">
            <Heart className="w-6 h-6 fill-rose-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Ruh Sağlığı Yönlendirme Asistanı</h1>
            <p className="text-xs text-slate-500">FastAPI & Next.js Destekli Akıllı Triage Sistemi</p>
          </div>
        </div>
        <button
          onClick={resetChat}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Sohbeti Sıfırla
        </button>
      </header>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
        {/* Chat Area (Left/Main) */}
        <div className="md:col-span-2 flex flex-col bg-white rounded-lg border border-slate-200 overflow-hidden h-[550px]">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 max-w-[85%] ${
                  msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                <div
                  className={`p-2.5 rounded-full flex-shrink-0 h-9 w-9 flex items-center justify-center ${
                    msg.role === "user" ? "bg-slate-800 text-white" : "bg-rose-100 text-rose-600"
                  }`}
                >
                  {msg.role === "user" ? <User className="w-5 h-5" /> : <Brain className="w-5 h-5" />}
                </div>
                <div
                  className={`p-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-slate-800 text-white rounded-tr-none"
                      : "bg-slate-100 text-slate-800 rounded-tl-none"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 max-w-[80%]">
                <div className="p-2.5 rounded-full h-9 w-9 bg-rose-100 text-rose-600 flex items-center justify-center animate-pulse">
                  <Brain className="w-5 h-5" />
                </div>
                <div className="bg-slate-100 p-3.5 rounded-2xl rounded-tl-none text-sm text-slate-500 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  <span>Düşünceler analiz ediliyor...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions Footer */}
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Sorgulanan Alanlar: Süre, şiddet, kırmızı bayraklar ve uyku.</span>
            {!evaluation && (
              <button
                onClick={triggerEvaluationNow}
                className="text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 transition"
              >
                <Sparkles className="w-3.5 h-3.5" /> Şimdi Analiz Et
              </button>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-3 border-t border-slate-200 flex gap-2">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Belirtilerinizi anlatın veya soruyu yanıtlayın..."
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 text-sm bg-slate-50 focus:bg-white border border-slate-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none rounded-xl transition"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputVal.trim()}
              className="p-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Triage / Raporlama Area (Right) */}
        <div className="flex flex-col bg-slate-100 rounded-lg p-4 border border-slate-200">
          <h2 className="text-md font-bold text-slate-800 mb-3 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" /> İlk Başvuru Yönlendirmesi
          </h2>

          {evaluation ? (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                {/* Uzman Badge */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
                    Önerilen İletişim Noktası
                  </label>
                  <span
                    className={`inline-block mt-1 font-bold text-md px-3 py-1.5 rounded-lg border ${
                      evaluation.onerilenBasvuru === "Acil Değerlendirme"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : evaluation.onerilenBasvuru === "Psikiyatrist"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}
                  >
                    {evaluation.onerilenBasvuru}
                  </span>
                </div>

                {/* Risk Level */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
                    Tahmini Risk Düzeyi
                  </label>
                  <span
                    className={`inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded ${
                      evaluation.riskDuzeyi === "Yüksek"
                        ? "bg-red-100 text-red-800"
                        : evaluation.riskDuzeyi === "Orta"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {evaluation.riskDuzeyi}
                  </span>
                </div>

                {/* Belirti Özeti */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
                    Belirti Özeti
                  </label>
                  <p className="text-slate-700 text-sm mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {evaluation.belirtiOzeti}
                  </p>
                </div>

                {/* Gerekçe */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
                    Yönlendirme Gerekçesi
                  </label>
                  <p className="text-slate-600 text-xs mt-1 italic leading-relaxed">
                    {evaluation.gerekce}
                  </p>
                </div>
              </div>

              {/* Uyarı ve Sorumluluk Feragatı */}
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-[10.5px] text-amber-800 flex gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <p className="leading-normal">
                  <strong>Uyarı:</strong> Bu asistandan alınan sonuçlar hiçbir koşulda tıbbi teşhis değildir. Herhangi bir şüphe durumunda yüz yüze klinik desteğe başvurun.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-300 rounded-xl bg-white/50">
              <Sparkles className="w-10 h-10 text-slate-300 mb-2 animate-pulse" />
              <p className="text-xs text-slate-500 font-medium">
                Rapor Henüz Oluşturulmadı
              </p>
              <p className="text-[11px] text-slate-400 max-w-[200px] mt-1 leading-normal">
                Sohbet yeterince olgunlaştığında asistan otomatik rapor hazırlayacaktır. Veya sohbet altındaki butona basarak analizi zorlayabilirsiniz.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
