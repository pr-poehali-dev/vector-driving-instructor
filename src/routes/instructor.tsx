import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import CabinetPending from "@/components/CabinetPending";

// Кабинет с входом через localStorage: рендерится только в браузере.
// Страница подключается динамически: её зависимости (leaflet) трогают window при импорте.
export const Route = createFileRoute("/instructor")({
  ssr: false,
  pendingMs: 0,
  pendingComponent: () => <CabinetPending bg="bg-slate-900" spin="text-rose-600" label="Кабинет инструктора автошколы Вектор — загрузка" />,
  component: lazyRouteComponent(() => import("@/pages/Instructor")),
});
