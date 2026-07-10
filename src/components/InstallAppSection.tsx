import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import Icon from "@/components/ui/icon";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const TESLA_IMAGE =
  "https://cdn.poehali.dev/projects/370344a9-a9ba-49da-84a7-a1af7d9aae57/bucket/82da0d8e-1916-4d28-8d8d-a233464c2e29.png";

const STEPS_IOS = [
  { icon: "Share", text: "Откройте страницу чата в Safari и нажмите «Поделиться»" },
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
        <div className="text-center mb-12">
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
          <p className="text-white/60 text-base max-w-xl mx-auto leading-relaxed">
            Чат-инструктор живёт на отдельной странице{" "}
            <code className="text-white/80 px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.08)" }}>
              /chat
            </code>{" "}
            — именно её мы добавляем на домашний экран. Так телефон открывает
            сразу диалог с инструктором, без сайта и лишних кликов — как
            настоящее приложение автошколы.
          </p>
        </div>

        {/* QR-код между двумя Tesla, капотами друг к другу */}
        <div className="flex items-center justify-center gap-2 sm:gap-6 md:gap-10 mb-10">
          <img
            src={TESLA_IMAGE}
            alt=""
            aria-hidden="true"
            className="block w-14 sm:w-28 md:w-36 flex-shrink-0 drop-shadow-2xl"
            style={{ transform: "scaleX(-1)" }}
          />

          <div
            className="relative p-6 md:p-7 rounded-3xl shadow-2xl flex-shrink-0"
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
                size={160}
                bgColor="#ffffff"
                fgColor="#1a1a1a"
                level="M"
                imageSettings={{
                  src: "/icons/icon-192.png",
                  height: 32,
                  width: 32,
                  excavate: true,
                }}
              />
            )}
            <p className="text-center text-[11px] text-gray-400 mt-3 font-medium uppercase tracking-wide">
              Наведите камеру
            </p>
          </div>

          <img
            src={TESLA_IMAGE}
            alt="Tesla Model X автошколы Вектор"
            className="block w-14 sm:w-28 md:w-36 flex-shrink-0 drop-shadow-2xl"
          />
        </div>

        <div className="text-center mb-12">
          <Link
            to="/chat"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-white font-montserrat shadow-xl hover:shadow-2xl transition-all hover:-translate-y-0.5"
            style={{ background: "#E8002D", fontWeight: 700 }}
          >
            <Icon name="MessageCircle" size={17} />
            Открыть чат-инструктора
            <Icon name="ArrowRight" size={16} />
          </Link>
        </div>

        <div className="max-w-md mx-auto">
          {/* Переключатель платформы */}
          <div className="flex justify-center">
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

          <div className="flex justify-center">
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
              <p className="text-white/35 text-xs italic text-center">
                Отсканируйте QR-код с телефона или следуйте инструкции выше
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}