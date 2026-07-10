import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import Icon from "@/components/ui/icon";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const STEPS_IOS = [
  { icon: "Share", text: "Откройте сайт в Safari и нажмите «Поделиться»" },
  { icon: "SquarePlus", text: "Выберите «На экран Домой»" },
  { icon: "Check", text: "Нажмите «Добавить» — готово!" },
];

const STEPS_ANDROID = [
  { icon: "MoreVertical", text: "Откройте меню браузера (три точки)" },
  { icon: "SquarePlus", text: "Выберите «Установить приложение» или «На главный экран»" },
  { icon: "Check", text: "Подтвердите — готово!" },
];

export default function InstallAppSection() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [pageUrl, setPageUrl] = useState("");
  const [tab, setTab] = useState<"ios" | "android">("android");

  useEffect(() => {
    setPageUrl(`${window.location.origin}/chat`);

    const ua = navigator.userAgent || "";
    if (/iPhone|iPad|iPod/i.test(ua)) setTab("ios");

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  };

  const steps = tab === "ios" ? STEPS_IOS : STEPS_ANDROID;

  return (
    <section id="install" className="relative overflow-hidden" style={{ background: "#1a1a1a" }}>
      {/* Декоративные элементы */}
      <div
        className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10 blur-3xl"
        style={{ background: "#E8002D" }}
      />
      <div
        className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full opacity-10 blur-3xl"
        style={{ background: "#E8002D" }}
      />

      <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28">
        <div className="text-center mb-14">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5 uppercase tracking-widest"
            style={{ background: "rgba(232,0,45,0.15)", color: "#E8002D" }}
          >
            <Icon name="Smartphone" size={12} />
            Установите на телефон
          </div>
          <h2 className="font-montserrat text-3xl md:text-4xl text-white mb-4" style={{ fontWeight: 900 }}>
            Инструктор Вектор
            <br />
            <span style={{ color: "#E8002D" }}>всегда под рукой</span>
          </h2>
          <p className="text-white/60 text-base max-w-lg mx-auto leading-relaxed">
            Добавьте чат на домашний экран — и открывайте инструктора одним
            касанием, как обычное приложение. Без магазинов и загрузок.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center max-w-4xl mx-auto">
          {/* QR-код */}
          <div className="flex justify-center">
            <div
              className="relative p-7 rounded-3xl shadow-2xl"
              style={{ background: "white" }}
            >
              <div
                className="absolute -top-3 -left-3 w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
                style={{ background: "#E8002D" }}
              >
                <Icon name="Car" size={16} className="text-white" />
              </div>
              {pageUrl && (
                <QRCodeSVG
                  value={pageUrl}
                  size={180}
                  bgColor="#ffffff"
                  fgColor="#1a1a1a"
                  level="M"
                  imageSettings={{
                    src: "/icons/icon-192.png",
                    height: 34,
                    width: 34,
                    excavate: true,
                  }}
                />
              )}
              <p className="text-center text-[11px] text-gray-400 mt-3 font-medium uppercase tracking-wide">
                Наведите камеру
              </p>
            </div>
          </div>

          {/* Инструкция */}
          <div>
            <div className="flex gap-1.5 mb-5 p-1 rounded-xl w-fit" style={{ background: "rgba(255,255,255,0.06)" }}>
              <button
                onClick={() => setTab("android")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  tab === "android" ? "bg-white text-[#1a1a1a]" : "text-white/50 hover:text-white/80"
                }`}
              >
                <Icon name="Smartphone" size={13} />
                Android
              </button>
              <button
                onClick={() => setTab("ios")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  tab === "ios" ? "bg-white text-[#1a1a1a]" : "text-white/50 hover:text-white/80"
                }`}
              >
                <Icon name="Apple" size={13} fallback="Smartphone" />
                iPhone
              </button>
            </div>

            <div className="flex flex-col gap-3.5 mb-6">
              {steps.map((step, i) => (
                <div key={step.text} className="flex items-start gap-3.5">
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: "#E8002D" }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Icon name={step.icon} size={15} className="text-white/40 flex-shrink-0" fallback="Circle" />
                    <p className="text-white/75 text-sm leading-relaxed">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {deferredPrompt && !installed && (
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-white font-montserrat shadow-xl hover:shadow-2xl transition-all hover:-translate-y-0.5 w-full sm:w-auto justify-center"
                style={{ background: "#E8002D", fontWeight: 700 }}
              >
                <Icon name="Download" size={17} />
                Установить приложение
              </button>
            )}

            {installed && (
              <div
                className="flex items-center gap-2 px-5 py-3 rounded-xl w-fit"
                style={{ background: "rgba(34,197,94,0.15)" }}
              >
                <Icon name="CheckCircle2" size={16} className="text-green-400" />
                <span className="text-green-400 text-sm font-semibold">Приложение установлено</span>
              </div>
            )}

            {!deferredPrompt && !installed && (
              <p className="text-white/35 text-xs italic">
                Отсканируйте QR-код с телефона или следуйте инструкции выше
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
