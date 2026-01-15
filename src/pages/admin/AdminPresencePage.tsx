import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminPresenceDashboard } from '@/components/admin/AdminPresenceDashboard';

export default function AdminPresencePage() {
  return (
    <AdminLayout activeSection="presence">
      <AdminPresenceDashboard />
    </AdminLayout>
  );
}
