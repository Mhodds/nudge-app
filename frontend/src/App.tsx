import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { InterfaceModeProvider } from "@/context/InterfaceModeContext";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Training from "./pages/Training";
import MatchDayInit from "./pages/MatchDayInit";
import MatchDay from "./pages/MatchDay";
import Analytics from "./pages/Analytics";
import PostSession from "./pages/PostSession";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Landing from "./pages/Landing";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <InterfaceModeProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/training" element={<ProtectedRoute><Training /></ProtectedRoute>} />
              <Route path="/match-day" element={<ProtectedRoute><MatchDayInit /></ProtectedRoute>} />
              <Route path="/match-day/track" element={<ProtectedRoute><MatchDay /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/session/:id" element={<ProtectedRoute><PostSession /></ProtectedRoute>} />
              <Route path="/landing" element={<Landing />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </InterfaceModeProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
