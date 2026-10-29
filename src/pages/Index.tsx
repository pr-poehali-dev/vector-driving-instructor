import { useEffect, useMemo } from "react";
import homeHtml from "./home/home.html?raw";
import homeScript from "./home/home-script.js.txt?raw";
import { buildHomeHtml, branchTexts } from "./home/render";
import { mountBranchMap } from "./home/map";
import type { HomeContent } from "@/api/home";

export default function Index({ home }: { home: HomeContent | null }) {
  const html = useMemo(() => {
    const body = buildHomeHtml(homeHtml, home);
    const locs = home?.items.locations || [];
    const data = JSON.stringify({
      branches: branchTexts(locs),
      locations: locs,
      mapKey: home?.settings.map?.key || "",
    }).replace(/</g, "\\u003c");
    return `${body}<script type="application/json" id="home-data">${data}</script>`;
  }, [home]);

  useEffect(() => {
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

    let unmountMap: () => void = () => {};
    let cancelled = false;
    mountBranchMap(home?.items.locations || [], home?.settings.map?.key || "")
      .then((u) => { if (cancelled) u(); else unmountMap = u; })
      .catch(() => {});

    return () => {
      cancelled = true;
      unmountMap();
      subscriptions.forEach(([t, type, fn, opts]) =>
        t.removeEventListener(type, fn, opts as EventListenerOptions),
      );
      document.body.classList.remove("lock");
    };
  }, [html]);

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
