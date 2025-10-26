'use client';

import React from 'react';
import { Download, FileText, FileSpreadsheet, File } from 'lucide-react';
import Button from './Button';
import { exportData, ExportData, ExportOptions } from '@/lib/exportUtils';

interface ExportButtonProps {
  exportData: ExportData;
  options?: Partial<ExportOptions>;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  showDropdown?: boolean;
  className?: string;
}

export default function ExportButton({
  exportData: data,
  options = {},
  variant = 'outline',
  size = 'sm',
  showDropdown = true,
  className = '',
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = React.useState(false);
  const [showMenu, setShowMenu] = React.useState(false);
  const [exportFormat, setExportFormat] = React.useState<'pdf' | 'excel' | 'csv'>('pdf');

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    if (isExporting) return;

    setIsExporting(true);
    setShowMenu(false);

    try {
      const exportOptions: ExportOptions = {
        format,
        ...options,
      };

      await exportData(data, exportOptions);
    } catch (error) {
      console.error('Export failed:', error);
      // You could add a toast notification here
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      case 'excel':
        return <FileSpreadsheet className="h-4 w-4" />;
      case 'csv':
        return <File className="h-4 w-4" />;
      default:
        return <Download className="h-4 w-4" />;
    }
  };

  if (!showDropdown) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={() => handleExport(exportFormat)}
        disabled={isExporting}
        className={className}
      >
        {isExporting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            Export
          </>
        )}
      </Button>
    );
  }

  return (
    <div className="relative inline-block text-left">
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowMenu(!showMenu)}
        disabled={isExporting}
        className={className}
      >
        {isExporting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            Export
          </>
        )}
      </Button>

      {showMenu && !isExporting && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 z-20 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200">
            <div className="py-1">
              <button
                onClick={() => handleExport('pdf')}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
              >
                <FileText className="h-4 w-4 mr-3 text-red-600" />
                Export as PDF
              </button>
              <button
                onClick={() => handleExport('excel')}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
              >
                <FileSpreadsheet className="h-4 w-4 mr-3 text-green-600" />
                Export as Excel
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
              >
                <File className="h-4 w-4 mr-3 text-blue-600" />
                Export as CSV
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}