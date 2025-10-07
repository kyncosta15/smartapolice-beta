import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminApprovalsPage as AdminApprovals } from '@/components/insurance/AdminApprovalsPage';

export default function AdminApprovalsPage() {
  return (
    <AdminLayout activeSection="approvals">
      <AdminApprovals />
    </AdminLayout>
  );
}
