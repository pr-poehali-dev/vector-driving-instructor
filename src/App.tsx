
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import AdminPage from "./pages/Admin";
import ChatPage from "./pages/Chat";
import ManagerPage from "./pages/Manager";
import AccountPage from "./pages/Account";
import MaintenancePage from "./pages/Maintenance";
import NotFound from "./pages/NotFound";
import { getSiteSettings } from "@/api/siteSettings";

const queryClient = new QueryClient();

function AppRoutes() {
  const location = useLocation();
  const [maintenance, setMaintenance] = useState<boolean | null>(null);

  useEffect(() => {
    getSiteSettings()
      .then(s => setMaintenance(s.maintenance_mode))
      .catch(() => setMaintenance(false));
  }, []);

  const isAdminRoute = location.pathname.startsWith("/admin");

  if (maintenance === null) return null;
  if (maintenance && !isAdminRoute) return <MaintenancePage />;

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/manager" element={<ManagerPage />} />
      <Route path="/account" element={<AccountPage />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;