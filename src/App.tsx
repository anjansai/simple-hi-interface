
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
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
import { ReactNode } from "react";

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

// Role-based route protection
const RoleRoute = ({ 
  allowedRoles, 
  children 
}: { 
  allowedRoles: string[],
  children: ReactNode
}) => {
  const { userData } = useAuth();
  const location = useLocation();
  
  if (!userData || !userData.userRole || !allowedRoles.includes(userData.userRole)) {
    // If on the settings page and not authorized, redirect to dashboard
    if (location.pathname === '/settings') {
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  return <>{children}</>;
};

// Layout wrapper that includes role-based navigation
const LayoutWithRoleNav = () => {
  const { userData } = useAuth();
  const isAdminOrManager = userData?.userRole === 'Admin' || userData?.userRole === 'Manager';

  return (
    <MainLayout showSettings={isAdminOrManager}>
      <Outlet />
    </MainLayout>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/setup-new" element={<SetupNew />} />
              
              {/* Protected Routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <LayoutWithRoleNav />
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
                <Route path="settings" element={
                  <RoleRoute allowedRoles={['Admin', 'Manager']}>
                    <Settings />
                  </RoleRoute>
                } />
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
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
