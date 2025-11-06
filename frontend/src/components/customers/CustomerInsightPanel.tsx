'use client';

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Button from '@/components/ui/Button';
import { apiClient, CustomerAnalytics, TimelineEventSeverity } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import {
  cn,
  formatCurrency,
  formatDate,
  formatNumber,
  formatRelativeTime,
  formatStatus,
  getStatusColor,
} from '@/lib/utils';

interface PanelCredential {
  id: string;
  type: string;
  number: string;
  status: 'valid' | 'expiring' | 'expired';
  issuedDate?: Date;
  expiryDate?: Date;
}

interface PanelCustomer {
  id: string;
  name: string;
  primaryContactName: string;
  primaryContactPhone: string;
  email: string;
  country: string;
  province: string;
  district: string;
  status: 'active' | 'paused' | 'blacklisted';
  totalOrders: number;
  totalValue: number;
  lastOrderDate?: Date;
  credentials: PanelCredential[];
  paymentHistory?: 'excellent' | 'good' | 'fair' | 'poor';
}

interface CustomerInsightPanelProps {
  customer: PanelCustomer;
  onClose: () => void;
}

const severityStyles: Record<TimelineEventSeverity, string> = {
  info: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
  critical: 'bg-red-50 text-red-700 ring-1 ring-red-100',
};

const statusBadgeStyles: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  paused: 'bg-amber-100 text-amber-700',
  blacklisted: 'bg-red-100 text-red-700',
};

const retentionCopy: Record<string, string> = {
  low: 'Engaged and ordering on schedule',
  medium: 'Slight slowdown — consider proactive outreach',
  high: 'Significant slowdown detected — immediate action recommended',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 tracking-[0.1em] uppercase">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function InsightSkeleton() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-gray-200 rounded" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
      </div>
      <div className="grid grid-cols-2 gap-3 animate-pulse">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-lg border border-gray-200 p-3 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="h-5 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
      <div className="space-y-3 animate-pulse">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-4 bg-gray-200 rounded" />
        ))}
      </div>
    </div>
  );
}

