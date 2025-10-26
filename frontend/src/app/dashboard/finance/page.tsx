'use client';

import React from 'react';
import { withAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import FinancialOverview from '@/components/finance/FinancialOverview';
import RevenueTracking from '@/components/finance/RevenueTracking';
import ExpenseManagement from '@/components/finance/ExpenseManagement';
import ProfitLossAnalysis from '@/components/finance/ProfitLossAnalysis';
import CashFlow from '@/components/finance/CashFlow';
import { DollarSign, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import Button from '@/components/ui/Button';

function FinancePage() {
  const [activeTab, setActiveTab] = React.useState<'overview' | 'revenue' | 'expenses' | 'profit-loss' | 'cash-flow'>('overview');
  const [dateRange, setDateRange] = React.useState({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
              <p className="text-gray-600">Track revenue, expenses, and profitability of your aquaculture business</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* Date Range Selector */}
            <div className="flex items-center space-x-2 bg-white rounded-lg border border-gray-200 px-3 py-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                className="text-sm focus:outline-none"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                className="text-sm focus:outline-none"
              />
            </div>
            <Button variant="outline">
              Export Report
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: DollarSign },
              { id: 'revenue', label: 'Revenue', icon: TrendingUp },
              { id: 'expenses', label: 'Expenses', icon: TrendingDown },
              { id: 'profit-loss', label: 'Profit & Loss', icon: DollarSign },
              { id: 'cash-flow', label: 'Cash Flow', icon: TrendingUp },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 inline mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'overview' && <FinancialOverview dateRange={dateRange} />}
        {activeTab === 'revenue' && <RevenueTracking dateRange={dateRange} />}
        {activeTab === 'expenses' && <ExpenseManagement dateRange={dateRange} />}
        {activeTab === 'profit-loss' && <ProfitLossAnalysis dateRange={dateRange} />}
        {activeTab === 'cash-flow' && <CashFlow dateRange={dateRange} />}
      </div>
    </DashboardLayout>
  );
}

export default withAuth(FinancePage, ['viewer', 'editor', 'manager', 'admin']);