import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import Game from "./pages/Game";
import Boutique from "./pages/Boutique";
import Profile from "./pages/Profile";
import Blockchain from "./pages/Blockchain";
import AdminAudit from "./pages/AdminAudit";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
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
            <Route path="/" element={<Boutique />} />
            <Route path="/boutique" element={<Boutique />} />
            <Route path="/profile" element={<Profile />} />
            <Route 
              path="/blockchain" 
              element={
                <ProtectedRoute>
                  <Blockchain />
                </ProtectedRoute>
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
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
