'use client';

import React, { useState, useMemo } from 'react';
import {
  Shield,
  Award,
  CheckCircle,
  AlertTriangle,
  Clock,
  Calendar,
  FileText,
  Eye,
  Download,
  Upload,
  RefreshCw,
  Plus,
  Filter,
  Search,
  Users,
  MapPin,
  Package,
  Zap,
  AlertCircle,
  Info,
  Star,
  Target,
  Activity,
  ExternalLink,
  CheckSquare,
  XCircle
} from 'lucide-react';
import { format, addMonths, differenceInDays, isBefore, isAfter } from 'date-fns';
import Button from '@/components/ui/Button';
import ExportButton from '@/components/ui/ExportButton';

interface Certification {
  id: string;
  name: string;
  type: 'organic' | 'spf' | 'bap' | 'asc' | 'global_gap' | 'usda' | 'eu_organic' | 'custom';
  issuingBody: string;
  certificateNumber: string;
  issueDate: Date;
  expiryDate: Date;
  status: 'active' | 'expired' | 'pending' | 'suspended' | 'revoked';
  scope: string[];
  requirements: ComplianceRequirement[];
  documents: CertificationDocument[];
  auditHistory: AuditRecord[];
  nextAudit?: Date;
  notes: string;
}

interface ComplianceRequirement {
  id: string;
  category: string;
  requirement: string;
  status: 'compliant' | 'non_compliant' | 'partial' | 'pending';
  lastCheck: Date;
  nextCheck: Date;
  evidence: string[];
  responsible: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  notes: string;
}

interface CertificationDocument {
  id: string;
  name: string;
  type: 'certificate' | 'audit_report' | 'compliance_checklist' | 'corrective_action' | 'evidence';
  uploadDate: Date;
  fileSize: number;
  uploadedBy: string;
  url: string;
}

interface AuditRecord {
  id: string;
  auditor: string;
  auditDate: Date;
  auditType: 'initial' | 'surveillance' | 'recertification' | 'complaint' | 'follow_up';
  outcome: 'pass' | 'pass_with_conditions' | 'fail' | 'pending';
  findings: AuditFinding[];
  correctiveActions: CorrectiveAction[];
  score?: number;
  nextAuditDate?: Date;
  report?: string;
}

interface AuditFinding {
  id: string;
  category: string;
  severity: 'minor' | 'major' | 'critical';
  description: string;
  requirement: string;
  status: 'open' | 'closed' | 'pending';
  dueDate: Date;
}

interface CorrectiveAction {
  id: string;
  description: string;
  responsible: string;
  dueDate: Date;
  status: 'open' | 'in_progress' | 'completed' | 'overdue';
  evidence: string[];
  verifiedBy?: string;
  verificationDate?: Date;
}

interface BatchCertification {
  batchId: string;
  species: string;
  currentLocation: string;
  certifications: Certification[];
  complianceScore: number;
  lastAudit: Date;
  nextAudit: Date;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  activeNonCompliances: number;
  overdueActions: number;
}

