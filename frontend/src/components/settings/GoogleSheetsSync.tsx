'use client';

import { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Settings,
} from 'lucide-react';

interface SyncConfig {
  google_sheets_enabled: { value: string; description: string; is_sensitive: boolean };
  google_sheets_master_sheet_id: { value: string; description: string; is_sensitive: boolean };
  google_sheets_credentials_path: { value: string; description: string; is_sensitive: boolean };
  google_sheets_customer_range: { value: string; description: string; is_sensitive: boolean };
  google_sheets_order_range: { value: string; description: string; is_sensitive: boolean };
  google_sheets_batch_range: { value: string; description: string; is_sensitive: boolean };
}

interface SyncJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'partial';
  started_at: string;
  completed_at?: string;
  records_processed: number;
  records_inserted: number;
  records_skipped: number;
  records_failed: number;
  customers_inserted: number;
  orders_inserted: number;
  batches_inserted: number;
  error_summary?: {
    customer_errors: number;
    order_errors: number;
    batch_errors: number;
  };
}

export default function GoogleSheetsSync() {
  const [config, setConfig] = useState<SyncConfig | null>(null);
  const [currentJob, setCurrentJob] = useState<SyncJob | null>(null);
  const [recentJobs, setRecentJobs] = useState<SyncJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedSheetId, setEditedSheetId] = useState('');

  // Load configuration and recent jobs
  useEffect(() => {
    loadConfig();
    loadRecentJobs();
  }, []);

  // Poll for job status if syncing
  useEffect(() => {
    if (syncing && currentJob) {
      const intervalId = setInterval(() => {
        checkJobStatus(currentJob.id);
      }, 2000); // Poll every 2 seconds

      return () => clearInterval(intervalId);
    }
  }, [syncing, currentJob]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/sync/google-sheets/config`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setConfig(data.data);
        setEditedSheetId(data.data.google_sheets_master_sheet_id?.value || '');
      } else {
        setError(data.error || 'Failed to load configuration');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const loadRecentJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/sync/google-sheets/history?limit=5&offset=0`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setRecentJobs(data.data);
      }
    } catch (err) {
      console.error('Failed to load recent jobs:', err);
    }
  };

  const checkJobStatus = async (jobId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/sync/google-sheets/status/${jobId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setCurrentJob(data.data);

        // Stop polling if job is complete
        if (['completed', 'failed', 'partial'].includes(data.data.status)) {
          setSyncing(false);
          loadRecentJobs(); // Refresh history

          if (data.data.status === 'completed') {
            setSuccess(
              `Sync completed successfully! ${data.data.records_inserted} records inserted, ${data.data.records_skipped} skipped.`
            );
          } else if (data.data.status === 'partial') {
            setError(
              `Sync completed with errors. ${data.data.records_inserted} inserted, ${data.data.records_failed} failed. Download error report below.`
            );
          } else {
            setError('Sync failed. Please check the error report.');
          }
        }
      }
    } catch (err) {
      console.error('Failed to check job status:', err);
    }
  };

  const triggerSync = async () => {
    setError(null);
    setSuccess(null);
    setSyncing(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/sync/google-sheets/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mode: 'insert_only',
          sheets_to_sync: ['customers', 'orders', 'batches'],
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCurrentJob({
          id: data.data.sync_job_id,
          status: data.data.status,
          started_at: data.data.started_at,
          records_processed: 0,
          records_inserted: 0,
          records_skipped: 0,
          records_failed: 0,
          customers_inserted: 0,
          orders_inserted: 0,
          batches_inserted: 0,
        });
      } else {
        setError(data.error || 'Failed to trigger sync');
        setSyncing(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to trigger sync');
      setSyncing(false);
    }
  };

  const downloadErrorReport = async (jobId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/sync/google-sheets/errors/${jobId}/export`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sync-errors-${jobId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download error report:', err);
      setError('Failed to download error report');
    }
  };

  const downloadTemplate = () => {
    const token = localStorage.getItem('token');
    window.open(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/sync/google-sheets/template?token=${token}`,
      '_blank'
    );
  };

  const saveSheetId = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/sync/google-sheets/config/google_sheets_master_sheet_id`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            config_value: editedSheetId,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setSuccess('Sheet ID updated successfully');
        setEditMode(false);
        loadConfig();
      } else {
        setError(data.error || 'Failed to update Sheet ID');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update Sheet ID');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'partial':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'running':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-gray-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isEnabled = config?.google_sheets_enabled?.value === 'true';
  const hasSheetId = editedSheetId && editedSheetId.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Google Sheets Sync
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Import data from Google Sheets to your database
          </p>
        </div>
        <button
          onClick={downloadTemplate}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download Template
        </button>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-800">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-green-800">{success}</p>
          </div>
          <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700">
            ×
          </button>
        </div>
      )}

      {/* Configuration */}
      <div className="p-6 bg-white border border-gray-200 rounded-lg space-y-4">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Configuration
        </h4>

        <div className="grid gap-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Sync Status</label>
              <p className="text-xs text-gray-500">Google Sheets sync is {isEnabled ? 'enabled' : 'disabled'}</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                isEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}
            >
              {isEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          {/* Sheet ID */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Google Sheet ID</label>
            {editMode ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editedSheetId}
                  onChange={(e) => setEditedSheetId(e.target.value)}
                  placeholder="Enter Sheet ID from URL"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={saveSheetId}
                  disabled={loading || !editedSheetId}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditMode(false);
                    setEditedSheetId(config?.google_sheets_master_sheet_id?.value || '');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono">
                  {hasSheetId ? editedSheetId : 'Not configured'}
                </code>
                <button
                  onClick={() => setEditMode(true)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                >
                  Edit
                </button>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Get Sheet ID from the URL: https://docs.google.com/spreadsheets/d/<strong>SHEET_ID</strong>/edit
            </p>
          </div>

          {/* Sheet Ranges */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Customers Range</label>
              <code className="block px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs font-mono">
                {config?.google_sheets_customer_range?.value || 'Customers!A:Z'}
              </code>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Orders Range</label>
              <code className="block px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs font-mono">
                {config?.google_sheets_order_range?.value || 'Orders!A:Z'}
              </code>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Batches Range</label>
              <code className="block px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs font-mono">
                {config?.google_sheets_batch_range?.value || 'Batches!A:Z'}
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Sync Action */}
      <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 mb-1">Trigger Sync</h4>
            <p className="text-sm text-gray-600 mb-4">
              Import data from your Google Sheet. Duplicates will be skipped (insert-only mode).
            </p>

            {currentJob && syncing && (
              <div className="mb-4 p-4 bg-white border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(currentJob.status)}
                  <span className="font-medium text-gray-900">Syncing in progress...</span>
                </div>
                <div className="grid grid-cols-4 gap-4 mt-3 text-sm">
                  <div>
                    <div className="text-gray-600 text-xs">Processed</div>
                    <div className="font-semibold">{currentJob.records_processed}</div>
                  </div>
                  <div>
                    <div className="text-gray-600 text-xs">Inserted</div>
                    <div className="font-semibold text-green-600">{currentJob.records_inserted}</div>
                  </div>
                  <div>
                    <div className="text-gray-600 text-xs">Skipped</div>
                    <div className="font-semibold text-yellow-600">{currentJob.records_skipped}</div>
                  </div>
                  <div>
                    <div className="text-gray-600 text-xs">Failed</div>
                    <div className="font-semibold text-red-600">{currentJob.records_failed}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={triggerSync}
            disabled={!isEnabled || !hasSheetId || syncing || loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>

        {!isEnabled && (
          <p className="text-xs text-red-600 mt-2">⚠️ Sync is disabled. Enable it in backend environment variables.</p>
        )}
        {!hasSheetId && isEnabled && (
          <p className="text-xs text-red-600 mt-2">⚠️ Please configure your Google Sheet ID first.</p>
        )}
      </div>

      {/* Recent Sync History */}
      <div className="p-6 bg-white border border-gray-200 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-4">Recent Sync History</h4>

        {recentJobs.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No sync jobs yet</p>
        ) : (
          <div className="space-y-3">
            {recentJobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  {getStatusIcon(job.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(job.started_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs text-gray-600">
                      <span>
                        <strong>{job.records_inserted}</strong> inserted
                      </span>
                      <span>
                        <strong>{job.records_skipped}</strong> skipped
                      </span>
                      {job.records_failed > 0 && (
                        <span className="text-red-600">
                          <strong>{job.records_failed}</strong> failed
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {job.records_failed > 0 && job.status !== 'running' && (
                  <button
                    onClick={() => downloadErrorReport(job.id)}
                    className="px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-white flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    Error Report
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Documentation Link */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
        <ExternalLink className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 text-sm">
          <p className="text-blue-900 font-medium mb-1">Need help setting up Google Sheets sync?</p>
          <p className="text-blue-700">
            Check out the{' '}
            <a href="/GOOGLE_SHEETS_SYNC.md" target="_blank" className="underline font-medium">
              complete setup documentation
            </a>{' '}
            for detailed instructions on configuration, sheet structure, and troubleshooting.
          </p>
        </div>
      </div>
    </div>
  );
}
