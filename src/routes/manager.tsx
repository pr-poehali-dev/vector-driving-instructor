import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import CabinetPending from "@/components/CabinetPending";

// Кабинет с входом через localStorage: рендерится только в браузере.
// Страница подключается динамически: её зависимости (leaflet) трогают window при импорте.
export const Route = createFileRoute("/manager")({
  ssr: false,
  pendingMs: 0,
  pendingComponent: () => <CabinetPending bg="bg-[#f7f7f7]" spin="text-[#E8002D]" label="Кабинет менеджера автошколы Вектор — загрузка" />,
  component: lazyRouteComponent(() => import("@/pages/Manager")),
});
