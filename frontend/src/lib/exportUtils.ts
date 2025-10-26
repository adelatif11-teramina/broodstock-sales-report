import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';

// Extended jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface ExportData {
  title: string;
  subtitle?: string;
  data: any[];
  columns?: { header: string; dataKey: string; width?: number }[];
  dateRange?: { from: string; to: string };
  summary?: { label: string; value: any }[];
  charts?: { element: HTMLElement; title: string }[];
}

export interface ExportOptions {
  filename?: string;
  format: 'pdf' | 'excel' | 'csv';
  includeCharts?: boolean;
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'a4' | 'letter' | 'legal';
}

// Format currency for exports
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

// Format number for exports
const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value);
};

// Format date for exports
const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Export to PDF
export const exportToPDF = async (exportData: ExportData, options: ExportOptions = { format: 'pdf' }): Promise<void> => {
  const {
    filename = `${exportData.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`,
    orientation = 'portrait',
    pageSize = 'a4',
    includeCharts = false,
  } = options;

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: pageSize,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let currentY = margin;

  // Add company logo/header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Shrimp Broodstock Sales Report Platform', margin, currentY);
  currentY += 10;

  // Add title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(exportData.title, margin, currentY);
  currentY += 8;

  // Add subtitle if provided
  if (exportData.subtitle) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(exportData.subtitle, margin, currentY);
    currentY += 6;
  }

  // Add date range if provided
  if (exportData.dateRange) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Report Period: ${formatDate(exportData.dateRange.from)} - ${formatDate(exportData.dateRange.to)}`,
      margin,
      currentY
    );
    currentY += 8;
  }

  // Add generation timestamp
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, currentY);
  currentY += 12;

  // Add summary section if provided
  if (exportData.summary && exportData.summary.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', margin, currentY);
    currentY += 8;

    exportData.summary.forEach((item) => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const value = typeof item.value === 'number' && item.label.toLowerCase().includes('amount')
        ? formatCurrency(item.value)
        : typeof item.value === 'number'
        ? formatNumber(item.value)
        : item.value;
      doc.text(`${item.label}: ${value}`, margin, currentY);
      currentY += 5;
    });
    currentY += 8;
  }

  // Add table if data is provided
  if (exportData.data && exportData.data.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Detailed Data', margin, currentY);
    currentY += 8;

    const columns = exportData.columns || Object.keys(exportData.data[0]).map(key => ({
      header: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
      dataKey: key,
    }));

    const tableData = exportData.data.map(row => 
      columns.map(col => {
        const value = row[col.dataKey];
        if (typeof value === 'number' && (col.dataKey.toLowerCase().includes('amount') || 
            col.dataKey.toLowerCase().includes('price') || col.dataKey.toLowerCase().includes('cost') || 
            col.dataKey.toLowerCase().includes('revenue') || col.dataKey.toLowerCase().includes('profit'))) {
          return formatCurrency(value);
        } else if (typeof value === 'number') {
          return formatNumber(value);
        } else if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))) {
          return formatDate(value);
        }
        return value || '';
      })
    );

    doc.autoTable({
      head: [columns.map(col => col.header)],
      body: tableData,
      startY: currentY,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Add charts if requested and provided
  if (includeCharts && exportData.charts && exportData.charts.length > 0) {
    for (const chart of exportData.charts) {
      // Check if we need a new page
      if (currentY > pageHeight - 80) {
        doc.addPage();
        currentY = margin;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(chart.title, margin, currentY);
      currentY += 10;

      try {
        const canvas = await html2canvas(chart.element, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - 2 * margin;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Check if image fits on current page
        if (currentY + imgHeight > pageHeight - margin) {
          doc.addPage();
          currentY = margin;
        }

        doc.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 10;
      } catch (error) {
        console.warn('Failed to capture chart:', error);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text('Chart could not be exported', margin, currentY);
        currentY += 10;
      }
    }
  }

  // Add footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - margin - 20,
      pageHeight - 10
    );
    doc.text(
      'Confidential - Shrimp Broodstock Sales Report Platform',
      margin,
      pageHeight - 10
    );
  }

  // Save the PDF
  doc.save(`${filename}.pdf`);
};

// Export to Excel
export const exportToExcel = (exportData: ExportData, options: ExportOptions = { format: 'excel' }): void => {
  const {
    filename = `${exportData.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`,
  } = options;

  const workbook = XLSX.utils.book_new();

  // Create summary worksheet if summary data exists
  if (exportData.summary && exportData.summary.length > 0) {
    const summaryData = [
      ['Shrimp Broodstock Sales Report Platform'],
      [''],
      [exportData.title],
      exportData.subtitle ? [exportData.subtitle] : [],
      [''],
      exportData.dateRange ? [`Report Period: ${formatDate(exportData.dateRange.from)} - ${formatDate(exportData.dateRange.to)}`] : [],
      [`Generated on: ${new Date().toLocaleString()}`],
      [''],
      ['Executive Summary'],
      [''],
      ...exportData.summary.map(item => [
        item.label,
        typeof item.value === 'number' && item.label.toLowerCase().includes('amount')
          ? formatCurrency(item.value)
          : typeof item.value === 'number'
          ? formatNumber(item.value)
          : item.value
      ])
    ].filter(row => row.length > 0);

    const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Style the summary sheet
    if (summaryWS['A1']) summaryWS['A1'].s = { font: { bold: true, sz: 16 } };
    if (summaryWS['A3']) summaryWS['A3'].s = { font: { bold: true, sz: 14 } };
    if (summaryWS['A9']) summaryWS['A9'].s = { font: { bold: true, sz: 12 } };

    XLSX.utils.book_append_sheet(workbook, summaryWS, 'Summary');
  }

  // Create data worksheet
  if (exportData.data && exportData.data.length > 0) {
    const columns = exportData.columns || Object.keys(exportData.data[0]).map(key => ({
      header: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
      dataKey: key,
    }));

    const worksheetData = [
      columns.map(col => col.header),
      ...exportData.data.map(row => 
        columns.map(col => {
          const value = row[col.dataKey];
          if (typeof value === 'number') {
            return value;
          } else if (value instanceof Date) {
            return value.toISOString().split('T')[0];
          } else if (typeof value === 'string' && !isNaN(Date.parse(value))) {
            return new Date(value).toISOString().split('T')[0];
          }
          return value || '';
        })
      )
    ];

    const dataWS = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Auto-size columns
    const colWidths = columns.map((col, index) => {
      const maxLength = Math.max(
        col.header.length,
        ...exportData.data.map(row => {
          const value = row[col.dataKey];
          return String(value || '').length;
        })
      );
      return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
    });
    dataWS['!cols'] = colWidths;

    // Style header row
    const headerRange = XLSX.utils.decode_range(dataWS['!ref'] || 'A1');
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (dataWS[cellAddress]) {
        dataWS[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: 'EEEEEE' } },
        };
      }
    }

    XLSX.utils.book_append_sheet(workbook, dataWS, 'Data');
  }

  // Save the workbook
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

// Export to CSV
export const exportToCSV = (exportData: ExportData, options: ExportOptions = { format: 'csv' }): void => {
  const {
    filename = `${exportData.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`,
  } = options;

  if (!exportData.data || exportData.data.length === 0) {
    console.warn('No data to export to CSV');
    return;
  }

  const columns = exportData.columns || Object.keys(exportData.data[0]).map(key => ({
    header: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
    dataKey: key,
  }));

  const csvContent = [
    // Header row
    columns.map(col => `"${col.header}"`).join(','),
    // Data rows
    ...exportData.data.map(row => 
      columns.map(col => {
        const value = row[col.dataKey];
        if (typeof value === 'number') {
          return value;
        } else if (value instanceof Date) {
          return `"${formatDate(value)}"`;
        } else if (typeof value === 'string' && !isNaN(Date.parse(value))) {
          return `"${formatDate(value)}"`;
        }
        return `"${String(value || '').replace(/"/g, '""')}"`;
      }).join(',')
    )
  ].join('\n');

  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Main export function