export default function BatchCertificationCompliance() {
  const [selectedBatch, setSelectedBatch] = useState<string>('BST-2024-001');
  const [activeTab, setActiveTab] = useState<'overview' | 'certifications' | 'compliance' | 'audits'>('overview');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCertification, setSelectedCertification] = useState<string | null>(null);

  // Mock certification data
  const batchCertifications: BatchCertification[] = useMemo(() => [
    {
      batchId: 'BST-2024-001',
      species: 'Pacific White Shrimp (Litopenaeus vannamei)',
      currentLocation: 'Tank A-15, Building 3',
      complianceScore: 92,
      lastAudit: new Date('2024-08-15'),
      nextAudit: new Date('2025-02-15'),
      riskLevel: 'low',
      activeNonCompliances: 2,
      overdueActions: 0,
      certifications: [
        {
          id: 'cert_001',
          name: 'Specific Pathogen Free (SPF)',
          type: 'spf',
          issuingBody: 'World Aquaculture Society',
          certificateNumber: 'SPF-2024-001-US',
          issueDate: new Date('2024-01-15'),
          expiryDate: new Date('2025-01-15'),
          status: 'active',
          scope: ['Disease Testing', 'Quarantine Protocols', 'Health Monitoring'],
          requirements: [
            {
              id: 'req_001',
              category: 'Health Testing',
              requirement: 'Monthly pathogen screening',
              status: 'compliant',
              lastCheck: new Date('2024-09-01'),
              nextCheck: new Date('2024-10-01'),
              evidence: ['test_results_sept_2024.pdf'],
              responsible: 'Dr. Sarah Chen',
              priority: 'high',
              notes: 'All tests negative for target pathogens'
            },
            {
              id: 'req_002',
              category: 'Quarantine',
              requirement: 'Minimum 30-day quarantine for new stock',
              status: 'compliant',
              lastCheck: new Date('2024-08-20'),
              nextCheck: new Date('2024-11-20'),
              evidence: ['quarantine_log_q3_2024.pdf'],
              responsible: 'Mike Johnson',
              priority: 'critical',
              notes: 'Quarantine protocols strictly followed'
            }
          ],
          documents: [
            {
              id: 'doc_001',
              name: 'SPF Certificate 2024',
              type: 'certificate',
              uploadDate: new Date('2024-01-15'),
              fileSize: 2048576,
              uploadedBy: 'Admin',
              url: '/documents/spf_cert_2024.pdf'
            }
          ],
          auditHistory: [
            {
              id: 'audit_001',
              auditor: 'WAS Certification Team',
              auditDate: new Date('2024-08-15'),
              auditType: 'surveillance',
              outcome: 'pass',
              findings: [],
              correctiveActions: [],
              score: 95,
              nextAuditDate: new Date('2025-02-15')
            }
          ],
          nextAudit: new Date('2025-02-15'),
          notes: 'Excellent compliance record with no major findings'
        },
        {
          id: 'cert_002',
          name: 'Organic Aquaculture',
          type: 'organic',
          issuingBody: 'USDA National Organic Program',
          certificateNumber: 'USDA-ORG-2024-AQ-789',
          issueDate: new Date('2024-03-01'),
          expiryDate: new Date('2025-03-01'),
          status: 'active',
          scope: ['Feed Management', 'Chemical Restrictions', 'Environmental Standards'],
          requirements: [
            {
              id: 'req_003',
              category: 'Feed Management',
              requirement: 'Use only certified organic feed',
              status: 'compliant',
              lastCheck: new Date('2024-09-15'),
              nextCheck: new Date('2024-12-15'),
              evidence: ['feed_certificates_q3_2024.pdf'],
              responsible: 'Lisa Williams',
              priority: 'high',
              notes: 'All feed suppliers certified organic'
            },
            {
              id: 'req_004',
              category: 'Chemical Use',
              requirement: 'No synthetic chemical treatments',
              status: 'partial',
              lastCheck: new Date('2024-09-10'),
              nextCheck: new Date('2024-10-10'),
              evidence: ['treatment_log_2024.pdf'],
              responsible: 'Dr. Sarah Chen',
              priority: 'critical',
              notes: 'Minor non-compliance: emergency antibiotic use documented'
            }
          ],
          documents: [
            {
              id: 'doc_002',
              name: 'USDA Organic Certificate',
              type: 'certificate',
              uploadDate: new Date('2024-03-01'),
              fileSize: 1536000,
              uploadedBy: 'Admin',
              url: '/documents/usda_organic_cert.pdf'
            }
          ],
          auditHistory: [
            {
              id: 'audit_002',
              auditor: 'Oregon Tilth',
              auditDate: new Date('2024-07-20'),
              auditType: 'surveillance',
              outcome: 'pass_with_conditions',
              findings: [
                {
                  id: 'finding_001',
                  category: 'Treatment Records',
                  severity: 'minor',
                  description: 'Incomplete documentation for emergency treatment',
                  requirement: 'Complete treatment documentation required',
                  status: 'closed',
                  dueDate: new Date('2024-08-20')
                }
              ],
              correctiveActions: [
                {
                  id: 'ca_001',
                  description: 'Implement enhanced treatment documentation system',
                  responsible: 'Dr. Sarah Chen',
                  dueDate: new Date('2024-08-20'),
                  status: 'completed',
                  evidence: ['new_treatment_forms.pdf'],
                  verifiedBy: 'Oregon Tilth',
                  verificationDate: new Date('2024-08-25')
                }
              ],
              score: 88,
              nextAuditDate: new Date('2025-01-20')
            }
          ],
          nextAudit: new Date('2025-01-20'),
          notes: 'Minor finding resolved. Good overall compliance'
        },
        {
          id: 'cert_003',
          name: 'Best Aquaculture Practices (BAP)',
          type: 'bap',
          issuingBody: 'Global Aquaculture Alliance',
          certificateNumber: 'BAP-2024-456-FARM',
          issueDate: new Date('2024-04-10'),
          expiryDate: new Date('2027-04-10'),
          status: 'active',
          scope: ['Environmental Management', 'Social Responsibility', 'Animal Welfare', 'Food Safety'],
          requirements: [
            {
              id: 'req_005',
              category: 'Environmental',
              requirement: 'Water quality monitoring program',
              status: 'compliant',
              lastCheck: new Date('2024-09-20'),
              nextCheck: new Date('2024-10-20'),
              evidence: ['water_quality_reports_sept.pdf'],
              responsible: 'Environmental Team',
              priority: 'high',
              notes: 'All parameters within acceptable ranges'
            }
          ],
          documents: [],
          auditHistory: [],
          nextAudit: new Date('2025-04-10'),
          notes: 'Three-year certification valid until 2027'
        }
      ]
    }
  ], []);

  const selectedBatchData = batchCertifications.find(b => b.batchId === selectedBatch);

  // Filter certifications
  const filteredCertifications = useMemo(() => {
    if (!selectedBatchData) return [];
    
    return selectedBatchData.certifications.filter(cert => {
      const matchesStatus = filterStatus === 'all' || cert.status === filterStatus;
      const matchesSearch = cert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          cert.issuingBody.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          cert.certificateNumber.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [selectedBatchData, filterStatus, searchTerm]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'expired': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'suspended': return 'text-orange-600 bg-orange-100';
      case 'revoked': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'expired': return <XCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'suspended': return <AlertTriangle className="h-4 w-4" />;
      case 'revoked': return <XCircle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-green-600 bg-green-100';
      case 'non_compliant': return 'text-red-600 bg-red-100';
      case 'partial': return 'text-yellow-600 bg-yellow-100';
      case 'pending': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskLevelColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 95) return 'text-green-600';
    if (score >= 85) return 'text-blue-600';
    if (score >= 75) return 'text-yellow-600';
    if (score >= 65) return 'text-orange-600';
    return 'text-red-600';
  };

  const exportData = {
    title: 'Batch Certification & Compliance Report',
    subtitle: `Certification status and compliance tracking for ${selectedBatch}`,
    data: selectedBatchData?.certifications || [],
    dateRange: { 
      from: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], 
      to: new Date().toISOString().split('T')[0] 
    },
    summary: [
      { label: 'Compliance Score', value: `${selectedBatchData?.complianceScore || 0}/100` },
      { label: 'Active Certifications', value: filteredCertifications.filter(c => c.status === 'active').length.toString() },
      { label: 'Risk Level', value: selectedBatchData?.riskLevel || 'Unknown' },
      { label: 'Active Non-Compliances', value: selectedBatchData?.activeNonCompliances.toString() || '0' }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Certification & Compliance</h2>
          <p className="text-gray-600">Track certifications, compliance status, and audit requirements</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {batchCertifications.map(batch => (
              <option key={batch.batchId} value={batch.batchId}>
                {batch.batchId} - {batch.species.split('(')[0].trim()}
              </option>
            ))}
          </select>
          <ExportButton exportData={exportData} />
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Certification
          </Button>
        </div>
      </div>

      {/* Batch Overview */}
      {selectedBatchData && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedBatchData.batchId}</h3>
              <p className="text-sm text-gray-600 mb-4">{selectedBatchData.species}</p>
              
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-2" />
                <span>{selectedBatchData.currentLocation}</span>
              </div>
            </div>

            <div className="text-center">
              <div className="mb-2">
                <div className={`text-3xl font-bold ${getScoreColor(selectedBatchData.complianceScore)}`}>
                  {selectedBatchData.complianceScore}
                </div>
              </div>
              <p className="text-sm font-medium text-gray-900">Compliance Score</p>
              <p className="text-xs text-gray-500">out of 100</p>
            </div>

            <div className="text-center">
              <div className="mb-2">
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${getRiskLevelColor(selectedBatchData.riskLevel)}`}>
                  <Shield className="h-6 w-6" />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-900 capitalize">{selectedBatchData.riskLevel} Risk</p>
              <p className="text-xs text-gray-500">Assessment</p>
            </div>

            <div className="text-center">
              <div className="mb-2">
                <div className="text-lg font-semibold text-gray-900">
                  {format(selectedBatchData.lastAudit, 'MMM dd')}
                </div>
              </div>
              <p className="text-sm font-medium text-gray-900">Last Audit</p>
              <p className="text-xs text-gray-500">{differenceInDays(new Date(), selectedBatchData.lastAudit)} days ago</p>
            </div>

            <div className="text-center">
              <div className="mb-2">
                <div className="text-lg font-semibold text-blue-600">
                  {format(selectedBatchData.nextAudit, 'MMM dd')}
                </div>
              </div>
              <p className="text-sm font-medium text-gray-900">Next Audit</p>
              <p className="text-xs text-gray-500">in {differenceInDays(selectedBatchData.nextAudit, new Date())} days</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {filteredCertifications.filter(c => c.status === 'active').length}
              </div>
              <div className="text-sm text-gray-600">Active Certifications</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {selectedBatchData.activeNonCompliances}
              </div>
              <div className="text-sm text-gray-600">Non-Compliances</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {selectedBatchData.overdueActions}
              </div>
              <div className="text-sm text-gray-600">Overdue Actions</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'certifications', label: 'Certifications', icon: Award },
            { id: 'compliance', label: 'Compliance', icon: CheckSquare },
            { id: 'audits', label: 'Audits', icon: Eye }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && selectedBatchData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Certification Status Summary */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Certification Status</h3>
            <div className="space-y-4">
              {selectedBatchData.certifications.slice(0, 5).map((cert) => (
                <div key={cert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${getStatusColor(cert.status)}`}>
                      {getStatusIcon(cert.status)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{cert.name}</p>
                      <p className="text-xs text-gray-500">{cert.issuingBody}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {format(cert.expiryDate, 'MMM dd, yyyy')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {differenceInDays(cert.expiryDate, new Date())} days left
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance Breakdown */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Breakdown</h3>
            <div className="space-y-4">
              {(() => {
                const allRequirements = selectedBatchData.certifications.flatMap(c => c.requirements);
                const categoryStats = allRequirements.reduce((acc, req) => {
                  if (!acc[req.category]) {
                    acc[req.category] = { total: 0, compliant: 0 };
                  }
                  acc[req.category].total++;
                  if (req.status === 'compliant') {
                    acc[req.category].compliant++;
                  }
                  return acc;
                }, {} as Record<string, { total: number; compliant: number }>);

                return Object.entries(categoryStats).map(([category, stats]) => {
                  const percentage = (stats.compliant / stats.total) * 100;
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">{category}</span>
                        <span className="text-sm text-gray-500">
                          {stats.compliant}/{stats.total} ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            percentage === 100 ? 'bg-green-500' :
                            percentage >= 80 ? 'bg-blue-500' :
                            percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Deadlines</h3>
            <div className="space-y-3">
              {(() => {
                const allDeadlines = [
                  ...selectedBatchData.certifications.map(c => ({
                    type: 'Certificate Expiry',
                    name: c.name,
                    date: c.expiryDate,
                    priority: differenceInDays(c.expiryDate, new Date()) <= 60 ? 'high' : 'medium'
                  })),
                  ...selectedBatchData.certifications
                    .filter(c => c.nextAudit)
                    .map(c => ({
                      type: 'Audit Due',
                      name: c.name,
                      date: c.nextAudit!,
                      priority: differenceInDays(c.nextAudit!, new Date()) <= 30 ? 'high' : 'medium'
                    }))
                ].sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 6);

                return allDeadlines.map((deadline, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${getPriorityColor(deadline.priority)}`}>
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{deadline.type}</p>
                        <p className="text-xs text-gray-500">{deadline.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {format(deadline.date, 'MMM dd')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {differenceInDays(deadline.date, new Date())} days
                      </p>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {[
                {
                  type: 'audit',
                  message: 'SPF surveillance audit completed',
                  date: new Date('2024-08-15'),
                  status: 'success'
                },
                {
                  type: 'compliance',
                  message: 'Monthly pathogen screening completed',
                  date: new Date('2024-09-01'),
                  status: 'success'
                },
                {
                  type: 'finding',
                  message: 'Minor finding resolved for organic certification',
                  date: new Date('2024-08-25'),
                  status: 'success'
                },
                {
                  type: 'document',
                  message: 'Feed certificate uploaded',
                  date: new Date('2024-09-15'),
                  status: 'info'
                }
              ].map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${
                    activity.status === 'success' ? 'bg-green-100 text-green-600' :
                    activity.status === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {activity.type === 'audit' && <Eye className="h-4 w-4" />}
                    {activity.type === 'compliance' && <CheckCircle className="h-4 w-4" />}
                    {activity.type === 'finding' && <AlertTriangle className="h-4 w-4" />}
                    {activity.type === 'document' && <FileText className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{format(activity.date, 'MMM dd, yyyy')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Certifications Tab */}
      {activeTab === 'certifications' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search certifications..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button variant="outline" className="w-full">
                  <Filter className="h-4 w-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </div>
          </div>

          {/* Certifications List */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="divide-y divide-gray-200">
              {filteredCertifications.map((cert) => (
                <div key={cert.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-lg ${getStatusColor(cert.status)}`}>
                        <Award className="h-6 w-6" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <h4 className="text-lg font-medium text-gray-900">{cert.name}</h4>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(cert.status)}`}>
                            {getStatusIcon(cert.status)}
                            <span className="ml-1 capitalize">{cert.status}</span>
                          </span>
                        </div>
                        
                        <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Issuing Body:</span> {cert.issuingBody}
                          </div>
                          <div>
                            <span className="font-medium">Certificate #:</span> {cert.certificateNumber}
                          </div>
                          <div>
                            <span className="font-medium">Issue Date:</span> {format(cert.issueDate, 'MMM dd, yyyy')}
                          </div>
                          <div>
                            <span className="font-medium">Expiry Date:</span> {format(cert.expiryDate, 'MMM dd, yyyy')}
                          </div>
                        </div>

                        <div className="mt-3">
                          <span className="text-sm font-medium text-gray-700">Scope:</span>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {cert.scope.map((item, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>

                        {cert.notes && (
                          <div className="mt-3">
                            <p className="text-sm text-gray-600">{cert.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedCertification(selectedCertification === cert.id ? null : cert.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {selectedCertification === cert.id ? 'Hide' : 'View'} Details
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {selectedCertification === cert.id && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Requirements */}
                        <div>
                          <h5 className="text-md font-medium text-gray-900 mb-3">Compliance Requirements</h5>
                          <div className="space-y-3">
                            {cert.requirements.map((req) => (
                              <div key={req.id} className="p-3 border border-gray-200 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-gray-900">{req.requirement}</span>
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getComplianceColor(req.status)}`}>
                                    {req.status === 'compliant' && <CheckCircle className="h-3 w-3 mr-1" />}
                                    {req.status === 'non_compliant' && <XCircle className="h-3 w-3 mr-1" />}
                                    {req.status === 'partial' && <AlertTriangle className="h-3 w-3 mr-1" />}
                                    <span className="capitalize">{req.status.replace('_', ' ')}</span>
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500">
                                  <p>Category: {req.category}</p>
                                  <p>Last Check: {format(req.lastCheck, 'MMM dd, yyyy')}</p>
                                  <p>Next Check: {format(req.nextCheck, 'MMM dd, yyyy')}</p>
                                  <p>Responsible: {req.responsible}</p>
                                </div>
                                {req.notes && (
                                  <p className="mt-2 text-xs text-gray-600">{req.notes}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Documents & Audit History */}
                        <div className="space-y-6">
                          {/* Documents */}
                          <div>
                            <h5 className="text-md font-medium text-gray-900 mb-3">Documents</h5>
                            <div className="space-y-2">
                              {cert.documents.map((doc) => (
                                <div key={doc.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                                  <div className="flex items-center space-x-2">
                                    <FileText className="h-4 w-4 text-gray-400" />
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                                      <p className="text-xs text-gray-500">
                                        {format(doc.uploadDate, 'MMM dd, yyyy')} • {(doc.fileSize / 1024 / 1024).toFixed(1)} MB
                                      </p>
                                    </div>
                                  </div>
                                  <Button variant="outline" size="sm">
                                    <Download className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                              {cert.documents.length === 0 && (
                                <p className="text-sm text-gray-500">No documents uploaded</p>
                              )}
                            </div>
                          </div>

                          {/* Recent Audits */}
                          <div>
                            <h5 className="text-md font-medium text-gray-900 mb-3">Audit History</h5>
                            <div className="space-y-3">
                              {cert.auditHistory.slice(0, 3).map((audit) => (
                                <div key={audit.id} className="p-3 border border-gray-200 rounded-lg">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-900">
                                      {audit.auditType.replace('_', ' ')} Audit
                                    </span>
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                      audit.outcome === 'pass' ? 'bg-green-100 text-green-800' :
                                      audit.outcome === 'pass_with_conditions' ? 'bg-yellow-100 text-yellow-800' :
                                      audit.outcome === 'fail' ? 'bg-red-100 text-red-800' :
                                      'bg-blue-100 text-blue-800'
                                    }`}>
                                      {audit.outcome.replace('_', ' ')}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    <p>Auditor: {audit.auditor}</p>
                                    <p>Date: {format(audit.auditDate, 'MMM dd, yyyy')}</p>
                                    {audit.score && <p>Score: {audit.score}/100</p>}
                                    {audit.nextAuditDate && (
                                      <p>Next Audit: {format(audit.nextAuditDate, 'MMM dd, yyyy')}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                              {cert.auditHistory.length === 0 && (
                                <p className="text-sm text-gray-500">No audit history available</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Additional tabs would be implemented similarly... */}
    </div>
  );
}