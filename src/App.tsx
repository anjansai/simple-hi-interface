
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/MainLayout";
import Dashboard from "./pages/Dashboard";
import MenuManagement from "./pages/MenuManagement";
import Orders from "./pages/Orders";
import Tables from "./pages/Tables";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import SetupNew from "./pages/SetupNew";
import Staff from "./pages/Staff";
import CreateEditUser from "./pages/CreateEditUser";
import { useEffect } from "react";

const queryClient = new QueryClient();

// Check if user is authenticated
const isAuthenticated = () => {
  return localStorage.getItem('authToken') !== null;
};

// Protected route component
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const App = () => {
  // Ensure no auto-redirect from login page if already authenticated
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/login' && isAuthenticated()) {
      // Don't automatically redirect from login page
      // Let the Login component handle this decision
      console.log("User is on login page and already authenticated");
    }
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/setup-new" element={<SetupNew />} />
            
            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="menu" element={<MenuManagement />} />
              <Route path="orders" element={<Orders />} />
              <Route path="tables" element={<Tables />} />
              <Route path="staff" element={<Staff />} />
              <Route path="staff/create-user" element={<CreateEditUser />} />
              <Route path="staff/edit-user/:id" element={<CreateEditUser />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            
            {/* Redirect root to login if not authenticated */}
            <Route path="/" element={
              isAuthenticated() ? 
              <Navigate to="/dashboard" replace /> : 
              <Navigate to="/login" replace />
            } />
            
            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
