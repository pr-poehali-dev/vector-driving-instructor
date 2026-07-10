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

        {/* Фото Tesla + прямая кнопка перехода */}
        <div
          className="relative rounded-3xl overflow-hidden mb-12 max-w-4xl mx-auto"
          style={{ background: "linear-gradient(120deg, #0d0d0d 0%, #1a1a1a 60%)" }}
        >
          <div className="grid md:grid-cols-2 items-center">
            <div className="relative order-2 md:order-1 px-7 py-9 md:py-0">
              <p className="text-[#E8002D] text-xs font-semibold uppercase tracking-widest mb-3">
                Учитесь на Tesla Model X
              </p>
              <h3 className="font-montserrat text-2xl md:text-[1.7rem] text-white mb-3" style={{ fontWeight: 800 }}>
                Один клик — и вы
                <br />
                в чате с инструктором
              </h3>
              <p className="text-white/55 text-sm mb-6 leading-relaxed max-w-sm">
                Не хотите сканировать QR? Просто откройте страницу чата прямо
                сейчас — а после установите её на экран, следуя инструкции
                ниже.
              </p>
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
            <div className="relative order-1 md:order-2 h-56 md:h-full">
              <div
                className="absolute inset-0 md:bg-gradient-to-r"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(26,26,26,0.05) 0%, rgba(26,26,26,0.9) 100%)",
                }}
              />
              <div
                className="hidden md:block absolute inset-y-0 left-0 w-24 z-10"
                style={{
                  background:
                    "linear-gradient(90deg, #1a1a1a 0%, rgba(26,26,26,0) 100%)",
                }}
              />
              <img
                src={TESLA_IMAGE}
                alt="Tesla Model X автошколы Вектор"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
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
                Наведите камеру — откроется чат
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
