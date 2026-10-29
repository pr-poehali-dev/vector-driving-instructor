import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import CabinetPending from "@/components/CabinetPending";

// Кабинет с входом через localStorage: рендерится только в браузере.
// Страница подключается динамически: её зависимости (leaflet) трогают window при импорте.
export const Route = createFileRoute("/chat")({
  ssr: false,
  pendingMs: 0,
  pendingComponent: () => <CabinetPending bg="bg-[#f4f6fa]" spin="text-[#E8002D]" label="Чат с виртуальным инструктором Вектор — загрузка" />,
  component: lazyRouteComponent(() => import("@/pages/Chat")),
});
