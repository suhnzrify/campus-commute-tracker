import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/authContext";
import NotFound from "./pages/NotFound.tsx";
import LoginPage from "./pages/LoginPage";
import AppLayout from "./components/AppLayout";

// Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminBuses from "./pages/admin/AdminBuses";
import AdminDrivers from "./pages/admin/AdminDrivers";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminRoutes from "./pages/admin/AdminRoutes";
import AdminMap from "./pages/admin/AdminMap";

// Driver
import DriverTrip from "./pages/driver/DriverTrip";
import DriverRoute from "./pages/driver/DriverRoute";
import DriverAlerts from "./pages/driver/DriverAlerts";

// Student
import StudentTrack from "./pages/student/StudentTrack";
import StudentRoute from "./pages/student/StudentRoute";
import StudentAlerts from "./pages/student/StudentAlerts";

const queryClient = new QueryClient();

function ProtectedRoute({ children, role }: { children: React.ReactNode; role: string }) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (user?.role !== role) return <Navigate to={`/${user?.role}`} replace />;
  return <AppLayout>{children}</AppLayout>;
}

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to={`/${user?.role}`} replace /> : <LoginPage />} />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/buses" element={<ProtectedRoute role="admin"><AdminBuses /></ProtectedRoute>} />
      <Route path="/admin/drivers" element={<ProtectedRoute role="admin"><AdminDrivers /></ProtectedRoute>} />
      <Route path="/admin/students" element={<ProtectedRoute role="admin"><AdminStudents /></ProtectedRoute>} />
      <Route path="/admin/routes" element={<ProtectedRoute role="admin"><AdminRoutes /></ProtectedRoute>} />
      <Route path="/admin/map" element={<ProtectedRoute role="admin"><AdminMap /></ProtectedRoute>} />

      {/* Driver Routes */}
      <Route path="/driver" element={<ProtectedRoute role="driver"><DriverTrip /></ProtectedRoute>} />
      <Route path="/driver/route" element={<ProtectedRoute role="driver"><DriverRoute /></ProtectedRoute>} />
      <Route path="/driver/alerts" element={<ProtectedRoute role="driver"><DriverAlerts /></ProtectedRoute>} />

      {/* Student Routes */}
      <Route path="/student" element={<ProtectedRoute role="student"><StudentTrack /></ProtectedRoute>} />
      <Route path="/student/route" element={<ProtectedRoute role="student"><StudentRoute /></ProtectedRoute>} />
      <Route path="/student/alerts" element={<ProtectedRoute role="student"><StudentAlerts /></ProtectedRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
