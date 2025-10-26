'use client';

import React from 'react';
import { withAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AlertManager from '@/components/notifications/AlertManager';

function NotificationsPage() {
  return (
    <DashboardLayout>
      <AlertManager />
    </DashboardLayout>
  );
}

export default withAuth(NotificationsPage, ['viewer', 'editor', 'manager', 'admin']);