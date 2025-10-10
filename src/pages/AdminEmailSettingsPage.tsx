import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminEmailSettings } from "@/components/admin/AdminEmailSettings";

export default function AdminEmailSettingsPage() {
  const { user } = useAuth();
  
  // Apenas admin@rcaldas.com.br pode acessar
  if (user?.email !== "admin@rcaldas.com.br") {
    return <Navigate to="/admin" replace />;
  }

  return (
    <AdminLayout activeSection="overview">
      <AdminEmailSettings />
    </AdminLayout>
  );
}