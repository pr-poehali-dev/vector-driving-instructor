import { createFileRoute } from "@tanstack/react-router";
import Index from "@/pages/Index";
import homeCss from "@/pages/home/home.css?inline";
import { fetchHome } from "@/api/home";

const TITLE = "Автошкола «Вектор 45» в Кургане — категории A и B";
const FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Montserrat:wght@500;700;800;900&family=Onest:wght@400;500;600;700&display=swap";

function HomePage() {
  const home = Route.useLoaderData();
  return <Index home={home} />;
}

export const Route = createFileRoute("/")({
  loader: async () => (await fetchHome()) ?? null,
  head: () => ({
    meta: [{ title: TITLE }, { property: "og:title", content: TITLE }],
    links: [{ rel: "stylesheet", href: FONTS_HREF }],
    styles: [{ children: homeCss }],
  }),
  component: HomePage,
});
