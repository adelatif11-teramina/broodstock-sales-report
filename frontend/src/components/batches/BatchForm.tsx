'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Button from '@/components/ui/Button';
import FormField from '@/components/ui/FormField';
import { Package, Save, X } from 'lucide-react';

// Validation schema matching backend
const BatchFormSchema = z.object({
  batch_code: z.string().min(1, 'Batch code is required').max(100, 'Batch code too long'),
  hatchery_origin: z.string().min(1, 'Hatchery origin is required').max(255, 'Hatchery origin too long'),
  grade: z.string().max(100, 'Grade too long').optional(),
  arrival_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  available_quantity: z.coerce.number().int().min(0, 'Quantity must be positive'),
  initial_quantity: z.coerce.number().int().min(0, 'Initial quantity must be positive').optional(),
  species: z.string().max(255, 'Species name too long').optional(),
  strain: z.string().max(255, 'Strain name too long').optional(),
  age_weeks: z.coerce.number().min(0, 'Age must be positive').optional(),
  weight_grams: z.coerce.number().min(0, 'Weight must be positive').optional(),
  health_status: z.enum(['excellent', 'good', 'fair', 'poor']).default('good'),
  quarantine_status: z.enum(['pending', 'in_progress', 'completed', 'failed']).default('pending'),
  notes: z.string().optional(),
});

type BatchFormData = z.infer<typeof BatchFormSchema>;

interface BatchFormProps {
  onSuccess?: (batchId: string) => void;
  onCancel?: () => void;
  initialData?: Partial<BatchFormData>;
  isEditing?: boolean;
}

export default function BatchForm({
  onSuccess,
  onCancel,
  initialData,
  isEditing = false,
}: BatchFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BatchFormData>({
    resolver: zodResolver(BatchFormSchema),
    defaultValues: {
      health_status: 'good',
      quarantine_status: 'pending',
      arrival_date: new Date().toISOString().split('T')[0], // Today's date
      ...initialData,
    },
  });

  const onSubmit = async (data: BatchFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      console.log('Submitting batch data:', data);
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Mock batch ID
      const batchId = `batch-${Date.now()}`;
      
      if (onSuccess) {
        onSuccess(batchId);
      } else {
        reset();
        alert(`Batch ${isEditing ? 'updated' : 'created'} successfully!`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save batch');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Package className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {isEditing ? 'Edit Broodstock Batch' : 'New Broodstock Batch'}
            </h3>
            <p className="text-sm text-gray-600">
              {isEditing ? 'Update batch information' : 'Add a new broodstock batch to inventory'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Basic Information */}
        <div className="space-y-4">
          <h4 className="text-base font-medium text-gray-900 border-b border-gray-200 pb-2">
            Basic Information
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Batch Code *"
              error={errors.batch_code?.message}
              {...register('batch_code')}
              placeholder="e.g., BR-2024-001"
            />
            
            <FormField
              label="Hatchery Origin *"
              error={errors.hatchery_origin?.message}
              {...register('hatchery_origin')}
              placeholder="e.g., Pacific Aquaculture Farm"
            />
            
            <FormField
              label="Arrival Date *"
              type="date"
              error={errors.arrival_date?.message}
              {...register('arrival_date')}
            />
            
            <FormField
              label="Grade"
              error={errors.grade?.message}
              {...register('grade')}
              placeholder="e.g., Premium, Standard"
            />
          </div>
        </div>

        {/* Biological Information */}
        <div className="space-y-4">
          <h4 className="text-base font-medium text-gray-900 border-b border-gray-200 pb-2">
            Biological Information
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Species"
              error={errors.species?.message}
              {...register('species')}
              placeholder="e.g., Penaeus vannamei"
            />
            
            <FormField
              label="Strain"
              error={errors.strain?.message}
              {...register('strain')}
              placeholder="e.g., SPF, SPR"
            />
            
            <FormField
              label="Age (weeks)"
              type="number"
              step="0.1"
              error={errors.age_weeks?.message}
              {...register('age_weeks')}
              placeholder="e.g., 12"
            />
            
            <FormField
              label="Average Weight (grams)"
              type="number"
              step="0.1"
              error={errors.weight_grams?.message}
              {...register('weight_grams')}
              placeholder="e.g., 25.5"
            />
          </div>
        </div>

        {/* Quantity Information */}
        <div className="space-y-4">
          <h4 className="text-base font-medium text-gray-900 border-b border-gray-200 pb-2">
            Quantity Information
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Available Quantity *"
              type="number"
              error={errors.available_quantity?.message}
              {...register('available_quantity')}
              placeholder="e.g., 1000"
            />
            
            <FormField
              label="Initial Quantity"
              type="number"
              error={errors.initial_quantity?.message}
              {...register('initial_quantity')}
              placeholder="e.g., 1000"
            />
          </div>
        </div>

        {/* Status Information */}
        <div className="space-y-4">
          <h4 className="text-base font-medium text-gray-900 border-b border-gray-200 pb-2">
            Status Information
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Health Status
              </label>
              <select
                {...register('health_status')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
              {errors.health_status && (
                <p className="mt-1 text-sm text-red-600">{errors.health_status.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quarantine Status
              </label>
              <select
                {...register('quarantine_status')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
              {errors.quarantine_status && (
                <p className="mt-1 text-sm text-red-600">{errors.quarantine_status.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              {...register('notes')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Additional notes about this batch..."
            />
            {errors.notes && (
              <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isSubmitting}
              icon={<X className="h-4 w-4" />}
            >
              Cancel
            </Button>
          )}
          
          <Button
            type="submit"
            disabled={isSubmitting}
            icon={<Save className="h-4 w-4" />}
          >
            {isSubmitting 
              ? (isEditing ? 'Updating...' : 'Creating...') 
              : (isEditing ? 'Update Batch' : 'Create Batch')
            }
          </Button>
        </div>
      </form>
    </div>
  );
}