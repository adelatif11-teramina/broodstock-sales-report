'use client';

import React, { useState, useMemo } from 'react';
import {
  GitBranch,
  Users,
  ArrowRight,
  ArrowDown,
  Plus,
  Search,
  Filter,
  Eye,
  Calendar,
  MapPin,
  Activity,
  Dna,
  TreePine,
  Share2,
  Link,
  Copy,
  Download,
  CheckCircle,
  AlertTriangle,
  Info,
  Package
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import Button from '@/components/ui/Button';

interface BatchLineage {
  id: string;
  species: string;
  generation: number;
  birthDate: Date;
  origin: string;
  parentBatches: string[];
  childBatches: string[];
  siblings: string[];
  currentLocation: string;
  quantity: number;
  weight: number;
  healthStatus: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  breedingPurpose: 'commercial' | 'breeding' | 'research' | 'export';
  geneticMarkers: Array<{
    marker: string;
    value: string;
    confidence: number;
  }>;
  lineageNotes: string;
  certifications: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface LineageRelationship {
  parentId: string;
  childId: string;
  relationship: 'maternal' | 'paternal' | 'mixed';
  breedingDate: Date;
  success: boolean;
}

export default function BatchLineageTracker() {
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [viewMode, setViewMode] = useState<'tree' | 'table' | 'timeline'>('tree');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGeneration, setFilterGeneration] = useState<number | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Mock batch lineage data
  const batchLineages: BatchLineage[] = useMemo(() => [
    {
      id: 'BST-2023-001',
      species: 'Pacific White Shrimp (Litopenaeus vannamei)',
      generation: 1,
      birthDate: new Date('2023-01-15'),
      origin: 'Foundation Stock - Hawaii',
      parentBatches: [],
      childBatches: ['BST-2023-087', 'BST-2023-089', 'BST-2023-091'],
      siblings: [],
      currentLocation: 'Broodstock Tank A-01',
      quantity: 200,
      weight: 15.2,
      healthStatus: 'excellent',
      breedingPurpose: 'breeding',
      geneticMarkers: [
        { marker: 'WSSV_Resistance', value: 'AA', confidence: 98 },
        { marker: 'Growth_Rate', value: 'AB', confidence: 95 },
        { marker: 'Disease_Tolerance', value: 'BB', confidence: 92 }
      ],
      lineageNotes: 'Foundation stock imported from certified disease-free facility',
      certifications: ['SPF Certified', 'Genetic Testing Complete'],
      createdAt: new Date('2023-01-15'),
      updatedAt: new Date('2024-09-30')
    },
    {
      id: 'BST-2023-002',
      species: 'Pacific White Shrimp (Litopenaeus vannamei)',
      generation: 1,
      birthDate: new Date('2023-02-01'),
      origin: 'Foundation Stock - Ecuador',
      parentBatches: [],
      childBatches: ['BST-2023-087', 'BST-2023-089'],
      siblings: [],
      currentLocation: 'Broodstock Tank A-02',
      quantity: 180,
      weight: 14.8,
      healthStatus: 'excellent',
      breedingPurpose: 'breeding',
      geneticMarkers: [
        { marker: 'WSSV_Resistance', value: 'AB', confidence: 97 },
        { marker: 'Growth_Rate', value: 'BB', confidence: 94 },
        { marker: 'Disease_Tolerance', value: 'AA', confidence: 96 }
      ],
      lineageNotes: 'High-performance breeding line with superior disease resistance',
      certifications: ['SPF Certified', 'BAP Certified'],
      createdAt: new Date('2023-02-01'),
      updatedAt: new Date('2024-09-29')
    },
    {
      id: 'BST-2023-087',
      species: 'Pacific White Shrimp (Litopenaeus vannamei)',
      generation: 2,
      birthDate: new Date('2023-06-15'),
      origin: 'Hawaii Breeding Facility',
      parentBatches: ['BST-2023-001', 'BST-2023-002'],
      childBatches: ['BST-2024-001', 'BST-2024-003'],
      siblings: ['BST-2023-089'],
      currentLocation: 'Breeding Tank B-15',
      quantity: 1500,
      weight: 8.5,
      healthStatus: 'excellent',
      breedingPurpose: 'commercial',
      geneticMarkers: [
        { marker: 'WSSV_Resistance', value: 'AB', confidence: 97 },
        { marker: 'Growth_Rate', value: 'AB', confidence: 96 },
        { marker: 'Disease_Tolerance', value: 'AB', confidence: 95 }
      ],
      lineageNotes: 'F2 generation showing excellent hybrid vigor',
      certifications: ['SPF Certified'],
      createdAt: new Date('2023-06-15'),
      updatedAt: new Date('2024-09-28')
    },
    {
      id: 'BST-2023-089',
      species: 'Pacific White Shrimp (Litopenaeus vannamei)',
      generation: 2,
      birthDate: new Date('2023-07-01'),
      origin: 'Hawaii Breeding Facility',
      parentBatches: ['BST-2023-001', 'BST-2023-002'],
      childBatches: ['BST-2024-001', 'BST-2024-002'],
      siblings: ['BST-2023-087'],
      currentLocation: 'Breeding Tank B-16',
      quantity: 1200,
      weight: 7.8,
      healthStatus: 'good',
      breedingPurpose: 'breeding',
      geneticMarkers: [
        { marker: 'WSSV_Resistance', value: 'AA', confidence: 98 },
        { marker: 'Growth_Rate', value: 'BB', confidence: 93 },
        { marker: 'Disease_Tolerance', value: 'AB', confidence: 94 }
      ],
      lineageNotes: 'Selected for breeding program continuation',
      certifications: ['SPF Certified', 'Breeding Stock Certified'],
      createdAt: new Date('2023-07-01'),
      updatedAt: new Date('2024-09-27')
    },
    {
      id: 'BST-2024-001',
      species: 'Pacific White Shrimp (Litopenaeus vannamei)',
      generation: 3,
      birthDate: new Date('2024-01-15'),
      origin: 'Hawaii Breeding Facility',
      parentBatches: ['BST-2023-087', 'BST-2023-089'],
      childBatches: [],
      siblings: ['BST-2024-002', 'BST-2024-003'],
      currentLocation: 'Tank A-15, Building 3',
      quantity: 5000,
      weight: 2.3,
      healthStatus: 'excellent',
      breedingPurpose: 'commercial',
      geneticMarkers: [
        { marker: 'WSSV_Resistance', value: 'AB', confidence: 97 },
        { marker: 'Growth_Rate', value: 'AB', confidence: 95 },
        { marker: 'Disease_Tolerance', value: 'AB', confidence: 96 }
      ],
      lineageNotes: 'F3 generation with optimal commercial characteristics',
      certifications: ['SPF Certified', 'Organic Certified'],
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-09-30')
    },
    {
      id: 'BST-2024-002',
      species: 'Pacific White Shrimp (Litopenaeus vannamei)',
      generation: 3,
      birthDate: new Date('2024-02-20'),
      origin: 'Hawaii Breeding Facility',
      parentBatches: ['BST-2023-089'],
      childBatches: [],
      siblings: ['BST-2024-001', 'BST-2024-003'],
      currentLocation: 'Tank B-08, Building 2',
      quantity: 3200,
      weight: 1.8,
      healthStatus: 'good',
      breedingPurpose: 'export',
      geneticMarkers: [
        { marker: 'WSSV_Resistance', value: 'AA', confidence: 98 },
        { marker: 'Growth_Rate', value: 'AB', confidence: 94 },
        { marker: 'Disease_Tolerance', value: 'BB', confidence: 93 }
      ],
      lineageNotes: 'Selected for international export markets',
      certifications: ['SPF Certified', 'Export Certified'],
      createdAt: new Date('2024-02-20'),
      updatedAt: new Date('2024-09-29')
    }
  ], []);

  // Mock relationships data
  const relationships: LineageRelationship[] = [
    {
      parentId: 'BST-2023-001',
      childId: 'BST-2023-087',
      relationship: 'maternal',
      breedingDate: new Date('2023-05-15'),
      success: true
    },
    {
      parentId: 'BST-2023-002',
      childId: 'BST-2023-087',
      relationship: 'paternal',
      breedingDate: new Date('2023-05-15'),
      success: true
    },
    {
      parentId: 'BST-2023-087',
      childId: 'BST-2024-001',
      relationship: 'maternal',
      breedingDate: new Date('2023-12-15'),
      success: true
    },
    {
      parentId: 'BST-2023-089',
      childId: 'BST-2024-001',
      relationship: 'paternal',
      breedingDate: new Date('2023-12-15'),
      success: true
    }
  ];

  // Filter batches based on search and generation
  const filteredBatches = useMemo(() => {
    return batchLineages.filter(batch => {
      const matchesSearch = batch.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          batch.species.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          batch.origin.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGeneration = filterGeneration === null || batch.generation === filterGeneration;
      return matchesSearch && matchesGeneration;
    });
  }, [batchLineages, searchTerm, filterGeneration]);

  // Build lineage tree structure
  const buildLineageTree = (batchId: string): any => {
    const batch = batchLineages.find(b => b.id === batchId);
    if (!batch) return null;

    return {
      ...batch,
      children: batch.childBatches.map(childId => buildLineageTree(childId)).filter(Boolean)
    };
  };

  // Get lineage ancestors
  const getAncestors = (batchId: string): BatchLineage[] => {
    const batch = batchLineages.find(b => b.id === batchId);
    if (!batch || batch.parentBatches.length === 0) return [];

    const parents = batch.parentBatches
      .map(parentId => batchLineages.find(b => b.id === parentId))
      .filter(Boolean) as BatchLineage[];

    const ancestors = [...parents];
    parents.forEach(parent => {
      ancestors.push(...getAncestors(parent.id));
    });

    return ancestors;
  };

  // Get lineage descendants
  const getDescendants = (batchId: string): BatchLineage[] => {
    const batch = batchLineages.find(b => b.id === batchId);
    if (!batch || batch.childBatches.length === 0) return [];

    const children = batch.childBatches
      .map(childId => batchLineages.find(b => b.id === childId))
      .filter(Boolean) as BatchLineage[];

    const descendants = [...children];
    children.forEach(child => {
      descendants.push(...getDescendants(child.id));
    });

    return descendants;
  };

  const toggleNodeExpansion = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'fair': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="h-4 w-4" />;
      case 'good': return <CheckCircle className="h-4 w-4" />;
      case 'fair': return <Info className="h-4 w-4" />;
      case 'poor': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getPurposeColor = (purpose: string) => {
    switch (purpose) {
      case 'breeding': return 'text-purple-600 bg-purple-100';
      case 'commercial': return 'text-blue-600 bg-blue-100';
      case 'research': return 'text-orange-600 bg-orange-100';
      case 'export': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Render tree node
  const renderTreeNode = (batch: any, level: number = 0): React.ReactNode => {
    const hasChildren = batch.children && batch.children.length > 0;
    const isExpanded = expandedNodes.has(batch.id);

    return (
      <div key={batch.id} className="relative">
        <div className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all duration-200 ${
          selectedBatch === batch.id 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-200 bg-white hover:border-gray-300'
        }`} style={{ marginLeft: level * 40 }}>
          
          {hasChildren && (
            <button
              onClick={() => toggleNodeExpansion(batch.id)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              {isExpanded ? (
                <ArrowDown className="h-4 w-4 text-gray-600" />
              ) : (
                <ArrowRight className="h-4 w-4 text-gray-600" />
              )}
            </button>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-gray-600" />
                  <span className="font-medium text-gray-900">{batch.id}</span>
                  <span className="text-sm text-gray-500">Gen {batch.generation}</span>
                </div>
                
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getHealthStatusColor(batch.healthStatus)}`}>
                  {getHealthStatusIcon(batch.healthStatus)}
                  <span className="ml-1 capitalize">{batch.healthStatus}</span>
                </div>

                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPurposeColor(batch.breedingPurpose)}`}>
                  {batch.breedingPurpose}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">{batch.quantity.toLocaleString()}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedBatch(batch.id)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-1 text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <span className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {format(new Date(batch.birthDate), 'MMM dd, yyyy')}
                </span>
                <span className="flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  {batch.currentLocation}
                </span>
                {batch.parentBatches.length > 0 && (
                  <span className="flex items-center">
                    <GitBranch className="h-3 w-3 mr-1" />
                    Parents: {batch.parentBatches.join(', ')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-2 space-y-2">
            {batch.children.map((child: any) => renderTreeNode(child, level + 1))}
          </div>
        )}

        {level === 0 && hasChildren && (
          <div className="absolute left-6 top-12 bottom-0 w-px bg-gray-300" />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Batch Lineage Tracker</h2>
          <p className="text-gray-600">Track breeding relationships and genetic lineage</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Lineage
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Relationship
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Batches</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by ID, species, or origin..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Generation</label>
            <select
              value={filterGeneration || ''}
              onChange={(e) => setFilterGeneration(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Generations</option>
              <option value="1">Generation 1</option>
              <option value="2">Generation 2</option>
              <option value="3">Generation 3</option>
              <option value="4">Generation 4</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">View Mode</label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="tree">Tree View</option>
              <option value="table">Table View</option>
              <option value="timeline">Timeline View</option>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {viewMode === 'tree' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <TreePine className="h-5 w-5 mr-2" />
                  Lineage Tree
                </h3>
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline" onClick={() => setExpandedNodes(new Set(batchLineages.map(b => b.id)))}>
                    Expand All
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setExpandedNodes(new Set())}>
                    Collapse All
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {/* Render foundation stock (generation 1) as tree roots */}
                {filteredBatches
                  .filter(batch => batch.generation === 1)
                  .map(batch => renderTreeNode(buildLineageTree(batch.id)))}
              </div>
            </div>
          )}

          {viewMode === 'table' && (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Batch Lineage Table</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Batch ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Generation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Parents
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Children
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Health Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Purpose
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBatches.map((batch) => (
                      <tr key={batch.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Package className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-900">{batch.id}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Gen {batch.generation}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {batch.parentBatches.length > 0 ? batch.parentBatches.join(', ') : 'Foundation'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {batch.childBatches.length > 0 ? `${batch.childBatches.length} children` : 'None'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getHealthStatusColor(batch.healthStatus)}`}>
                            {getHealthStatusIcon(batch.healthStatus)}
                            <span className="ml-1 capitalize">{batch.healthStatus}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPurposeColor(batch.breedingPurpose)}`}>
                            {batch.breedingPurpose}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedBatch(batch.id)}
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {viewMode === 'timeline' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Breeding Timeline
              </h3>
              
              <div className="space-y-6">
                {filteredBatches
                  .sort((a, b) => new Date(a.birthDate).getTime() - new Date(b.birthDate).getTime())
                  .map((batch, index) => (
                    <div key={batch.id} className="relative">
                      {index < filteredBatches.length - 1 && (
                        <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-300" />
                      )}
                      
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">{batch.generation}</span>
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0 bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-lg font-medium text-gray-900">{batch.id}</h4>
                              <p className="text-sm text-gray-600">{format(new Date(batch.birthDate), 'MMMM dd, yyyy')}</p>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => setSelectedBatch(batch.id)}>
                              View Details
                            </Button>
                          </div>
                          
                          <div className="mt-3 flex items-center space-x-4 text-sm text-gray-600">
                            <span>Origin: {batch.origin}</span>
                            <span>Quantity: {batch.quantity.toLocaleString()}</span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getHealthStatusColor(batch.healthStatus)}`}>
                              {batch.healthStatus}
                            </span>
                          </div>
                          
                          {batch.parentBatches.length > 0 && (
                            <div className="mt-2 text-sm text-gray-600">
                              <span>Parents: {batch.parentBatches.join(', ')}</span>
                            </div>
                          )}
                          
                          {batch.childBatches.length > 0 && (
                            <div className="mt-2 text-sm text-gray-600">
                              <span>Children: {batch.childBatches.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Batch Details Sidebar */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Batch Details</h3>
          
          {selectedBatch ? (
            (() => {
              const batch = batchLineages.find(b => b.id === selectedBatch);
              if (!batch) return <p className="text-gray-500">Batch not found</p>;

              const ancestors = getAncestors(batch.id);
              const descendants = getDescendants(batch.id);

              return (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{batch.id}</h4>
                      <span className="text-sm text-gray-500">Generation {batch.generation}</span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Species:</span>
                        <span className="font-medium">{batch.species}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Birth Date:</span>
                        <span className="font-medium">{format(new Date(batch.birthDate), 'MMM dd, yyyy')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Age:</span>
                        <span className="font-medium">{differenceInDays(new Date(), new Date(batch.birthDate))} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Quantity:</span>
                        <span className="font-medium">{batch.quantity.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Weight:</span>
                        <span className="font-medium">{batch.weight} kg</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Health:</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getHealthStatusColor(batch.healthStatus)}`}>
                          {getHealthStatusIcon(batch.healthStatus)}
                          <span className="ml-1 capitalize">{batch.healthStatus}</span>
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Purpose:</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPurposeColor(batch.breedingPurpose)}`}>
                          {batch.breedingPurpose}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Genetic Markers */}
                  <div>
                    <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Dna className="h-4 w-4 mr-2" />
                      Genetic Markers
                    </h5>
                    <div className="space-y-2">
                      {batch.geneticMarkers.map((marker, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{marker.marker}:</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{marker.value}</span>
                            <span className="text-xs text-gray-500">({marker.confidence}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Lineage Info */}
                  {(batch.parentBatches.length > 0 || batch.childBatches.length > 0) && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                        <GitBranch className="h-4 w-4 mr-2" />
                        Lineage
                      </h5>
                      
                      {batch.parentBatches.length > 0 && (
                        <div className="mb-3">
                          <span className="text-sm text-gray-600">Parents:</span>
                          <div className="mt-1 space-y-1">
                            {batch.parentBatches.map(parentId => (
                              <button
                                key={parentId}
                                onClick={() => setSelectedBatch(parentId)}
                                className="block w-full text-left text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded"
                              >
                                {parentId}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {batch.childBatches.length > 0 && (
                        <div>
                          <span className="text-sm text-gray-600">Children ({batch.childBatches.length}):</span>
                          <div className="mt-1 space-y-1 max-h-32 overflow-y-auto">
                            {batch.childBatches.map(childId => (
                              <button
                                key={childId}
                                onClick={() => setSelectedBatch(childId)}
                                className="block w-full text-left text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded"
                              >
                                {childId}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {ancestors.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <span className="text-sm text-gray-600">Total Ancestors: {ancestors.length}</span>
                        </div>
                      )}

                      {descendants.length > 0 && (
                        <div className="mt-2">
                          <span className="text-sm text-gray-600">Total Descendants: {descendants.length}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Certifications */}
                  {batch.certifications.length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-3">Certifications</h5>
                      <div className="space-y-2">
                        {batch.certifications.map((cert, index) => (
                          <div key={index} className="flex items-center text-sm text-green-700 bg-green-50 px-2 py-1 rounded">
                            <CheckCircle className="h-3 w-3 mr-2" />
                            {cert}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {batch.lineageNotes && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Notes</h5>
                      <p className="text-sm text-gray-600">{batch.lineageNotes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Button size="sm" className="flex-1">
                      <Link className="h-4 w-4 mr-2" />
                      Add Relationship
                    </Button>
                    <Button size="sm" variant="outline">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Select a batch to view lineage details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}