'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { withAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import BatchForm from '@/components/batches/BatchForm';
import { ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import Link from 'next/link';

function NewBatchPage() {
  const router = useRouter();

  const handleBatchCreated = (batchId: string) => {
    // Navigate to the batch detail page or back to batches list
    router.push(`/dashboard/batches`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/batches">
            <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
              Back to Batches
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Broodstock Batch</h1>
            <p className="text-gray-600">Add a new broodstock batch to the inventory management system</p>
          </div>
        </div>

        {/* Batch Form */}
        <div className="max-w-4xl">
          <BatchForm 
            onSuccess={handleBatchCreated}
            onCancel={() => router.push('/dashboard/batches')}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(NewBatchPage, ['editor', 'manager', 'admin']);