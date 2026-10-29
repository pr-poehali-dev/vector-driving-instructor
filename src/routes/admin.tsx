import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import CabinetPending from "@/components/CabinetPending";

// Кабинет с входом через localStorage: рендерится только в браузере.
// Страница подключается динамически: её зависимости (leaflet) трогают window при импорте.
export const Route = createFileRoute("/admin")({
  ssr: false,
  pendingMs: 0,
  pendingComponent: () => <CabinetPending bg="bg-[#f7f7f7]" spin="text-gray-300" label="Панель администратора автошколы Вектор — загрузка" />,
  component: lazyRouteComponent(() => import("@/pages/Admin")),
});
