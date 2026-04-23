import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import Game from "./pages/Game";
import Exchange from "./pages/Exchange";
import Profile from "./pages/Profile";
import WalletPage from "./pages/WalletPage";
import SendPage from "./pages/SendPage";
import HistoryPage from "./pages/HistoryPage";
import SettingsPage from "./pages/SettingsPage";
import Blockchain from "./pages/Blockchain";
import AdminAudit from "./pages/AdminAudit";
import AdminKycDuplicates from "./pages/AdminKycDuplicates";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import HelpPage from "./pages/HelpPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import { AdminRoute } from "./components/AdminRoute";
import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route element={<MainLayout />}>
            <Route path="/" element={<Exchange />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/send" element={<SendPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route
              path="/blockchain"
              element={
                <AdminRoute>
                  <Blockchain />
                </AdminRoute>
              }
            />
            <Route
              path="/game"
              element={
                <AdminRoute>
                  <Game />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/audit"
              element={
                <AdminRoute>
                  <AdminAudit />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/kyc-duplicates"
              element={
                <AdminRoute>
                  <AdminKycDuplicates />
                </AdminRoute>
              }
            />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
