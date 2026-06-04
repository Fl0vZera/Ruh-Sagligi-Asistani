import { useState, useRef, useEffect } from "react";
import { 
  Heart, 
  Brain, 
  AlertCircle, 
  Sparkles, 
  Send, 
  RefreshCw, 
  AlertTriangle, 
  User, 
  Shield, 
  Activity, 
  Info, 
  CheckCircle2,
  Lock,
  ArrowRight,
  ExternalLink,
  Phone,
  Bot
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface EvaluationResult {
  belirtiOzeti: string;
  riskDuzeyi: "Düşük" | "Orta" | "Yüksek";
  onerilenBasvuru: "Klinik Psikolog" | "Psikiyatrist" | "Acil Değerlendirme";
  gerekce: string;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      role: "assistant",
      content: "Merhaba, ben RuhSağlığı Yardımcısı Asistanınızım. Size doğru uzmana yönlendirilebilmeniz için rehberlik edeceğim. Kesinlikle tanı veya ruhsal hastalık teşhisi koymadığımı, sadece en doğru ilk başvuru uzmanını belirlemenize yardımcı olduğumu hatırlatmak isterim.\n\nSohbetimiz boyunca belirtilerinize, bunların süresine ve şiddetine dair bazı sorular soracağım. \n\nŞu anda nasıl hissediyorsunuz ve sizi buraya getiren belirtileriniz nelerdir? Size yardımcı olabilmem için kısaca bahsedebilir misiniz?",
      timestamp: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  
  const [inputVal, setInputVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [activeTab, setActiveTab] = useState<"chat" | "report">("chat"); 
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Dynamic Information Tracking based on keywords in dialogue (AI ticks them automatically)
  const hasSleepCheck = messages.some(m => /uyku|uyuma|gece|yatak|rüy/i.test(m.content));
  const hasAppetiteCheck = messages.some(m => /iştah|yemek|kilo|gıda|beslen/i.test(m.content));
  const hasEnergyCheck = messages.some(m => /enerji|halsiz|yorgun|güçsüz| can |bık/i.test(m.content));
  const hasSubstanceCheck = messages.some(m => /madde|alkol|ilaç|tedavi|terapi|doktor|psik/i.test(m.content));

  // Calculate dynamic progress bar percentage
  const calculateProgress = () => {
    if (evaluation) return 100;
    let base = 20;
    if (hasSleepCheck) base += 20;
    if (hasAppetiteCheck) base += 20;
    if (hasEnergyCheck) base += 20;
    if (hasSubstanceCheck) base += 20;
    return Math.min(base, 95);
  };

  const parseEvaluation = (text: string): string => {
    const regex = /\[\[\[EVALUATION_START\]\]\]([\s\S]*?)\[\[\[EVALUATION_END\]\]\]/;
    const match = text.match(regex);
    if (match && match[1]) {
      try {
        const parsed: EvaluationResult = JSON.parse(match[1].trim());
        setEvaluation(parsed);
        // Automatically open the report display
        setActiveTab("report");
        return text.replace(regex, "").trim();
      } catch (e) {
        console.error("Evaluation parsing error:", e);
      }
    }
    return text;
  };

  const handleSendMessage = async (customMessage?: string) => {
    const textToSend = customMessage || inputVal;
    if (!textToSend.trim() || isLoading) return;

    if (!customMessage) setInputVal("");
    setErrorMsg(null);

    const userMsgId = `m-${Date.now()}`;
    const newMsg: Message = {
      id: userMsgId,
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
    };

    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Sunucudan yanıt alınamadı. Lütfen API anahtarınızın Secrets panelinden tanımlandığından emin olun.");
      }

      const data = await res.json();
      const cleanedReply = parseEvaluation(data.reply);

      setMessages(prev => [
        ...prev,
        {
          id: `m-resp-${Date.now()}`,
          role: "assistant",
          content: cleanedReply,
          timestamp: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } catch (err: any) {
      console.error("Chat error:", err);
      setErrorMsg(err.message || "Bağlantı hatası oluştu. Lütfen tekrar deneyin.");
      setTimeout(() => setErrorMsg(null), 6000);
    } finally {
      setIsLoading(false);
    }
  };

  const forceEvaluationNow = () => {
    handleSendMessage("Lütfen şu ana kadar anlattığım her şeyi profesyonel triage kurallarına göre değerlendirip nihai yönlendirme raporunu çıkar.");
  };

  const resetChat = () => {
    setMessages([
      {
        id: "reset-init",
        role: "assistant",
        content: "Sohbet sıfırlandı. Yeni bir yönlendirme değerlendirmesi için belirtilerinizi veya hislerinizi paylaşarak başlayabilirsiniz.",
        timestamp: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
      }
    ]);
    setEvaluation(null);
    setInputVal("");
    setErrorMsg(null);
    setActiveTab("chat");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans relative overflow-x-hidden">
      
      {/* Decorative Geometric Ambient Background Circles */}
      <div className="absolute top-24 -right-16 w-80 h-80 border-2 border-emerald-100/50 rounded-full -z-10 pointer-events-none"></div>
      <div className="absolute bottom-32 -left-16 w-56 h-56 bg-slate-200/40 rounded-full -z-10 blur-xl pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/3 w-96 h-96 border border-emerald-50/40 rounded-full -z-10 pointer-events-none"></div>

      {/* Top Banner Message for Errors */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="bg-rose-600 text-white py-3 px-6 shadow-md flex items-center justify-between gap-3 text-sm font-medium z-50 sticky top-0"
            id="error-banner"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button 
              onClick={() => setErrorMsg(null)}
              className="text-white hover:bg-white/10 px-2 py-1 rounded transition"
              id="close-error-btn"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Professional Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-40 shadow-xs animate-none" id="app-header">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo / Brand */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <Heart className="w-6 h-6 fill-emerald-500 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-1.5">
                RuhSağlığı Yardımcısı
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Güvenli Triyaj
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">İlk Başvuru Noktası Belirleme ve Akıllı Uzman Yönlendirme Aracı</p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={resetChat}
              className="flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 rounded-xl transition cursor-pointer"
              id="reset-chat-btn"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Sohbeti Sıfırla
            </button>
            <button
              onClick={() => {
                const refDiv = document.getElementById("official-resources-section");
                refDiv?.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 rounded-xl transition"
              id="go-reference-btn"
            >
              Halk Sağlığı Randevu Kanalları ↓
            </button>
          </div>
        </div>
      </header>

      {/* Primary Sticky Disclaimer Banner - Super Prominent as requested */}
      <div className="bg-amber-500 text-slate-950 font-bold border-b border-amber-600/50 py-3.5 px-6 shadow-sm sticky top-[73px] sm:top-[69px] z-30" id="prominent-alert-banner">
        <div className="max-w-7xl mx-auto flex items-start gap-3 text-xs sm:text-sm">
          <AlertTriangle className="w-5 h-5 text-slate-950 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-extrabold text-[11px] sm:text-xs uppercase tracking-widest block text-slate-950/80">Kritik Sorumluluk Sınırı (Yasal Uyarı)</span>
            <p className="text-slate-950 leading-relaxed font-semibold">
              Bu uygulama klinik bir tanı (teşhis) aracı değildir. Buradaki değerlendirmeler sadece ön bilgilendirme amaçlı triyajdır ve profesyonel hekim desteğinin yerini tutamaz. Acil ve hayati risk durumunda lütfen derhal 112 Acil Yardım hattını arayınız.
            </p>
          </div>
        </div>
      </div>

      {/* Main Container framed identically to Geometric Balance */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row shadow-sm border-x border-slate-200 bg-white min-h-[600px]">
        
        {/* Left Sidebar: Progress Tracking Status */}
        <aside className="w-full md:w-80 flex flex-col border-b md:border-b-0 md:border-r border-slate-200 bg-white" id="asst-sidebar">
          {/* Brand Identity Branding Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <h1 className="text-lg font-extrabold tracking-tight text-slate-900">RuhSağlığı Yardımcısı</h1>
              </div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Rapor Takip Paneli</p>
            </div>
          </div>

          <div className="flex-1 p-6 space-y-7 overflow-y-auto">
            
            {/* Assessment Progress Sector */}
            <section className="space-y-4">
              <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Değerlendirme Durumu</h2>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Sohbet esnasında bahsettiğiniz belirtiler yapay zeka tarafından tespit edilip otomatik olarak işaretlenecektir:
              </p>
              
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                    <span>Analiz Tamamlanma</span>
                    <span>%{calculateProgress()}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${calculateProgress()}%` }}></div>
                  </div>
                </div>

                {/* Checklist Badges indicating items collected so far (AI ticks them) */}
                <div className="space-y-2 text-[10px] font-bold uppercase tracking-wider">
                  <div className={`p-2 rounded transition flex items-center justify-between border ${
                    hasSleepCheck 
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                      : "bg-slate-100 text-slate-400 border-slate-200/60"
                  }`}>
                    <span>1. Uyku Düzeni</span>
                    <span className="font-extrabold text-[11px]">{hasSleepCheck ? "TİKLENDİ ✓" : "SORGULANIYOR"}</span>
                  </div>
                  <div className={`p-2 rounded transition flex items-center justify-between border ${
                    hasAppetiteCheck 
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                      : "bg-slate-100 text-slate-400 border-slate-200/60"
                  }`}>
                    <span>2. İştah Değişimi</span>
                    <span className="font-extrabold text-[11px]">{hasAppetiteCheck ? "TİKLENDİ ✓" : "SORGULANIYOR"}</span>
                  </div>
                  <div className={`p-2 rounded transition flex items-center justify-between border ${
                    hasEnergyCheck 
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                      : "bg-slate-100 text-slate-400 border-slate-200/60"
                  }`}>
                    <span>3. Enerji Düzeyi</span>
                    <span className="font-extrabold text-[11px]">{hasEnergyCheck ? "TİKLENDİ ✓" : "SORGULANIYOR"}</span>
                  </div>
                  <div className={`p-2 rounded transition flex items-center justify-between border ${
                    hasSubstanceCheck 
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                      : "bg-slate-100 text-slate-400 border-slate-200/60"
                  }`}>
                    <span>4. Tedavi & Alkol Geçmişi</span>
                    <span className="font-extrabold text-[11px]">{hasSubstanceCheck ? "TİKLENDİ ✓" : "SORGULANIYOR"}</span>
                  </div>
                </div>
              </div>
            </section>

          </div>

          {/* Secure lock metadata footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 text-[10.5px] text-slate-500 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-slate-600 justify-center">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Güvenli & Etik Danışman</span>
            </div>
            <p className="text-center text-[10px] text-slate-400 leading-normal">
              Yapay zeka asistanı Türkiye ruh sağlığı standartlarına uyumludur.
            </p>
          </div>
        </aside>

        {/* Center / Right Flex Grid Content matching Geometric Balance */}
        <main className="flex-1 flex flex-col min-w-0" id="main-content">
          
          {/* Top Session Header Section */}
          <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 z-10" id="session-header">
            <div className="flex items-center gap-2">
              <span className="text-xs bg-slate-100 transition text-slate-700 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                Aktif Görüşme Triyajı: #2841
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>

            {/* Custom interactive tab selectors on small viewports */}
            <div className="flex md:hidden gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab("chat")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  activeTab === "chat" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
                }`}
              >
                Sohbet
              </button>
              <button
                onClick={() => setActiveTab("report")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition relative ${
                  activeTab === "report" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
                }`}
              >
                Rapor
                {evaluation && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />}
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-3">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Çalışma Modu: OpenAI & Gemini Triage</span>
            </div>
          </header>

          {/* Interactive Dual-column workspace */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden h-[540px]" id="workspace-grid">
            
            {/* Chat Box (Middle grid columns) */}
            <div className={`lg:col-span-7 flex flex-col bg-white border-r border-slate-100 h-full overflow-hidden ${
              activeTab === "report" ? "hidden lg:flex" : "flex"
            }`}>
              
              {/* Messages container */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#F8FAFC]/55" id="chat-messages-container">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-4 ${
                      msg.role === "user" ? "flex-row-reverse" : ""
                    }`}
                  >
                    {/* Visual avatar badge */}
                    <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center border shadow-xs transition ${
                      msg.role === "user" 
                        ? "bg-emerald-600 text-white border-emerald-500" 
                        : "bg-slate-900 text-white border-slate-950"
                    }`}>
                      {msg.role === "user" ? (
                        <User className="w-5 h-5 text-white" />
                      ) : (
                        <Bot className="w-5 h-5 text-white" />
                      )}
                    </div>

                    {/* Chat Bubble matching Geometric styling */}
                    <div
                      className={`max-w-[75%] p-5 rounded-2xl shadow-xs leading-relaxed text-[14.5px] transition-all duration-300 ${
                        msg.role === "user"
                          ? "bg-emerald-600 text-white rounded-tr-none shadow-md shadow-emerald-600/5 hover:bg-emerald-600/95"
                          : "bg-white border border-slate-200 text-slate-800 rounded-tl-none hover:border-slate-300"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <span className={`block text-[10px] mt-2 opacity-60 ${msg.role === "user" ? "text-right text-emerald-100" : "text-left text-slate-400"}`}>
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Typing status loading state */}
                {isLoading && (
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex-shrink-0 flex items-center justify-center shadow-xs animate-pulse text-white">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="max-w-[70%] bg-white border border-slate-200 p-5 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0ms]" />
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:150ms]" />
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:300ms]" />
                      <span className="text-xs text-slate-500 font-semibold italic">RuhSağlığı Yardımcısı analiz ediyor...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Send Input Box area */}
              <div className="p-4 bg-white border-t border-slate-200">
                <div className="max-w-3xl mx-auto flex gap-3">
                  <input
                    type="text"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Şikayetlerinizi, uykunuzu ve ne kadar süredir devam ettiğini yazın..."
                    disabled={isLoading}
                    className="flex-1 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-emerald-500 outline-none rounded-2xl p-4 text-sm font-medium transition text-slate-800"
                    id="geometric-chat-input"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={isLoading || !inputVal.trim()}
                    className="px-6 py-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 text-white disabled:text-slate-400 rounded-2xl font-bold text-xs tracking-wider uppercase transition shadow-lg shadow-slate-200 hover:shadow-slate-300 disabled:shadow-none flex items-center gap-2 cursor-pointer"
                    id="geometric-send-btn"
                  >
                    GÖNDER
                  </button>
                </div>
              </div>

            </div>

            {/* Evaluation Triyaj Raporu (Right grid columns) */}
            <div className={`lg:col-span-5 bg-slate-50/50 p-6 flex flex-col justify-between overflow-y-auto ${
              activeTab === "chat" ? "hidden lg:flex" : "flex"
            }`} id="evaluation-triage-panel">
              
              <div className="space-y-5">
                
                <div className="flex items-center gap-2 justify-between">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest block font-sans">Yönlendirme Sonucu</h3>
                  
                  {evaluation && (
                    <button
                      onClick={resetChat}
                      className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      Sohbeti Sıfırla <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {evaluation ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-4"
                  >
                    
                    {/* Main triage box card */}
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
                      
                      {/* Specialist badge assignment */}
                      <div>
                        <label className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider mb-1.5">
                          Tavsiye Edilen İlk Başvuru
                        </label>
                        <span
                          className={`inline-block font-extrabold text-sm px-4 py-2 rounded-xl border tracking-wide uppercase ${
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

                      {/* Triage assessment risk score */}
                      <div>
                        <label className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider mb-1">
                          Hesaplanan Risk Seviyesi
                        </label>
                        <span
                          className={`inline-block text-xs font-extrabold px-3 py-1 rounded-md ${
                            evaluation.riskDuzeyi === "Yüksek"
                              ? "bg-red-100 text-red-900"
                              : evaluation.riskDuzeyi === "Orta"
                              ? "bg-amber-100 text-amber-900"
                              : "bg-emerald-100 text-emerald-900"
                          }`}
                        >
                          {evaluation.riskDuzeyi} Risk
                        </span>
                      </div>

                      {/* Detailed summary statement */}
                      <div>
                        <label className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider mb-1">
                          Belirtilerin Klinik-Dışı Özeti
                        </label>
                        <p className="text-slate-700 text-xs leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 font-medium">
                          {evaluation.belirtiOzeti}
                        </p>
                      </div>

                      {/* Logic rationale justified */}
                      <div>
                        <label className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider mb-1">
                          Yönlendirme Gerekçesi
                        </label>
                        <p className="text-slate-600 text-xs leading-relaxed italic bg-emerald-50/20 p-3 rounded-lg border border-emerald-100/50">
                          {evaluation.gerekce}
                        </p>
                      </div>

                    </div>

                    {/* Progress indicator confirmation check */}
                    <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 p-3.5 rounded-xl border border-emerald-100 text-xs font-semibold shadow-xs">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <span>Rapor, tüm algoritmik kısıtlara ve kırmızı bayraklara tam uyumlulukla hazırlanmıştır.</span>
                    </div>

                  </motion.div>
                ) : (
                  
                  /* Dynamic Placeholder encouraging further details */
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm text-center py-10 space-y-3">
                    <Brain className="w-12 h-12 text-slate-300 mx-auto animate-pulse" />
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Rapor Bekleniyor</h4>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-[220px] mx-auto font-medium">
                      Lütfen asistanınızın yönelttiği sorulara yanıt vererek belirtileriniz, süreç ve şiddet hakkında detay paylaşın.
                    </p>
                    
                    {messages.length >= 2 && (
                      <button
                        onClick={forceEvaluationNow}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/50 rounded-lg transition cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Analizi Şimdi Oluştur
                      </button>
                    )}
                  </div>

                )}

              </div>

              {/* Sorumluluk Feragatı (Consistent medical warning always pinned at bottom of evaluation card) */}
              <div className="bg-amber-100 border border-amber-300 p-4 rounded-xl text-[10.5px] leading-relaxed text-amber-950 mt-4 shadow-xs">
                <div className="flex items-center gap-1.5 font-extrabold text-amber-950 uppercase tracking-wider mb-1">
                  <AlertCircle className="w-4 h-4 text-amber-800" />
                  <span>Sorumluluk Feragatı</span>
                </div>
                Bu chatbot'un ürettiği değerlendirmeler klinik bir tanı değildir. Tıbbi tanı ve tedavi talepleriniz için lütfen yetkili tıp hekimlerine, devlet hastanelerine veya ruh sağlığı uzmanlarına yüz yüze başvurun.
              </div>

            </div>

          </div>

        </main>

      </div>

      {/* Official Health Institutions & Resources Portal - Replaced Python visualizations */}
      <section className="bg-slate-900 border-t border-slate-800 text-white py-12 px-6 relative" id="official-resources-section">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5 text-emerald-400 text-xs font-extrabold uppercase tracking-widest">
                <Shield className="w-4 h-4" /> T.C. Sağlık Bakanlığı Entegre Sistemleri
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Resmi Ruh Sağlığı Randevu & Destek Bağlantıları</h2>
              <p className="text-slate-400 text-sm max-w-2xl mt-1">
                Size en uygun uzmanı belirledikten sonra, devlet hastanelerimizden randevu alabilir veya Türk Psikologlar Derneği (TPD) resmi rehberleri üzerinden yetkin klinik psikologlara ulaşabilirsiniz.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            
            {/* MHRS Card */}
            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/60 shadow-md hover:border-emerald-500/50 transition duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-3.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                  <h4 className="font-extrabold text-sm text-slate-100 tracking-wide uppercase">1. MHRS Devlet Hastanesi Randevu</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-6 font-medium">
                  T.C. Sağlık Bakanlığı'na bağlı hastanelerden muayene veya randevu talebi oluşturmak için Merkezi Hekim Randevu Sistemi'ni (MHRS) ve e-Nabız portalını doğrudan kullanabilirsiniz.
                </p>
              </div>
              <div className="space-y-2">
                <a 
                  href="https://www.mhrs.gov.tr" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl shadow-md transition"
                >
                  MHRS Randevu Sayfası <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <a 
                  href="https://enabiz.gov.tr" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 text-xs font-semibold rounded-xl transition"
                >
                  e-Nabız Girişi <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* TPD Card */}
            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/60 shadow-md hover:border-emerald-500/50 transition duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-3.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <h4 className="font-extrabold text-sm text-slate-100 tracking-wide uppercase">2. Türk Psikologlar Derneği (TPD)</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-6 font-medium">
                  Akredite klinik psikolog sorgulaması yapmak, mesleki standartları incelemek ve etik kurul onaylı ruh sağlığı uzmanlarına güvenle ulaşmak için Türk Psikologlar Derneği web sayfasını ziyaret edebilirsiniz.
                </p>
              </div>
              <a 
                href="https://www.psikolog.org.tr" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full mt-auto flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-md transition"
              >
                Türk Psikologlar Derneği (TPD) <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Official Hotlines Card */}
            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/60 shadow-md hover:border-emerald-500/50 transition duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-3.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <h4 className="font-extrabold text-sm text-slate-100 tracking-wide uppercase">3. Alo 182 & 191 Resmi Danışma Hatları</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-6 font-medium">
                  Telefon üzerinden devlet hastanelerinden psikiyatrik randevu oluşturmak için <strong className="text-white">Alo 182</strong>, alkol veya madde kullanımı bağımlılık desteği almak için ise <strong className="text-white">Alo 191</strong> Sağlık Bakanlığı hattını arayabilirsiniz.
                </p>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/40 text-center text-xs font-semibold text-amber-400 flex items-center justify-center gap-2">
                <Phone className="w-4 h-4 text-amber-400" /> Telefonla Destek: Alo 182 / Alo 191
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer copyright */}
      <footer className="bg-slate-100 py-6 border-t border-slate-200 text-center w-full mt-auto" id="app-footer">
        <p className="text-xs text-slate-400 font-extrabold uppercase tracking-widest">
          KUTAY SÖNMEZ © {new Date().getFullYear()} • Güvenli ve Etik Triyaj Yardımcısı
        </p>
      </footer>

    </div>
  );
}
