'use client';

import React from 'react';
import { exportData, ExportData, ExportOptions, prepareExportData } from '@/lib/exportUtils';

interface UseExportOptions {
  title: string;
  subtitle?: string;
  dateRange?: { from: string; to: string };
  chartContainerSelector?: string;
}

export const useExport = (options: UseExportOptions) => {
  const [isExporting, setIsExporting] = React.useState(false);
  const [exportError, setExportError] = React.useState<string | null>(null);

  const exportReport = React.useCallback(async (
    data: any[],
    exportOptions: ExportOptions,
    additionalOptions?: {
      columns?: { header: string; dataKey: string }[];
      summary?: { label: string; value: any }[];
    }
  ) => {
    if (isExporting) return;

    setIsExporting(true);
    setExportError(null);

    try {
      const preparedData = prepareExportData(options.title, data, {
        subtitle: options.subtitle,
        dateRange: options.dateRange,
        chartContainerSelector: options.chartContainerSelector,
        ...additionalOptions,
      });

      await exportData(preparedData, exportOptions);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Export failed';
      setExportError(errorMessage);
      console.error('Export failed:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  }, [options, isExporting]);

  const exportFinancialReport = React.useCallback(async (
    financialData: {
      revenue: number;
      expenses: number;
      profit: number;
      margin: number;
    },
    transactions: any[],
    format: 'pdf' | 'excel' | 'csv'
  ) => {
    const summary = [
      { label: 'Total Revenue', value: financialData.revenue },
      { label: 'Total Expenses', value: financialData.expenses },
      { label: 'Net Profit', value: financialData.profit },
      { label: 'Profit Margin', value: `${financialData.margin}%` },
    ];

    const columns = [
      { header: 'Date', dataKey: 'date' },
      { header: 'Description', dataKey: 'description' },
      { header: 'Category', dataKey: 'category' },
      { header: 'Amount', dataKey: 'amount' },
      { header: 'Type', dataKey: 'type' },
    ];

    await exportReport(transactions, { format }, { summary, columns });
  }, [exportReport]);

  const exportInventoryReport = React.useCallback(async (
    inventoryData: {
      totalItems: number;
      totalValue: number;
      lowStockItems: number;
      criticalItems: number;
    },
    items: any[],
    format: 'pdf' | 'excel' | 'csv'
  ) => {
    const summary = [
      { label: 'Total Items', value: inventoryData.totalItems },
      { label: 'Total Value', value: inventoryData.totalValue },
      { label: 'Low Stock Items', value: inventoryData.lowStockItems },
      { label: 'Critical Items', value: inventoryData.criticalItems },
    ];

    const columns = [
      { header: 'SKU', dataKey: 'sku' },
      { header: 'Item Name', dataKey: 'name' },
      { header: 'Category', dataKey: 'category' },
      { header: 'Current Stock', dataKey: 'currentStock' },
      { header: 'Unit', dataKey: 'unit' },
      { header: 'Unit Price', dataKey: 'unitPrice' },
      { header: 'Total Value', dataKey: 'totalValue' },
      { header: 'Status', dataKey: 'status' },
    ];

    await exportReport(items, { format }, { summary, columns });
  }, [exportReport]);

  const exportBatchReport = React.useCallback(async (
    batchData: {
      totalBatches: number;
      activeBatches: number;
      avgSurvivalRate: number;
      totalPopulation: number;
    },
    batches: any[],
    format: 'pdf' | 'excel' | 'csv'
  ) => {
    const summary = [
      { label: 'Total Batches', value: batchData.totalBatches },
      { label: 'Active Batches', value: batchData.activeBatches },
      { label: 'Average Survival Rate', value: `${batchData.avgSurvivalRate}%` },
      { label: 'Total Population', value: batchData.totalPopulation },
    ];

    const columns = [
      { header: 'Batch ID', dataKey: 'batchId' },
      { header: 'Species', dataKey: 'species' },
      { header: 'Tank ID', dataKey: 'tankId' },
      { header: 'Status', dataKey: 'status' },
      { header: 'Health Status', dataKey: 'healthStatus' },
      { header: 'Current Population', dataKey: 'currentPopulation' },
      { header: 'Survival Rate', dataKey: 'survivalRate' },
      { header: 'Days Old', dataKey: 'daysOld' },
      { header: 'Avg Length (mm)', dataKey: 'avgLength' },
      { header: 'Avg Weight (g)', dataKey: 'avgWeight' },
    ];

    await exportReport(batches, { format }, { summary, columns });
  }, [exportReport]);

  const exportCustomerReport = React.useCallback(async (
    customerData: {
      totalCustomers: number;
      totalRevenue: number;
      avgOrderValue: number;
      repeatCustomers: number;
    },
    customers: any[],
    format: 'pdf' | 'excel' | 'csv'
  ) => {
    const summary = [
      { label: 'Total Customers', value: customerData.totalCustomers },
      { label: 'Total Revenue', value: customerData.totalRevenue },
      { label: 'Average Order Value', value: customerData.avgOrderValue },
      { label: 'Repeat Customers', value: customerData.repeatCustomers },
    ];

    const columns = [
      { header: 'Customer Name', dataKey: 'name' },
      { header: 'Email', dataKey: 'email' },
      { header: 'Phone', dataKey: 'phone' },
      { header: 'Location', dataKey: 'location' },
      { header: 'Total Orders', dataKey: 'totalOrders' },
      { header: 'Total Revenue', dataKey: 'totalRevenue' },
      { header: 'Last Order Date', dataKey: 'lastOrderDate' },
      { header: 'Customer Type', dataKey: 'customerType' },
    ];

    await exportReport(customers, { format }, { summary, columns });
  }, [exportReport]);

  const exportOrderReport = React.useCallback(async (
    orderData: {
      totalOrders: number;
      totalRevenue: number;
      avgOrderValue: number;
      pendingOrders: number;
    },
    orders: any[],
    format: 'pdf' | 'excel' | 'csv'
  ) => {
    const summary = [
      { label: 'Total Orders', value: orderData.totalOrders },
      { label: 'Total Revenue', value: orderData.totalRevenue },
      { label: 'Average Order Value', value: orderData.avgOrderValue },
      { label: 'Pending Orders', value: orderData.pendingOrders },
    ];

    const columns = [
      { header: 'Order ID', dataKey: 'orderId' },
      { header: 'Customer', dataKey: 'customerName' },
      { header: 'Date', dataKey: 'orderDate' },
      { header: 'Status', dataKey: 'status' },
      { header: 'Items', dataKey: 'itemCount' },
      { header: 'Total Amount', dataKey: 'totalAmount' },
      { header: 'Payment Status', dataKey: 'paymentStatus' },
      { header: 'Delivery Date', dataKey: 'deliveryDate' },
    ];

    await exportReport(orders, { format }, { summary, columns });
  }, [exportReport]);

  const clearError = React.useCallback(() => {
    setExportError(null);
  }, []);

  return {
    isExporting,
    exportError,
    exportReport,
    exportFinancialReport,
    exportInventoryReport,
    exportBatchReport,
    exportCustomerReport,
    exportOrderReport,
    clearError,
  };
};