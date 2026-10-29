import { useEffect } from "react";
import homeHtml from "./home/home.html?raw";
import homeCss from "./home/home.css?inline";
import homeScript from "./home/home-script.js.txt?raw";

const FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Montserrat:wght@500;700;800;900&family=Onest:wght@400;500;600;700&display=swap";
const TITLE = "Автошкола «Вектор 45» в Кургане — категории A и B";

export default function Index() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = TITLE;

    const style = document.createElement("style");
    style.setAttribute("data-home", "1");
    style.textContent = homeCss;
    document.head.appendChild(style);

    const fonts = document.createElement("link");
    fonts.rel = "stylesheet";
    fonts.href = FONTS_HREF;
    document.head.appendChild(fonts);

    const subscriptions: Array<[EventTarget, string, EventListenerOrEventListenerObject, unknown]> = [];
    const targets: EventTarget[] = [window, document];
    const originals = targets.map((t) => t.addEventListener);
    targets.forEach((t) => {
      const orig = t.addEventListener.bind(t);
      t.addEventListener = ((type: string, fn: EventListenerOrEventListenerObject, opts?: unknown) => {
        subscriptions.push([t, type, fn, opts]);
        orig(type, fn, opts as AddEventListenerOptions);
      }) as typeof t.addEventListener;
    });

    try {
      new Function(homeScript)();
    } finally {
      targets.forEach((t, i) => {
        t.addEventListener = originals[i];
      });
    }

    return () => {
      subscriptions.forEach(([t, type, fn, opts]) =>
        t.removeEventListener(type, fn, opts as EventListenerOptions),
      );
      style.remove();
      fonts.remove();
      document.body.classList.remove("lock");
      document.title = prevTitle;
    };
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: homeHtml }} />;
}