export const exportData = async (exportData: ExportData, options: ExportOptions): Promise<void> => {
  try {
    switch (options.format) {
      case 'pdf':
        await exportToPDF(exportData, options);
        break;
      case 'excel':
        exportToExcel(exportData, options);
        break;
      case 'csv':
        exportToCSV(exportData, options);
        break;
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
};

// Get chart elements for export
export const getChartElements = (containerSelector: string): { element: HTMLElement; title: string }[] => {
  const container = document.querySelector(containerSelector);
  if (!container) return [];

  const charts: { element: HTMLElement; title: string }[] = [];
  
  // Find all chart containers
  const chartContainers = container.querySelectorAll('[data-chart-title]');
  chartContainers.forEach((chartContainer) => {
    const element = chartContainer as HTMLElement;
    const title = element.getAttribute('data-chart-title') || 'Chart';
    charts.push({ element, title });
  });

  // If no charts with data-chart-title, look for common chart containers
  if (charts.length === 0) {
    const rechartContainers = container.querySelectorAll('.recharts-wrapper');
    rechartContainers.forEach((chartContainer, index) => {
      const element = chartContainer.closest('.bg-white') as HTMLElement || chartContainer as HTMLElement;
      const titleElement = element.querySelector('h3');
      const title = titleElement?.textContent || `Chart ${index + 1}`;
      charts.push({ element, title });
    });
  }

  return charts;
};

// Prepare export data from component props
export const prepareExportData = (
  title: string,
  data: any[],
  options: {
    subtitle?: string;
    columns?: { header: string; dataKey: string }[];
    dateRange?: { from: string; to: string };
    summary?: { label: string; value: any }[];
    chartContainerSelector?: string;
  } = {}
): ExportData => {
  const exportData: ExportData = {
    title,
    data,
    ...options,
  };

  // Get chart elements if container selector is provided
  if (options.chartContainerSelector) {
    exportData.charts = getChartElements(options.chartContainerSelector);
  }

  return exportData;
};