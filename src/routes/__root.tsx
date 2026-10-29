import type {ReactNode} from "react";
import {HeadContent, Outlet, Scripts, createRootRoute, useLocation} from "@tanstack/react-router";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {useState} from "react";
import {Toaster} from "@/components/ui/toaster";
import {Toaster as Sonner} from "@/components/ui/sonner";
import {TooltipProvider} from "@/components/ui/tooltip";
import {PLATFORM_META, PLATFORM_SCRIPTS} from "@/platform/scripts.gen";
import {HMR_CLIENT} from "@/platform/dev-hmr";
import {getSiteSettings} from "@/api/siteSettings";
import MaintenancePage from "@/pages/Maintenance";
import NotFound from "@/pages/NotFound";
import appCss from "@/index.css?url";

const TITLE = "Автошкола Вектор — Курган";
const DESCRIPTION =
    "Автошкола Вектор в Кургане — профессиональное обучение вождению категории B. Опытные инструкторы, современные автомобили.";
const OG_IMAGE = "https://cdn.poehali.dev/intertnal/img/phl2/og-main-2.webp";
const FAVICON =
    "https://cdn.poehali.dev/projects/370344a9-a9ba-49da-84a7-a1af7d9aae57/files/favicon-1780092231648.png";

export const Route = createRootRoute({
    loader: async () => {
        try {
            const s = await getSiteSettings();
            return {maintenance: !!s.maintenance_mode};
        } catch {
            return {maintenance: false};
        }
    },
    staleTime: Infinity,
    shouldReload: false,
    head: () => ({
        meta: [
            {charSet: "utf-8"},
            {
                name: "viewport",
                content:
                    "width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover",
            },
            {title: TITLE},
            {name: "description", content: DESCRIPTION},
            {property: "og:title", content: TITLE},
            {property: "og:description", content: DESCRIPTION},
            {property: "og:image", content: OG_IMAGE},
            {property: "og:image:width", content: "1200"},
            {property: "og:image:height", content: "630"},
            {name: "twitter:image", content: OG_IMAGE},
            {name: "apple-mobile-web-app-capable", content: "yes"},
            {name: "apple-mobile-web-app-status-bar-style", content: "black"},
            {name: "apple-mobile-web-app-title", content: "Инструктор Вектор"},
            {name: "mobile-web-app-capable", content: "yes"},
            {name: "theme-color", content: "#1a1a1a"},
            ...PLATFORM_META,
        ],
        links: [
            {rel: "stylesheet", href: appCss},
            {rel: "icon", type: "image/png", href: FAVICON},
            {rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png"},
            {rel: "manifest", href: "/manifest.json"},
            {rel: "preconnect", href: "https://fonts.googleapis.com"},
            {rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous"},
            {
                rel: "stylesheet",
                href: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Open+Sans:wght@400;500;600&display=swap",
            },
        ],
        // IMPORTANT: DO NOT REMOVE PLATFORM SCRIPTS AND THE DEV HMR CLIENT!
        scripts: [
            ...(import.meta.env.DEV ? [{children: HMR_CLIENT}] : []),
            ...PLATFORM_SCRIPTS,
        ],
    }),
    component: RootComponent,
    notFoundComponent: NotFound,
});

function RootComponent() {
    const [queryClient] = useState(() => new QueryClient());
    const data = Route.useLoaderData();
    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith("/admin");
    const maintenance = !!data?.maintenance && !isAdminRoute;

    return (
        <RootDocument>
            <QueryClientProvider client={queryClient}>
                <TooltipProvider>
                    <Toaster/>
                    <Sonner/>
                    {maintenance ? <MaintenancePage/> : <Outlet/>}
                </TooltipProvider>
            </QueryClientProvider>
        </RootDocument>
    );
}

function RootDocument({children}: { children: ReactNode }) {
    return (
        <html lang="ru">
        <head>
            <HeadContent/>
        </head>
        <body>
        {children}
        <Scripts/>
        </body>
        </html>
    );
}