export default function CustomerInsightPanel({ customer, onClose }: CustomerInsightPanelProps) {
  const { data, isLoading, isError, refetch } = useQuery<CustomerAnalytics>({
    queryKey: queryKeys.customerAnalytics(customer.id),
    queryFn: () => apiClient.getCustomerAnalytics(customer.id),
    enabled: Boolean(customer.id),
  });

  const lastOrderDescription = useMemo(() => {
    if (data?.summary.lastOrderDate) {
      return `${formatDate(data.summary.lastOrderDate)} • ${formatRelativeTime(new Date(data.summary.lastOrderDate))}`;
    }
    if (customer.lastOrderDate) {
      return `${formatDate(customer.lastOrderDate)} • ${formatRelativeTime(customer.lastOrderDate)}`;
    }
    return 'No orders yet';
  }, [data?.summary.lastOrderDate, customer.lastOrderDate]);

  const retentionNote = data ? retentionCopy[data.summary.retentionRisk] : 'Review recent engagement';

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="hidden sm:block sm:flex-1 bg-black/30"
        aria-label="Close insights"
        onClick={onClose}
      />
      <aside className="ml-auto flex h-full w-full sm:max-w-xl flex-col bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <h2 className="text-lg font-semibold text-gray-900">{customer.name}</h2>
              <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.25em]', statusBadgeStyles[customer.status] || 'bg-gray-100 text-gray-700')}>
                {customer.status}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              {customer.country}, {customer.province}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
              <span>{customer.primaryContactName}</span>
              <span>{customer.primaryContactPhone}</span>
              <span>{customer.email}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={refetch}>
              Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {isLoading && <InsightSkeleton />}

          {isError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Unable to load analytics right now. Please retry in a moment.
            </div>
          )}

          {data && !isLoading && !isError && (
            <>
              {data.warnings.length > 0 && (
                <Section title="Attention Needed">
                  <div className="space-y-2">
                    {data.warnings.map((warning) => (
                      <div
                        key={warning.code}
                        className={cn('rounded-lg px-3 py-2 text-sm font-medium', severityStyles[warning.severity])}
                      >
                        {warning.message}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              <Section title="Customer Health">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-gray-200 p-3">
                    <div className="text-xs uppercase tracking-[0.2em] text-gray-500">Lifetime Value</div>
                    <div className="mt-1 text-xl font-semibold text-gray-900">
                      {formatCurrency(data.summary.totalValue)}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">{customer.totalOrders} total orders</div>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-3">
                    <div className="text-xs uppercase tracking-[0.2em] text-gray-500">Average Order</div>
                    <div className="mt-1 text-xl font-semibold text-gray-900">
                      {formatCurrency(data.summary.averageOrderValue)}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">Last order {lastOrderDescription}</div>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-3">
                    <div className="text-xs uppercase tracking-[0.2em] text-gray-500">Outstanding Balance</div>
                    <div className="mt-1 text-xl font-semibold text-gray-900">
                      {formatCurrency(data.summary.outstandingInvoiceValue)}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">{data.summary.outstandingInvoiceCount} invoice(s) open</div>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-3">
                    <div className="text-xs uppercase tracking-[0.2em] text-gray-500">Retention Signal</div>
                    <div className="mt-1 text-xl font-semibold text-gray-900 capitalize">
                      {data.summary.retentionRisk}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">{retentionNote}</div>
                  </div>
                </div>
              </Section>

              <Section title="Top Focus Areas">
                <div className="grid grid-cols-1 gap-3">
                  <div className="rounded-lg border border-gray-200 p-3">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Credential Status</span>
                      <span>
                        {data.credentialStatus.valid} valid · {data.credentialStatus.expiring} expiring · {data.credentialStatus.expired} expired
                      </span>
                    </div>
                    <div className="mt-2 space-y-2">
                      {data.credentialStatus.credentials.slice(0, 3).map((cred) => (
                        <div key={cred.id || cred.number} className="flex items-center justify-between text-sm">
                          <div className="font-medium text-gray-900">{cred.type}</div>
                          <div className={cn('rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-[0.2em]',
                            cred.status === 'valid' ? 'bg-green-100 text-green-700' : cred.status === 'expiring' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                          )}>
                            {cred.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {data.topSpecies.length > 0 && (
                    <div className="rounded-lg border border-gray-200 p-3">
                      <div className="text-xs uppercase tracking-[0.2em] text-gray-500">Most Ordered Species</div>
                      <div className="mt-2 space-y-2">
                        {data.topSpecies.map((species) => (
                          <div key={species.species} className="flex items-center justify-between text-sm">
                            <div className="text-gray-900">{species.species}</div>
                            <div className="text-gray-500">{formatNumber(species.totalQuantity)} pcs · {formatCurrency(species.totalValue)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Section>

              <Section title="Recent Orders">
                <div className="space-y-3">
                  {data.recentOrders.slice(0, 5).map((order) => (
                    <div key={order.id} className="rounded-lg border border-gray-200 p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{order.orderNumber}</div>
                          <div className="text-xs text-gray-500">{formatDate(order.orderDate)} · {order.species}</div>
                        </div>
                        <div className="text-sm font-semibold text-gray-900">{formatCurrency(order.totalValue)}</div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className={cn('rounded-full px-2 py-0.5 font-medium', getStatusColor(order.shipmentStatus))}>
                          {formatStatus(order.shipmentStatus)}
                        </span>
                        <span className={cn('rounded-full px-2 py-0.5 font-medium', getStatusColor(order.qualityFlag))}>
                          {formatStatus(order.qualityFlag)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {data.recentOrders.length === 0 && (
                    <div className="rounded-lg border border-dashed border-gray-200 p-3 text-sm text-gray-500">
                      No orders recorded yet.
                    </div>
                  )}
                </div>
              </Section>

              <Section title="Timeline">
                <div className="space-y-4">
                  {data.timeline.slice(0, 12).map((event) => (
                    <div key={event.id} className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 rounded-full bg-[var(--brand-blue)]" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">{event.title}</span>
                          <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.3em]', severityStyles[event.severity])}>
                            {event.type}
                          </span>
                        </div>
                        {event.description && (
                          <p className="mt-1 text-sm text-gray-600">{event.description}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-400">{formatDate(event.timestamp)} · {formatRelativeTime(new Date(event.timestamp))}</p>
                      </div>
                    </div>
                  ))}
                  {data.timeline.length === 0 && (
                    <div className="rounded-lg border border-dashed border-gray-200 p-3 text-sm text-gray-500">
                      No events recorded yet.
                    </div>
                  )}
                </div>
              </Section>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
