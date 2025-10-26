'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  TreePine,
  GitBranch,
  Users,
  ChevronDown,
  ChevronRight,
  Maximize2,
  Minimize2,
  Search,
  Filter,
  Download,
  Eye,
  Info,
  Calendar,
  MapPin,
  Dna,
  Award,
  Package,
  Target,
  Activity,
  Heart,
  CheckCircle,
  AlertTriangle,
  Zap,
  Link
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import Button from '@/components/ui/Button';

interface GenealogyNode {
  id: string;
  species: string;
  generation: number;
  birthDate: Date;
  origin: string;
  parents: string[];
  children: string[];
  quantity: number;
  currentWeight: number;
  healthStatus: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  breedingValue: number; // 0-100 score
  geneticMarkers: Record<string, string>;
  achievements: string[];
  isFounder: boolean;
  location: string;
  notes: string;
}

interface TreeLayout {
  node: GenealogyNode;
  x: number;
  y: number;
  level: number;
  children: TreeLayout[];
  collapsed?: boolean;
}

export default function BatchGenealogyTree() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGeneration, setFilterGeneration] = useState<number | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'tree' | 'pedigree' | 'descendants'>('tree');
  const [rootNode, setRootNode] = useState<string>('BST-2023-001');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // Mock genealogy data
  const genealogyNodes: GenealogyNode[] = useMemo(() => [
    {
      id: 'BST-2023-001',
      species: 'Pacific White Shrimp (Litopenaeus vannamei)',
      generation: 1,
      birthDate: new Date('2023-01-15'),
      origin: 'Foundation Stock - Hawaii',
      parents: [],
      children: ['BST-2023-087', 'BST-2023-089'],
      quantity: 200,
      currentWeight: 15.2,
      healthStatus: 'excellent',
      breedingValue: 98,
      geneticMarkers: {
        'WSSV_Resistance': 'AA',
        'Growth_Rate': 'AB',
        'Disease_Tolerance': 'BB',
        'Feed_Efficiency': 'AA'
      },
      achievements: ['SPF Certified', 'Top Breeder 2023', 'Disease Resistant Line'],
      isFounder: true,
      location: 'Broodstock Tank A-01',
      notes: 'Exceptional foundation stock with superior genetic traits'
    },
    {
      id: 'BST-2023-002',
      species: 'Pacific White Shrimp (Litopenaeus vannamei)',
      generation: 1,
      birthDate: new Date('2023-02-01'),
      origin: 'Foundation Stock - Ecuador',
      parents: [],
      children: ['BST-2023-087', 'BST-2023-089', 'BST-2023-091'],
      quantity: 180,
      currentWeight: 14.8,
      healthStatus: 'excellent',
      breedingValue: 95,
      geneticMarkers: {
        'WSSV_Resistance': 'AB',
        'Growth_Rate': 'BB',
        'Disease_Tolerance': 'AA',
        'Feed_Efficiency': 'AB'
      },
      achievements: ['BAP Certified', 'Fast Growth Line'],
      isFounder: true,
      location: 'Broodstock Tank A-02',
      notes: 'High-performance breeding line with superior disease resistance'
    },
    {
      id: 'BST-2023-087',
      species: 'Pacific White Shrimp (Litopenaeus vannamei)',
      generation: 2,
      birthDate: new Date('2023-06-15'),
      origin: 'Hawaii Breeding Facility',
      parents: ['BST-2023-001', 'BST-2023-002'],
      children: ['BST-2024-001', 'BST-2024-003', 'BST-2024-005'],
      quantity: 1500,
      currentWeight: 8.5,
      healthStatus: 'excellent',
      breedingValue: 96,
      geneticMarkers: {
        'WSSV_Resistance': 'AB',
        'Growth_Rate': 'AB',
        'Disease_Tolerance': 'AB',
        'Feed_Efficiency': 'AA'
      },
      achievements: ['F2 Hybrid Vigor', 'Top Growth Rate'],
      isFounder: false,
      location: 'Breeding Tank B-15',
      notes: 'F2 generation showing excellent hybrid vigor and balanced traits'
    },
    {
      id: 'BST-2023-089',
      species: 'Pacific White Shrimp (Litopenaeus vannamei)',
      generation: 2,
      birthDate: new Date('2023-07-01'),
      origin: 'Hawaii Breeding Facility',
      parents: ['BST-2023-001', 'BST-2023-002'],
      children: ['BST-2024-001', 'BST-2024-002', 'BST-2024-004'],
      quantity: 1200,
      currentWeight: 7.8,
      healthStatus: 'good',
      breedingValue: 93,
      geneticMarkers: {
        'WSSV_Resistance': 'AA',
        'Growth_Rate': 'BB',
        'Disease_Tolerance': 'AB',
        'Feed_Efficiency': 'AB'
      },
      achievements: ['Disease Resistance Champion'],
      isFounder: false,
      location: 'Breeding Tank B-16',
      notes: 'Selected for breeding program continuation with focus on disease resistance'
    },
    {
      id: 'BST-2023-091',
      species: 'Pacific White Shrimp (Litopenaeus vannamei)',
      generation: 2,
      birthDate: new Date('2023-07-20'),
      origin: 'Hawaii Breeding Facility',
      parents: ['BST-2023-002'],
      children: ['BST-2024-006'],
      quantity: 800,
      currentWeight: 7.2,
      healthStatus: 'good',
      breedingValue: 88,
      geneticMarkers: {
        'WSSV_Resistance': 'AB',
        'Growth_Rate': 'AA',
        'Disease_Tolerance': 'BB',
        'Feed_Efficiency': 'BB'
      },
      achievements: ['Fast Growth Specialist'],
      isFounder: false,
      location: 'Breeding Tank B-17',
      notes: 'Specialized line for rapid growth characteristics'
    },
    {
      id: 'BST-2024-001',
      species: 'Pacific White Shrimp (Litopenaeus vannamei)',
      generation: 3,
      birthDate: new Date('2024-01-15'),
      origin: 'Hawaii Breeding Facility',
      parents: ['BST-2023-087', 'BST-2023-089'],
      children: [],
      quantity: 5000,
      currentWeight: 2.3,
      healthStatus: 'excellent',
      breedingValue: 94,
      geneticMarkers: {
        'WSSV_Resistance': 'AB',
        'Growth_Rate': 'AB',
        'Disease_Tolerance': 'AB',
        'Feed_Efficiency': 'AA'
      },
      achievements: ['F3 Commercial Excellence', 'Organic Certified'],
      isFounder: false,
      location: 'Tank A-15, Building 3',
      notes: 'F3 generation with optimal commercial characteristics and balanced genetics'
    },
    {
      id: 'BST-2024-002',
      species: 'Pacific White Shrimp (Litopenaeus vannamei)',
      generation: 3,
      birthDate: new Date('2024-02-20'),
      origin: 'Hawaii Breeding Facility',
      parents: ['BST-2023-089'],
      children: [],
      quantity: 3200,
      currentWeight: 1.8,
      healthStatus: 'good',
      breedingValue: 89,
      geneticMarkers: {
        'WSSV_Resistance': 'AA',
        'Growth_Rate': 'AB',
        'Disease_Tolerance': 'BB',
        'Feed_Efficiency': 'AB'
      },
      achievements: ['Export Quality'],
      isFounder: false,
      location: 'Tank B-08, Building 2',
      notes: 'Selected for international export markets with strong disease resistance'
    }
  ], []);

  // Filter nodes based on search and generation
  const filteredNodes = useMemo(() => {
    return genealogyNodes.filter(node => {
      const matchesSearch = node.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          node.species.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          node.origin.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGeneration = filterGeneration === null || node.generation === filterGeneration;
      return matchesSearch && matchesGeneration;
    });
  }, [genealogyNodes, searchTerm, filterGeneration]);

  // Build tree structure
  const buildTreeStructure = (nodeId: string, visited = new Set<string>()): TreeLayout | null => {
    if (visited.has(nodeId)) return null;
    visited.add(nodeId);

    const node = genealogyNodes.find(n => n.id === nodeId);
    if (!node) return null;

    const children = node.children
      .map(childId => buildTreeStructure(childId, visited))
      .filter(Boolean) as TreeLayout[];

    return {
      node,
      x: 0,
      y: 0,
      level: node.generation,
      children,
      collapsed: !expandedNodes.has(nodeId)
    };
  };

  // Calculate tree layout positions
  const calculateLayout = (tree: TreeLayout, x = 0, y = 0, spacing = { x: 200, y: 100 }): TreeLayout => {
    const nodeWidth = 180;
    const nodeHeight = 80;

    if (!tree.collapsed && tree.children.length > 0) {
      // Calculate positions for children
      const childX = x - ((tree.children.length - 1) * spacing.x) / 2;
      
      tree.children.forEach((child, index) => {
        const childLayout = calculateLayout(
          child,
          childX + index * spacing.x,
          y + spacing.y,
          spacing
        );
        tree.children[index] = childLayout;
      });
    }

    return {
      ...tree,
      x,
      y
    };
  };

  const treeStructure = useMemo(() => {
    const tree = buildTreeStructure(rootNode);
    return tree ? calculateLayout(tree, 400, 50) : null;
  }, [rootNode, expandedNodes, genealogyNodes]);

  const toggleNode = (nodeId: string) => {
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
      case 'excellent': return '#10B981';
      case 'good': return '#3B82F6';
      case 'fair': return '#F59E0B';
      case 'poor': return '#EF4444';
      case 'critical': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const getBreedingValueColor = (value: number) => {
    if (value >= 95) return '#10B981';
    if (value >= 90) return '#3B82F6';
    if (value >= 85) return '#F59E0B';
    if (value >= 80) return '#EF4444';
    return '#6B7280';
  };

  // Render tree node
  const renderTreeNode = (layout: TreeLayout): React.ReactNode => {
    const { node, x, y, children, collapsed } = layout;
    const hasChildren = children.length > 0;

    return (
      <g key={node.id} transform={`translate(${x}, ${y})`}>
        {/* Connection lines to children */}
        {!collapsed && hasChildren && children.map((child) => (
          <line
            key={child.node.id}
            x1={0}
            y1={40}
            x2={child.x - x}
            y2={child.y - y}
            stroke="#E5E7EB"
            strokeWidth={2}
          />
        ))}

        {/* Node */}
        <g
          onClick={() => setSelectedNode(node.id)}
          className="cursor-pointer"
          style={{ filter: selectedNode === node.id ? 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' : 'none' }}
        >
          <rect
            x={-90}
            y={-40}
            width={180}
            height={80}
            rx={8}
            fill={selectedNode === node.id ? '#EFF6FF' : '#FFFFFF'}
            stroke={selectedNode === node.id ? '#3B82F6' : '#E5E7EB'}
            strokeWidth={selectedNode === node.id ? 2 : 1}
          />

          {/* Health status indicator */}
          <circle
            cx={75}
            cy={-25}
            r={4}
            fill={getHealthStatusColor(node.healthStatus)}
          />

          {/* Generation badge */}
          <circle
            cx={-75}
            cy={-25}
            r={12}
            fill="#F3F4F6"
            stroke="#D1D5DB"
          />
          <text
            x={-75}
            y={-20}
            textAnchor="middle"
            fontSize="10"
            fill="#374151"
            fontWeight="600"
          >
            G{node.generation}
          </text>

          {/* Node ID */}
          <text
            x={0}
            y={-15}
            textAnchor="middle"
            fontSize="12"
            fontWeight="600"
            fill="#111827"
          >
            {node.id}
          </text>

          {/* Breeding Value */}
          <text
            x={0}
            y={0}
            textAnchor="middle"
            fontSize="10"
            fill={getBreedingValueColor(node.breedingValue)}
            fontWeight="500"
          >
            BV: {node.breedingValue}
          </text>

          {/* Quantity */}
          <text
            x={0}
            y={15}
            textAnchor="middle"
            fontSize="9"
            fill="#6B7280"
          >
            {node.quantity.toLocaleString()} ind.
          </text>

          {/* Weight */}
          <text
            x={0}
            y={28}
            textAnchor="middle"
            fontSize="9"
            fill="#6B7280"
          >
            {node.currentWeight} kg
          </text>

          {/* Expand/Collapse button */}
          {hasChildren && (
            <g
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
              className="cursor-pointer"
            >
              <circle
                cx={0}
                cy={50}
                r={12}
                fill="#F3F4F6"
                stroke="#D1D5DB"
              />
              {collapsed ? (
                <text x={0} y={55} textAnchor="middle" fontSize="12" fill="#374151">+</text>
              ) : (
                <text x={0} y={55} textAnchor="middle" fontSize="12" fill="#374151">-</text>
              )}
            </g>
          )}

          {/* Founder indicator */}
          {node.isFounder && (
            <circle
              cx={60}
              cy={25}
              r={6}
              fill="#F59E0B"
              stroke="#FFFFFF"
              strokeWidth={2}
            />
          )}
        </g>

        {/* Render children */}
        {!collapsed && children.map((child) => renderTreeNode(child))}
      </g>
    );
  };

  const selectedNodeData = genealogyNodes.find(n => n.id === selectedNode);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Batch Genealogy Tree</h2>
          <p className="text-gray-600">Visualize breeding relationships and genetic lineage</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={() => setZoomLevel(z => Math.min(2, z + 0.1))}>
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.1))}>
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Root Node</label>
            <select
              value={rootNode}
              onChange={(e) => setRootNode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {genealogyNodes
                .filter(n => n.generation === 1)
                .map(node => (
                  <option key={node.id} value={node.id}>
                    {node.id} - {node.species.split('(')[0].trim()}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search batches..."
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
              <option value="pedigree">Pedigree Chart</option>
              <option value="descendants">Descendants</option>
            </select>
          </div>

          <div className="flex items-end space-x-2">
            <Button variant="outline" className="flex-1" onClick={() => setExpandedNodes(new Set(genealogyNodes.map(n => n.id)))}>
              Expand All
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setExpandedNodes(new Set())}>
              Collapse
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tree Visualization */}
        <div className="lg:col-span-3 bg-white rounded-lg border border-gray-200 p-4">
          <div className="h-[600px] overflow-auto border border-gray-100 rounded-lg">
            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              viewBox="0 0 800 600"
              className="min-h-[600px]"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#F3F4F6" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {treeStructure && renderTreeNode(treeStructure)}
            </svg>
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Excellent Health</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span>Good Health</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span>Fair Health</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span>Founder Stock</span>
              </div>
            </div>
            <div className="text-xs">
              Zoom: {(zoomLevel * 100).toFixed(0)}% | BV: Breeding Value
            </div>
          </div>
        </div>

        {/* Node Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Node Details</h3>
          
          {selectedNodeData ? (
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{selectedNodeData.id}</h4>
                  <span className="text-sm text-gray-500">Gen {selectedNodeData.generation}</span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Species:</span>
                    <span className="font-medium text-right">{selectedNodeData.species.split('(')[0].trim()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Birth Date:</span>
                    <span className="font-medium">{format(selectedNodeData.birthDate, 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Age:</span>
                    <span className="font-medium">{differenceInDays(new Date(), selectedNodeData.birthDate)} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Origin:</span>
                    <span className="font-medium text-right">{selectedNodeData.origin}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium text-right">{selectedNodeData.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quantity:</span>
                    <span className="font-medium">{selectedNodeData.quantity.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Weight:</span>
                    <span className="font-medium">{selectedNodeData.currentWeight} kg</span>
                  </div>
                </div>
              </div>

              {/* Breeding Value */}
              <div>
                <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Target className="h-4 w-4 mr-2" />
                  Breeding Value: {selectedNodeData.breedingValue}
                </h5>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${selectedNodeData.breedingValue}%`,
                      backgroundColor: getBreedingValueColor(selectedNodeData.breedingValue)
                    }}
                  />
                </div>
              </div>

              {/* Health Status */}
              <div>
                <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Heart className="h-4 w-4 mr-2" />
                  Health Status
                </h5>
                <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium`} style={{
                  backgroundColor: getHealthStatusColor(selectedNodeData.healthStatus) + '20',
                  color: getHealthStatusColor(selectedNodeData.healthStatus)
                }}>
                  {selectedNodeData.healthStatus === 'excellent' && <CheckCircle className="h-4 w-4 mr-2" />}
                  {selectedNodeData.healthStatus === 'good' && <CheckCircle className="h-4 w-4 mr-2" />}
                  {(selectedNodeData.healthStatus === 'fair' || selectedNodeData.healthStatus === 'poor' || selectedNodeData.healthStatus === 'critical') && <AlertTriangle className="h-4 w-4 mr-2" />}
                  <span className="capitalize">{selectedNodeData.healthStatus}</span>
                </div>
              </div>

              {/* Genetic Markers */}
              <div>
                <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Dna className="h-4 w-4 mr-2" />
                  Genetic Markers
                </h5>
                <div className="space-y-2">
                  {Object.entries(selectedNodeData.geneticMarkers).map(([marker, value]) => (
                    <div key={marker} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{marker.replace('_', ' ')}:</span>
                      <span className={`font-medium px-2 py-1 rounded text-xs ${
                        value === 'AA' ? 'bg-green-100 text-green-800' :
                        value === 'AB' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Parents */}
              {selectedNodeData.parents.length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                    <GitBranch className="h-4 w-4 mr-2" />
                    Parents
                  </h5>
                  <div className="space-y-2">
                    {selectedNodeData.parents.map(parentId => (
                      <button
                        key={parentId}
                        onClick={() => setSelectedNode(parentId)}
                        className="block w-full text-left text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                      >
                        {parentId}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Children */}
              {selectedNodeData.children.length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Children ({selectedNodeData.children.length})
                  </h5>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {selectedNodeData.children.map(childId => (
                      <button
                        key={childId}
                        onClick={() => setSelectedNode(childId)}
                        className="block w-full text-left text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                      >
                        {childId}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Achievements */}
              {selectedNodeData.achievements.length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Award className="h-4 w-4 mr-2" />
                    Achievements
                  </h5>
                  <div className="space-y-2">
                    {selectedNodeData.achievements.map((achievement, index) => (
                      <div key={index} className="flex items-center text-sm text-blue-700 bg-blue-50 px-2 py-1 rounded">
                        <Award className="h-3 w-3 mr-2" />
                        {achievement}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedNodeData.notes && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Notes</h5>
                  <p className="text-sm text-gray-600">{selectedNodeData.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2 pt-4 border-t border-gray-200">
                <Button size="sm" className="flex-1">
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
                <Button size="sm" variant="outline">
                  <Link className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <TreePine className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Click on a node to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}